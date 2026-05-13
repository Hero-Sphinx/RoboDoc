const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function createTriageRecord(req, res) {
  try {
    
    const { 
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
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing");
        return res.status(500).json({ error: "Missing API Key" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" }, 
        { apiVersion: 'v1' } 
    );

    const language = containsFrenchKeywords(symptoms) ? 'French' : 'English';

    // 2. Updated Prompt (oxygenLevel REMOVED from the AI instructions)
    const prompt = `
      As a medical triage assistant, analyze this profile:
      - Patient: ${patient} (Age: ${age}, Gender: ${gender})
      - Vitals: Heart Rate ${heartRate} bpm, BP ${bloodPressure}, Temp ${temperature}°C
      - Symptoms: ${symptoms}
      - Meds/History: ${medications || "None"} / ${history || "None"}
      
      Provide a diagnosis and a FINAL DIRECTIVE: "STAY HOME" or "GO TO THE HOSPITAL". 
      Respond in ${language}.
    `;

    console.log(`🤖 AI is analyzing vitals for ${patient}...`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const diagnosis = response.text();

    // 3. Save to MySQL (oxygenLevel REMOVED from the data object)
    const newTriageRecord = await prisma.triageRecord.create({
      data: {
        patient: patient || "Unknown Patient",
        age: age ? parseInt(age) : null,
        gender: gender || null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        bloodPressure: bloodPressure || null,
        temperature: temperature ? parseFloat(temperature) : null,
        symptoms,
        medications: medications || null,
        history: history || null,
        urgency: urgency || "normal",
        language,
        diagnosis,
      },
    });

    console.log(`✅ Success! Record #${newTriageRecord.id} saved for ${patient}`);
    res.status(201).json(newTriageRecord);

  } catch (error) {
    console.error("--- TRIAGE ERROR REPORT ---");
    console.error("Message:", error.message); // This is where "oxygenLevel is not defined" came from
    
    res.status(500).json({ 
        error: 'An error occurred during diagnosis',
        details: error.message 
    });
  }
}

function containsFrenchKeywords(symptoms) {
  const keywords = ['fièvre', 'douleur', 'tête', 'mal', 'aide', 'hopital'];
  return keywords.some(k => symptoms?.toLowerCase().includes(k));
}

module.exports = { createTriageRecord };