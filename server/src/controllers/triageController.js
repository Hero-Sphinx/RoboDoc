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
      urgency,
      phone 
    } = req.body;

    const io = req.app.get('socketio');

    const containsFrenchKeywords = (text) => {
      const frenchKeywords = ['mal', 'douleur', 'ventre', 'tête', 'fièvre', 'aide', 'pas', 'histoire'];
      return frenchKeywords.some(word => text?.toLowerCase().includes(word));
    };

    const detectedLanguage = containsFrenchKeywords(symptoms) ? 'French' : 'English';
    console.log(`📥 Processing request for ${patient} (Detected Lang: ${detectedLanguage})`);

    // --- SEVERITY CHECK & DOCTOR SMS ALERT ---
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
        console.error("❌ TWILIO DOCTOR ALERT ERROR:", smsError.message);
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

    // --- IMMEDIATE SOCKET EMIT ---
    io.emit('new_patient', newTriageRecord);
    console.log(`✅ Visit Record #${newTriageRecord.id} created and broadcasted.`);

    // --- PATIENT WELCOME SMS ---
    if (phone) {
      try {
        await twilioClient.messages.create({
          body: `HHPP Clinic: Hello ${patient}, your triage ID is ${finalMedicalId}. You can track your status at the clinic portal.`,
          from: process.env.TWILIO_PHONE,
          to: phone
        });
        console.log(`📲 Welcome SMS sent to patient ${patient}`);
      } catch (pSmsError) {
        console.error("⚠️ PATIENT SMS FAILED (Verify number in Twilio Trial):", pSmsError.message);
      }
    }

    // --- AI ANALYSIS ---
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

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
      const aiDiagnosis = result.response.text();

      newTriageRecord = await prisma.triageRecord.update({
        where: { id: newTriageRecord.id },
        data: { diagnosis: aiDiagnosis }
      });

      io.emit('patient_updated', newTriageRecord);
      console.log(`🤖 AI Analysis updated for ${patient}`);

    } catch (aiError) {
      console.error("⚠️ AI ERROR:", aiError.message);
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
    const { status, doctorName } = req.body; 
    const io = req.app.get('socketio');

    const updatedRecord = await prisma.triageRecord.update({
      where: { id: parseInt(id) },
      data: {
        status,
        seenBy: status === 'Seen' ? doctorName : null
      }
    }); 

    io.emit('patient_updated', updatedRecord);
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
}

/**
 * Fetch all records for Doctor Dashboard
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
 * Public Status Check for Patients (Queue Position & PDF Data)
 */
async function getPatientStatus(req, res) {
  const { medical_id } = req.params; 
  const AVG_WAIT_PER_PATIENT = 15; 

  try {
    // Find the most recent record for this ID
    const patientRecord = await prisma.triageRecord.findFirst({
      where: { medical_id: medical_id },
      orderBy: { createdAt: 'desc' }
    });

    if (!patientRecord) {
      return res.status(404).json({ error: "No active record found for this ID." });
    }

    // Calculate queue position
    const position = await prisma.triageRecord.count({
      where: {
        status: 'Pending',
        createdAt: { lt: patientRecord.createdAt }
      }
    });

    res.json({
      patientName: patientRecord.patient,
      status: patientRecord.status,
      position: patientRecord.status === 'Pending' ? position + 1 : 0,
      urgency: patientRecord.urgency,
      estimatedWait: patientRecord.status === 'Pending' ? (position * AVG_WAIT_PER_PATIENT) : 0,
      // Provide the full record so the PDF generator has data
      recordData: patientRecord 
    });
  } catch (error) {
    console.error("Error in getPatientStatus:", error);
    res.status(500).json({ error: "Server error fetching status." });
  }
}

module.exports = { 
  createTriageRecord, 
  getAllTriageRecords,
  updateTriageStatus,
  getPatientStatus 
};