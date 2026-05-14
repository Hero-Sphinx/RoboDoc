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

    // --- 2. PATIENT IDENTITY CHECK ---
    const existingPatientRecord = await prisma.triageRecord.findFirst({
      where: { patient: patient.trim() },
      orderBy: { id: 'desc' }
    });

    const finalMedicalId = existingPatientRecord 
      ? existingPatientRecord.medical_id 
      : medical_id;

    if (existingPatientRecord) {
      console.log(`🔎 Returning patient found. Re-using Medical ID: ${finalMedicalId}`);
    } else {
      console.log(`🆕 New patient detected. Assigning Medical ID: ${finalMedicalId}`);
    }

    // --- 3. SAVE TO DATABASE IMMEDIATELY ---
    // This happens BEFORE the AI call, so data is safe even if AI fails.
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
        urgency: urgency || "normal",
        status: "Pending",
        diagnosis: "AI Analysis in progress..." 
      },
    });

    console.log(`✅ Visit Record #${newTriageRecord.id} created for ID: ${finalMedicalId}`);

    // --- 4. TRY AI ANALYSIS ---
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);

      
        const model = genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" }, 
        { apiVersion: 'v1' } // THIS IS THE CRITICAL FIX
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

      // --- 5. UPDATE THE RECORD WITH THE AI RESULT ---
      newTriageRecord = await prisma.triageRecord.update({
        where: { id: newTriageRecord.id },
        data: { diagnosis: aiDiagnosis }
      });

      console.log(`🤖 AI Analysis updated for ${patient} in ${detectedLanguage}`);

    } catch (aiError) {
      console.error("⚠️ AI FAILED, but data is safe in DB:", aiError.message);
    }

    // Return the record to the frontend
    res.status(201).json(newTriageRecord);

  } catch (error) {
    console.error("--- CRITICAL DATABASE ERROR ---");
    console.error(error.message);
    res.status(500).json({
      error: 'Failed to save patient record',
      details: error.message
    });
  }
}

module.exports = { createTriageRecord };