const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import services and routes
const DataGenerator = require('./services/DataGenerator');
const AlertService = require('./services/AlertService');
const devicesRouter = require('./routes/devices');
const analyticsRouter = require('./routes/analytics');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/devices', devicesRouter);
app.use('/api/analytics', analyticsRouter);

// Initialize services
const dataGenerator = new DataGenerator(io);
const alertService = new AlertService(io);

// --- MODIFICATION START ---
// We will track connected clients to manage the data generator.
let connectedClients = 0;
// --- MODIFICATION END ---

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // --- MODIFICATION START ---
  connectedClients++;
  // If this is the first client, start the data generation.
  if (connectedClients === 1) {
    console.log('First client connected. Starting data generation...');
    dataGenerator.startGeneration();
  }
  // --- MODIFICATION END ---

  // Send initial device states
  socket.emit('initial-data', dataGenerator.getCurrentState());
  
  // Handle door opening simulation
  socket.on('simulate-door-opening', (deviceId) => {
    console.log(`Door opening simulation requested for device: ${deviceId}`);
    const anomaly = dataGenerator.simulateDoorOpening(deviceId);
    if (anomaly) {
      alertService.triggerAlert({
        deviceId,
        type: 'DOOR_OPENED',
        message: `Temperature spike detected on ${deviceId} - possible door opening`,
        severity: 'WARNING',
        value: anomaly.temperature
      });
    }
  });
  
  // Handle device control commands
  socket.on('device-command', (command) => {
    console.log(`Device command received:`, command);
    dataGenerator.handleDeviceCommand(command);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // --- MODIFICATION START ---
    connectedClients--;
    // If this was the last client, stop the data generation.
    if (connectedClients === 0) {
      console.log('Last client disconnected. Stopping data generation...');
      dataGenerator.stopGeneration();
    }
    // --- MODIFICATION END ---
  });
});

// --- MODIFICATION START ---
// We remove this line from here so it doesn't start on server boot.
// dataGenerator.startGeneration(); 
// --- MODIFICATION END ---

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Server startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
    🚀 CultureON Analytics Backend Running
    📊 Server: http://localhost:${PORT}
    🔌 WebSocket: ws://localhost:${PORT}
    🏥 Health: http://localhost:${PORT}/health
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  dataGenerator.stopGeneration();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

