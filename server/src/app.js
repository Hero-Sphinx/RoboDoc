require('dotenv').config();
const express = require('express');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io'); // Required for Socket.io
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const triageRoutes = require('./routes/triageRoutes');
const { login } = require('./controllers/authController'); // Added Auth Controller

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app); // Create HTTP server
// Render (and most hosts) assign the port dynamically via process.env.PORT -
// binding to a hardcoded port would fail health checks in production.
const PORT = process.env.PORT || 5000;
// The deployed frontend origin (e.g. https://your-app.vercel.app), falling
// back to the local Vite dev server URL when unset.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PATCH"]
  }
});

// Middleware
// We pass the origin to the main cors middleware as well for regular API hits
app.use(cors({
  origin: CLIENT_URL
}));
app.use(express.json());

// Attach Socket.io instance to the app so controllers can use it
app.set('socketio', io);

// Health Check
app.get('/', (req, res) => res.send('Medical Triage API is Running with Real-Time Sockets...'));

// --- ROUTES ---

// 1. Authentication Route (The bridge for the Login page)
app.post('/api/auth/login', login);

// 2. Triage & Patient Routes
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
    console.log("✅ Database Connected!");
    // Start the 'server' instead of 'app'
    server.listen(PORT, () => {
      console.log(`🚀 Server heart beating on port ${PORT} (allowed origin: ${CLIENT_URL})`);
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