const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message');
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// ---------- Complete onboarding / update profile ----------
router.put('/me', requireAuth, async (req, res) => {
  try {
    const { name, age, gender, interestedIn, bio, location } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (age !== undefined) update.age = age;
    if (gender !== undefined) update.gender = gender;
    if (interestedIn !== undefined) update.interestedIn = interestedIn;
    if (bio !== undefined) update.bio = bio;
    if (location !== undefined) update.location = location;

    // Mark onboarding complete once the essentials are present
    const existing = await User.findById(req.userId);
    const willHave = { ...existing.toObject(), ...update };
    if (willHave.name && willHave.age && willHave.gender && willHave.location) {
      update.onboardingComplete = true;
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    res.json({ user: user.toPublicJSON(), onboardingComplete: user.onboardingComplete });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ---------- Upload / change profile photo ----------
router.post('/me/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const photoURL = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { photoURL }, { new: true });
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

// ---------- Delete my account ----------
router.delete('/me', requireAuth, async (req, res) => {
  try {
    await Message.deleteMany({ $or: [{ sender: req.userId }, { receiver: req.userId }] });
    await User.findByIdAndDelete(req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ---------- Directory / discovery feed with filters ----------
router.get('/', requireAuth, async (req, res) => {
  try {
    const { minAge, maxAge, location, gender, search } = req.query;
    const query = { _id: { $ne: req.userId }, onboardingComplete: true };

    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = Number(minAge);
      if (maxAge) query.age.$lte = Number(maxAge);
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (gender) query.gender = gender;
    if (search) query.name = { $regex: search,
