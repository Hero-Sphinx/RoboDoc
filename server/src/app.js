require('dotenv').config();
const express = require('express');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io'); // Required for Socket.io
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const triageRoutes = require('./routes/triageRoutes');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app); // Create HTTP server
const PORT = 5000;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React Frontend URL
    methods: ["GET", "POST", "PATCH"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach Socket.io instance to the app so controllers can use it
app.set('socketio', io);

// Health Check
app.get('/', (req, res) => res.send('Medical Triage API is Running with Real-Time Sockets...'));

// Link the routes
app.use('/api/triage', triageRoutes);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('📡 A doctor/client connected to the dashboard');
  socket.on('disconnect', () => {
    console.log('📡 A client disconnected');
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ MySQL Database Connected!");
    // Start the 'server' instead of 'app'
    server.listen(PORT, () => {
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