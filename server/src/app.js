require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const triageRoutes = require('./routes/triageRoutes'); // 1. Router import

const prisma = new PrismaClient();
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 2. Health Check (Optional but recommended)
app.get('/', (req, res) => res.send('Medical Triage API is Running...'));

// 3. Link the routes
app.use('/api/triage', triageRoutes);

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

// Graceful Shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();