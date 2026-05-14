const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

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

    // --- 1. LANGUAGE DETECTION ---
    const containsFrenchKeywords = (text) => {
      const frenchKeywords = ['mal', 'douleur', 'ventre', 'tête', 'fièvre', 'aide', 'pas', 'histoire'];
      return frenchKeywords.some(word => text?.toLowerCase().includes(word));
    };

    const detectedLanguage = containsFrenchKeywords(symptoms) ? 'French' : 'English';
    console.log(`📥 Processing request for ${patient} (Detected Lang: ${detectedLanguage})`);

    // --- 2. SEVERITY CHECK (NEW LOGIC) ---
    // This ensures critical cases show up as "high" even if AI fails or user inputs "normal"
    let calculatedUrgency = urgency || "normal";
    
    const criticalKeywords = ['chest pain', 'breathing', 'breath', 'stroke', 'heart', 'unconscious', 'douleur thoracique', 'respirer'];
    const symptomsLower = symptoms?.toLowerCase() || "";
    
    // Check for keywords or abnormal vitals (HR > 100 or Temp > 39)
    if (
      criticalKeywords.some(key => symptomsLower.includes(key)) || 
      parseInt(heartRate) > 100 || 
      parseFloat(temperature) > 39
    ) {
      calculatedUrgency = "high";
      console.log(`⚠️ High urgency detected via safety check for ${patient}`);
    }

    // --- 3. PATIENT IDENTITY CHECK ---
    const existingPatientRecord = await prisma.triageRecord.findFirst({
      where: { patient: patient.trim() },
      orderBy: { id: 'desc' }
    });

    const finalMedicalId = existingPatientRecord 
      ? existingPatientRecord.medical_id 
      : medical_id;

    // --- 4. SAVE TO DATABASE IMMEDIATELY ---
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
        urgency: calculatedUrgency, // Using our calculated urgency
        status: "Pending",
        diagnosis: "AI Analysis in progress..." 
      },
    });

    console.log(`✅ Visit Record #${newTriageRecord.id} created for ID: ${finalMedicalId}`);

    // --- 5. TRY AI ANALYSIS ---
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const model = genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" }, 
        { apiVersion: 'v1' } 
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

module.exports = { 
    createTriageRecord, 
    getAllTriageRecords 
};