const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

// Tracks how many live socket connections each user currently has open.
// A user can have several sockets at once (multiple tabs/devices, or a
// dev-mode double-connect from React StrictMode), so we only flip
// isActive to false once their LAST connection closes — not on every
// individual disconnect.
const connectionCounts = new Map();

function initSocket(io) {
  // Authenticate socket connections with the same JWT used for REST calls
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    // Each user joins a private room keyed by their own id
    socket.join(userId);

    const prevCount = connectionCounts.get(userId) || 0;
    connectionCounts.set(userId, prevCount + 1);

    // Only the FIRST open connection for this user flips them online
    if (prevCount === 0) {
      await User.findByIdAndUpdate(userId, { isActive: true, lastSeen: new Date() });
      io.emit('presence_update', { userId, isActive: true });
    }

    socket.on('send_message', async ({ receiverId, text, imageURL }) => {
      try {
        if (!receiverId || (!text && !imageURL)) return;
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          text: text || '',
          imageURL: imageURL || '',
        });
        io.to(receiverId).emit('receive_message', message);
        io.to(userId).emit('receive_message', message); // echo back to sender's other tabs
      } catch (err) {
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ receiverId }) => {
      io.to(receiverId).emit('typing', { userId });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      io.to(receiverId).emit('stop_typing', { userId });
    });

    socket.on('disconnect', async () => {
      const remaining = (connectionCounts.get(userId) || 1) - 1;

      if (remaining <= 0) {
        connectionCounts.delete(userId);
        // Only flip to offline once ALL of this user's connections are gone
        await User.findByIdAndUpdate(userId, { isActive: false, lastSeen: new Date() });
        io.emit('presence_update', { userId, isActive: false });
      } else {
        connectionCounts.set(userId, remaining);
      }
    });
  });
}

module.exports = initSocket;
