const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Interview = require('../models/Interview');
const { protect } = require('../middleware/auth');

// GET /api/users/profile  — full profile with live stats merged from interviews
router.get('/profile', protect, async (req, res) => {
  try {
    const [user, interviewStats] = await Promise.all([
      User.findById(req.user._id)
        .populate('progress.questionId', 'question topic difficulty')
        .lean(),
      Interview.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            avgScore: { $avg: { $cond: [{ $gt: ['$finalScore', 0] }, '$finalScore', null] } },
            totalDuration: { $sum: '$duration' },
            totalQuestions: { $sum: '$questionCount' },
            topicsArr: { $push: '$topic' },
          }
        }
      ])
    ]);

    const agg = interviewStats[0] || {};
    const topics = [...new Set(agg.topicsArr || [])];

    // Score trend (last 20 completed with score)
    const recentScored = await Interview.find({
      user: req.user._id, status: 'completed', finalScore: { $gt: 0 }
    }).sort({ completedAt: 1 }).select('finalScore completedAt topic').lean();

    // Compute streak
    const sessions = await Interview.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 }).select('completedAt').lean();

    let streak = 0;
    let checkDate = new Date(); checkDate.setHours(0,0,0,0);
    for (const s of sessions) {
      const d = new Date(s.completedAt); d.setHours(0,0,0,0);
      const diff = Math.floor((checkDate - d) / 86400000);
      if (diff === 0 || diff === 1) { streak++; checkDate = d; } else break;
    }

    res.json({
      ...user,
      liveStats: {
        totalSessions: agg.totalSessions || 0,
        completedSessions: agg.completedSessions || 0,
        avgScore: agg.avgScore ? parseFloat(agg.avgScore.toFixed(1)) : null,
        totalDuration: agg.totalDuration || 0,
        totalQuestions: agg.totalQuestions || 0,
        topicsStudied: topics,
        topicsCount: topics.length,
        streak,
        scoreTrend: recentScored.slice(-20),
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, targetCompanies, targetRoles } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim(), targetCompanies: targetCompanies || [], targetRoles: targetRoles || [] },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/users/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Min 6 characters' });
    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/progress
router.put('/progress', protect, async (req, res) => {
  try {
    const { questionId, status } = req.body;
    if (!questionId || !status) return res.status(400).json({ error: 'questionId and status required' });
    const user = await User.findById(req.user._id);
    const existing = user.progress.find(p => p.questionId?.toString() === questionId);
    if (existing) { existing.status = status; existing.lastAttempted = new Date(); }
    else user.progress.push({ questionId, status, lastAttempted: new Date() });
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/activity — last 90 days heatmap
router.get('/activity', protect, async (req, res) => {
  try {
    const since = new Date(); since.setDate(since.getDate() - 90);
    const sessions = await Interview.find({ user: req.user._id, createdAt: { $gte: since } })
      .select('createdAt status finalScore topic').lean();
    const map = {};
    sessions.forEach(s => {
      const key = new Date(s.createdAt).toISOString().slice(0,10);
      if (!map[key]) map[key] = { count: 0, scores: [], topics: [] };
      map[key].count++;
      if (s.finalScore > 0) map[key].scores.push(s.finalScore);
      if (s.topic) map[key].topics.push(s.topic);
    });
    res.json(Object.entries(map).map(([date, v]) => ({
      date, count: v.count,
      avgScore: v.scores.length ? parseFloat((v.scores.reduce((a,b)=>a+b,0)/v.scores.length).toFixed(1)) : null,
      topics: [...new Set(v.topics)]
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/account
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!await user.comparePassword(password)) return res.status(400).json({ error: 'Incorrect password' });
    await Interview.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
