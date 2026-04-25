const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/questions - list with filters
router.get('/', async (req, res) => {
  try {
    const { topic, difficulty, company, tag, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (company) filter.companies = { $in: [company] };
    if (tag) filter.tags = { $in: [tag] };
    if (search) filter.$or = [
      { question: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
    const total = await Question.countDocuments(filter);
    const questions = await Question.find(filter)
      .sort({ frequency: -1, upvotes: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ questions, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/topics - get topic stats
router.get('/topics', async (req, res) => {
  try {
    const stats = await Question.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$topic', count: { $sum: 1 }, easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] } }, medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } }, hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] } } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await Question.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$companies' },
      { $group: { _id: '$companies', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/questions (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json(question);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/questions/:id/upvote
router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
