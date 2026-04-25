const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  targetCompanies: [{ type: String }],
  targetRoles: [{ type: String }],
  stats: {
    totalSessions: { type: Number, default: 0 },
    totalQuestionsAnswered: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    topicsStudied: [{ type: String }],
    streak: { type: Number, default: 0 },
    lastActive: { type: Date }
  },
  progress: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    status: { type: String, enum: ['seen', 'practiced', 'mastered'], default: 'seen' },
    lastAttempted: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
