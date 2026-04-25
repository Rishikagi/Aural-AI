const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['interviewer', 'candidate'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  feedback: { type: String, default: '' },
  score: { type: Number, min: 0, max: 10 }
});

const interviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  mode: { type: String, enum: ['text', 'voice'], default: 'voice' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
  company: { type: String, default: 'General' },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  messages: [messageSchema],
  questionCount: { type: Number, default: 0 },
  finalScore: { type: Number, min: 0, max: 10 },
  finalFeedback: { type: String, default: '' },
  strengths: [{ type: String }],
  improvements: [{ type: String }],
  duration: { type: Number, default: 0 }, // seconds
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
