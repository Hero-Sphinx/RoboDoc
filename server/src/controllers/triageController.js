const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio');

const prisma = new PrismaClient();

// Initialize Twilio Client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Submit a new triage assessment (Staff/Doctor side)
 */
async function createTriageRecord(req, res) {
  try {
    const {
      medical_id,
      patient,
      age,
      gender,
      heartRate,
      bloodPressure,
      temperature,
      symptoms,
      medications,
      history,
      urgency
    } = req.body;

    const io = req.app.get('socketio');

    const containsFrenchKeywords = (text) => {
      const frenchKeywords = ['mal', 'douleur', 'ventre', 'tête', 'fièvre', 'aide', 'pas', 'histoire'];
      return frenchKeywords.some(word => text?.toLowerCase().includes(word));
    };

    const detectedLanguage = containsFrenchKeywords(symptoms) ? 'French' : 'English';
    console.log(`📥 Processing request for ${patient} (Detected Lang: ${detectedLanguage})`);

    // --- SEVERITY CHECK & SMS TRIGGER ---
    let calculatedUrgency = urgency || "normal";
    const criticalKeywords = ['chest pain', 'breathing', 'breath', 'stroke', 'heart', 'unconscious', 'douleur thoracique', 'respirer'];
    const symptomsLower = symptoms?.toLowerCase() || "";
    
    if (
      criticalKeywords.some(key => symptomsLower.includes(key)) || 
      parseInt(heartRate) > 100 || 
      parseFloat(temperature) > 39
    ) {
      calculatedUrgency = "high";
      console.log(`⚠️ High urgency detected via safety check for ${patient}`);
      
      try {
        await twilioClient.messages.create({
          body: `🚨 EMERGENCY ALERT: ${patient} (${medical_id}) reporting ${symptoms}. Vitals: HR ${heartRate}, Temp ${temperature}. Check portal immediately.`,
          from: process.env.TWILIO_PHONE,
          to: process.env.DOCTOR_PHONE
        });
        console.log(`📲 SMS Alert sent to doctor for ${patient}`);
      } catch (smsError) {
        console.error("❌ TWILIO ERROR:", smsError.message);
      }
    }  

    // --- PATIENT IDENTITY CHECK ---
    const existingPatientRecord = await prisma.triageRecord.findFirst({
      where: { patient: patient.trim() },
      orderBy: { id: 'desc' }
    });

    const finalMedicalId = existingPatientRecord 
      ? existingPatientRecord.medical_id 
      : medical_id;

    // --- SAVE TO DATABASE ---
    let newTriageRecord = await prisma.triageRecord.create({
      data: {
        medical_id: finalMedicalId,
        patient: patient.trim() || "Unknown Patient",
        age: age ? parseInt(age) : null,
        gender: gender || null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        bloodPressure: bloodPressure || null,
        temperature: temperature ? parseFloat(temperature) : null,
        symptoms: symptoms || "No symptoms provided",
        medications: medications || null,
        history: history || null,
        urgency: calculatedUrgency,
        status: "Pending",
        diagnosis: "AI Analysis in progress..." 
      },
    });

    io.emit('new_patient', newTriageRecord);
    console.log(`✅ Visit Record #${newTriageRecord.id} created for ID: ${finalMedicalId}`);

    // --- AI ANALYSIS ---
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel(
        { model: "gemini-2.0-flash" }
      ); 

      const prompt = `
        As a medical triage assistant, analyze this profile:
        - Patient: ${patient} (Age: ${age})
        - Vitals: Heart Rate ${heartRate} bpm, BP ${bloodPressure}, Temp ${temperature}°C
        - Symptoms: ${symptoms}
        - Meds/History: ${medications || "None"} / ${history || "None"}

        CRITICAL: Your entire response must be written in ${detectedLanguage}.
        Provide a diagnosis like you are speaking directly to the patient, and a FINAL DIRECTIVE: "STAY HOME" or "GO TO THE HOSPITAL".
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiDiagnosis = response.text();

      newTriageRecord = await prisma.triageRecord.update({
        where: { id: newTriageRecord.id },
        data: { diagnosis: aiDiagnosis }
      });

      io.emit('patient_updated', newTriageRecord);
      console.log(`🤖 AI Analysis updated for ${patient} in ${detectedLanguage}`);

    } catch (aiError) {
      console.error("⚠️ AI FAILED, but data is safe in DB:", aiError.message);
    }

    res.status(201).json(newTriageRecord);

  } catch (error) {
    console.error("--- CRITICAL DATABASE ERROR ---", error.message);
    res.status(500).json({ error: 'Failed to save patient record' });
  }
}

/**
 * Update patient status (Seen/Pending)
 */
async function updateTriageStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get('socketio');

    const updatedRecord = await prisma.triageRecord.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    io.emit('patient_updated', updatedRecord);
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
}

/**
 * Fetch all records for the Doctor Dashboard
 */
async function getAllTriageRecords(req, res) {
  try {
    const records = await prisma.triageRecord.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch patient history" });
  }
}

/**
 * Public Status Check for Patients (Queue Position)
 */
async function getPatientStatus(req, res) {
  const { medical_id } = req.params;

  try {
    // 1. Find the patient's most recent record
    const patientRecord = await prisma.triageRecord.findFirst({
      where: { medical_id: medical_id },
      orderBy: { createdAt: 'desc' }
    });

    if (!patientRecord) {
      return res.status(404).json({ error: "No active record found for this ID." });
    }

    // 2. Calculate queue position (everyone 'Pending' created before this record)
    const position = await prisma.triageRecord.count({
      where: {
        status: 'Pending',
        createdAt: {
          lt: patientRecord.createdAt 
        }
      }
    });

    res.json({
      patientName: patientRecord.patient,
      status: patientRecord.status,
      position: patientRecord.status === 'Pending' ? position + 1 : 0,
      urgency: patientRecord.urgency
    });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching status." });
  }
}

module.exports = { 
  createTriageRecord, 
  getAllTriageRecords,
  updateTriageStatus,
  getPatientStatus 
};