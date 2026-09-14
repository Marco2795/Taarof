const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// ---------- Inbox: list all conversations with last message ----------
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.userId);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: myId }, { receiver: myId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', myId] }, '$receiver', '$sender'],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiver', myId] }, { $eq: ['$read', false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    const populated = await Promise.all(
      conversations.map(async (c) => {
        const otherUser = await User.findById(c._id);
        return {
          user: otherUser ? otherUser.toPublicJSON() : null,
          lastMessage: c.lastMessage,
          unreadCount: c.unreadCount,
        };
      })
    );

    res.json({ conversations: populated.filter((c) => c.user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// ---------- Message history with a specific user ----------
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.userId, read: false },
      { $set: { read: true } }
    );

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ---------- Send a message (text and/or image) — no match required ----------
router.post('/', requireAuth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || (!text && !req.body.imageURL)) {
      return res.status(400).json({ error: 'receiverId and text or image are required' });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ error: 'Recipient not found' });

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      text: text || '',
      imageURL: req.body.imageURL || '',
    });

    // req.io is attached in server.js so REST-sent messages also broadcast live
    if (req.io) {
      req.io.to(receiverId).emit('receive_message', message);
      req.io.to(req.userId).emit('receive_message', message);
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ---------- Upload a chat image, returns URL to attach to a message ----------
router.post('/upload-image', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ imageURL: `/uploads/${req.file.filename}` });
});

module.exports = router;
