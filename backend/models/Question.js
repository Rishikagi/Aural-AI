const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    enum: ['javascript', 'react', 'nodejs', 'mongodb', 'system-design', 'behavioral', 'typescript', 'css', 'dsa']
  },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  tags: [{ type: String }],
  companies: [{ type: String }],
  frequency: { type: String, enum: ['Very Common', 'Common', 'Occasional'], default: 'Common' },
  type: { type: String, enum: ['conceptual', 'coding', 'behavioral', 'system-design'], default: 'conceptual' },
  followUpQuestions: [{ type: String }],
  codeExample: { type: String, default: '' },
  tips: { type: String, default: '' },
  timeToAnswer: { type: Number, default: 120 }, // seconds
  upvotes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

questionSchema.index({ topic: 1, difficulty: 1 });
questionSchema.index({ companies: 1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model('Question', questionSchema);
