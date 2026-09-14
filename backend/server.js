require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const initSocket = require('./socket/socketHandler');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
  // Detect dead connections (crashed tab, network drop) faster than the
  // library defaults (~45s worst case) so "online" status doesn't linger
  // after someone is actually gone. A clean tab close/logout still
  // disconnects instantly regardless of these values.
  pingInterval: 10000,
  pingTimeout: 8000,
});

// Make io available inside route handlers (req.io)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', name: 'Taarof API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Central error handler (e.g. multer file-type/size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

initSocket(io);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');

    // The online/offline presence state lives in an in-memory connection
    // counter (see socket/socketHandler.js), which only exists for the
    // lifetime of this process. Every time the server starts, that counter
    // is empty — meaning nobody is actually connected yet — so any user
    // left as isActive: true from before a restart/crash is stale and must
    // be reset. Without this, a user who was online when the server went
    // down (e.g. a nodemon reload) stays stuck showing "online" forever,
    // since no future 'disconnect' event will ever fire for them.
    await User.updateMany({ isActive: true }, { isActive: false });

    server.listen(PORT, () => console.log(`Taarof API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
