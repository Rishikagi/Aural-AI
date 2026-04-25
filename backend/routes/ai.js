const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { protect } = require('../middleware/auth');
const Interview = require('../models/Interview');
const User = require('../models/User');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Interviewer personas per topic ──────────────────────────────────────────
const SYSTEM_PROMPTS = {
  javascript: `You are Alex, a senior JavaScript engineer at a FAANG company conducting a technical screening. You have 10+ years of experience.

Your interview style:
- Introduce yourself briefly on the first message
- Ask ONE question at a time — never multiple
- After each answer: say what was good (1 sentence), what was missing (1-2 sentences), then give a score 1-10
- Ask natural follow-ups based on their answer
- Use phrases like "That's a solid foundation", "I'd push back a little on that", "Let's dig deeper"
- After 5 questions, give final evaluation: overall score/10, top 3 strengths, top 3 improvements, hire recommendation (Strong Hire / Hire / No Hire)
- Keep each response under 120 words except final evaluation
- Write naturally as you would speak — no bullet points, no markdown`,

  react: `You are Sarah, a Staff Frontend Engineer conducting a React technical interview.

Your interview style:
- Warm but rigorous. You care about both technical depth and practical thinking
- Ask about real problems: "Imagine you're building Instagram's story viewer..."
- After answers: give specific praise then probe deeper
- Score each answer 1-10 and explain briefly
- If they struggle, give a small hint
- After 5 questions, deliver comprehensive final feedback with score and hire recommendation
- Max 120 words per response except final evaluation
- No bullet points, no markdown, speak naturally`,

  nodejs: `You are Marcus, a Principal Backend Engineer conducting a Node.js technical interview.

Your interview style:
- Systems-focused. You care about performance, reliability, and production readiness
- Ask scenario-based questions about real production problems
- Appreciate candidates who think about edge cases, error handling, monitoring
- After answers: acknowledge good parts, challenge assumptions
- Score 1-10 with brief reasoning
- After 5 questions: full evaluation with score, strengths, gaps, recommendation
- No bullet points, no markdown, speak naturally`,

  mongodb: `You are Priya, a Senior Database Engineer conducting a MongoDB technical interview.

Your interview style:
- Focus on schema design, indexing, aggregation, and performance
- Ask practical questions about real-world database problems
- After answers: give feedback on what was correct and what was missing
- Score 1-10 with brief reasoning
- After 5 questions: full evaluation with score and hire recommendation
- No bullet points, no markdown, speak naturally`,

  'system-design': `You are Priya, a Distinguished Engineer conducting a system design interview.

Your interview style:
- Start with a large, ambiguous problem and let the candidate drive
- Ask clarifying questions if they skip requirements
- Probe decisions: "Why not use a relational DB there?", "How would this handle a data center outage?"
- Appreciate structured thinking: requirements → design → deep dive → tradeoffs
- Score overall approach after the session
- After the design discussion: full evaluation with score and hire recommendation
- No bullet points, no markdown, speak naturally`,

  behavioral: `You are Jordan, an Engineering Manager conducting behavioral interviews.

Your interview style:
- Ask one behavioral question at a time using STAR method
- Listen for: Situation clarity, specific Actions, measurable Results, learnings
- Follow up on vague answers: "Can you be more specific about what YOU did?"
- Score 1-10 based on STAR quality
- After 5 questions: full behavioral evaluation with score and hire recommendation
- No bullet points, no markdown, speak naturally`,

  dsa: `You are Chris, a senior engineer conducting a Data Structures and Algorithms interview.

Your interview style:
- Ask one coding/algorithm problem at a time
- Let candidate think out loud and guide their approach
- Ask about time and space complexity
- After each answer: evaluate approach, correctness, optimization
- Score 1-10 based on solution quality
- After 3-5 problems: full evaluation with score and hire recommendation
- No bullet points, no markdown, speak naturally`,
};

const getSystemPrompt = (topic, company, difficulty) => {
  const base = SYSTEM_PROMPTS[topic] || SYSTEM_PROMPTS.javascript;
  return `${base}

Additional context:
- Target company: ${company || 'top tech company'}
- Difficulty level: ${difficulty || 'Mixed'}
- This is a voice interview — write responses as natural spoken words only. No markdown, no bullet points, no asterisks, no numbered lists. Just plain conversational sentences.`;
};

// ── POST /api/ai/interview/start ────────────────────────────────────────────
router.post('/interview/start', protect, async (req, res) => {
  try {
    const { topic, company, difficulty, mode = 'voice' } = req.body;

    const interview = await Interview.create({
      user: req.user._id,
      topic,
      mode,
      difficulty: difficulty || 'Mixed',
      company: company || 'General',
      status: 'active',
    });

    const systemPrompt = getSystemPrompt(topic, company, difficulty);

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please start the interview now. Introduce yourself and ask the first question.' },
      ],
    });

    const aiMessage = response.choices[0].message.content;
    interview.messages.push({ role: 'interviewer', content: aiMessage });
    await interview.save();

    res.json({ interviewId: interview._id, message: aiMessage, interview });
  } catch (err) {
    console.error('Start interview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/interview/:id/message ─────────────────────────────────────
router.post('/interview/:id/message', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.status !== 'active') return res.status(400).json({ error: 'Interview is not active' });

    // Add candidate message
    interview.messages.push({ role: 'candidate', content: message });
    interview.questionCount += 1;

    // Build conversation history for Groq
    const systemPrompt = getSystemPrompt(interview.topic, interview.company, interview.difficulty);
    const conversationHistory = interview.messages.map(m => ({
      role: m.role === 'interviewer' ? 'assistant' : 'user',
      content: m.content,
    }));

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
    });

    const aiResponse = response.choices[0].message.content;

    // Detect if interview is complete
    const isComplete =
      interview.questionCount >= 5 ||
      aiResponse.toLowerCase().includes('final evaluation') ||
      aiResponse.toLowerCase().includes('overall score') ||
      aiResponse.toLowerCase().includes('strong hire') ||
      aiResponse.toLowerCase().includes('no hire') ||
      aiResponse.toLowerCase().includes('hire recommendation');

    interview.messages.push({ role: 'interviewer', content: aiResponse });

    if (isComplete) {
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.duration = Math.floor((new Date() - interview.startedAt) / 1000);
      interview.finalFeedback = aiResponse;

      // Extract score
      const scoreMatch =
        aiResponse.match(/overall score[:\s]+(\d+)/i) ||
        aiResponse.match(/(\d+)\s*(?:out of|\/)\s*10/i) ||
        aiResponse.match(/score[:\s]+(\d+)/i);
      if (scoreMatch) interview.finalScore = Math.min(10, parseInt(scoreMatch[1]));

      // Update user stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalSessions': 1,
          'stats.totalQuestionsAnswered': interview.questionCount,
        },
        $set: { 'stats.lastActive': new Date() },
        $addToSet: { 'stats.topicsStudied': interview.topic },
      });
    }

    await interview.save();
    res.json({ message: aiResponse, isComplete, interview });
  } catch (err) {
    console.error('Message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/interview/:id/complete ────────────────────────────────────
router.post('/interview/:id/complete', protect, async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'abandoned', completedAt: new Date() },
      { new: true }
    );
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/ai/interview/:id ───────────────────────────────────────────────
router.get('/interview/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });
    if (!interview) return res.status(404).json({ error: 'Not found' });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/feedback ──────────────────────────────────────────────────
router.post('/feedback', protect, async (req, res) => {
  try {
    const { question, answer, topic } = req.body;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: `You are an expert technical interviewer. Evaluate the candidate's answer concisely.
Provide exactly:
1. Score out of 10
2. What was good (2-3 sentences)
3. What was missing or could improve (2-3 sentences)
4. A one-sentence model answer hint
Write in plain text, no bullet points, no markdown.`,
        },
        {
          role: 'user',
          content: `Topic: ${topic}\nQuestion: ${question}\nCandidate Answer: ${answer}`,
        },
      ],
    });

    res.json({ feedback: response.choices[0].message.content });
  } catch (err) {
    console.error('Feedback error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;