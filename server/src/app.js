require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { createTriageRecord } = require('./controllers/triageController');

const prisma = new PrismaClient();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/triage', createTriageRecord);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ MySQL Database Connected!");
    app.listen(PORT, () => {
      console.log(`🚀 Server heart beating on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();