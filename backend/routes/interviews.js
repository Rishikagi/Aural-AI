const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const { protect } = require('../middleware/auth');

// GET /api/interviews — paginated list with filters
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, topic } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (topic) filter.topic = topic;
    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-messages');
    res.json({ interviews, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/interviews/stats — aggregate stats for history page
router.get('/stats', protect, async (req, res) => {
  try {
    const [overall, byTopic, recent] = await Promise.all([
      Interview.aggregate([
        { $match: { user: req.user._id, status: 'completed' } },
        { $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          avgScore: { $avg: { $cond: [{ $gt: ['$finalScore', 0] }, '$finalScore', null] } },
          totalDuration: { $sum: '$duration' },
          totalQuestions: { $sum: '$questionCount' },
          bestScore: { $max: '$finalScore' },
        }}
      ]),
      Interview.aggregate([
        { $match: { user: req.user._id, status: 'completed', finalScore: { $gt: 0 } } },
        { $group: {
          _id: '$topic',
          count: { $sum: 1 },
          avgScore: { $avg: '$finalScore' },
          bestScore: { $max: '$finalScore' },
        }},
        { $sort: { count: -1 } }
      ]),
      Interview.find({ user: req.user._id, status: 'completed', finalScore: { $gt: 0 } })
        .sort({ completedAt: 1 })
        .limit(20)
        .select('finalScore topic completedAt duration')
        .lean()
    ]);

    res.json({
      stats: overall[0] || {},
      byTopic,
      scoreTrend: recent,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/interviews/:id — full session
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Not found' });
    res.json(interview);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/interviews/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Interview.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
