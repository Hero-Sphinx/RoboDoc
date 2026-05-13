const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();

async function createTriageRecord(req, res) {
  try {
    const { patient, symptoms, urgency } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing from .env");
        return res.status(500).json({ error: "Server configuration error: Missing API Key" });
    }

    // 1. Initialize with the NEWEST SDK structure
    // We are passing 'v1' to ensure it avoids the broken v1beta endpoint
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 2. Use the most recent stable model ID
    // Note: As of mid-2026, 'gemini-2.5-flash' is the standard stable model
    const model = genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" }, 
        { apiVersion: 'v1' } // THIS IS THE CRITICAL FIX
    );

    const language = containsFrenchKeywords(symptoms) ? 'French' : 'English';

    const prompt = `As a medical triage assistant, analyze these symptoms: ${symptoms}. Provide a possible diagnosis, suggest general over-the-counter care, and most importantly, conclude with a clear directive: STAY HOME or GO TO THE HOSPITAL. Make sure to consider the urgency level: ${urgency}. Respond in ${language}. Include the urgency level in your response. Use authentic medical logic.`;

    console.log(`🤖 Sending request to Gemini for ${patient}...`);

    // 3. AI Generation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const diagnosis = response.text();

    // 4. Save to MySQL
    const newTriageRecord = await prisma.triageRecord.create({
      data: {
        patient: patient || "Unknown Patient", // Fallback in case patient name is missing
        symptoms,
        urgency,
        language,
        diagnosis,
        createdAt: new Date(),
      },
    });

    console.log(`✅ Triage successfully processed for ${patient}`);
    res.status(201).json(newTriageRecord);

  } catch (error) {
    console.error("--- TRIAGE ERROR REPORT ---");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    
    res.status(500).json({ 
        error: 'An error occurred during diagnosis',
        details: error.message 
    });
  }
}

function containsFrenchKeywords(symptoms) {
  const frenchKeywords = ['fièvre', 'douleur', 'tête', 'mal', 'aide', 'hopital'];
  return frenchKeywords.some(keyword => symptoms.toLowerCase().includes(keyword));
}

module.exports = { createTriageRecord };