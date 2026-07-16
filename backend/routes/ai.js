import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { aiGenerateQuestions } from '../utils/gemini.js';

const router = express.Router();

// @desc    Generate questions using Gemini AI
// @route   POST /api/ai/generate-questions
// @access  Private (Teacher only)
router.post('/generate-questions', protect, authorize('teacher'), async (req, res) => {
  const { topic, difficulty, questionType, count } = req.body;

  try {
    if (!topic || !difficulty || !questionType) {
      return res.status(400).json({ message: 'Please provide topic, difficulty, and questionType' });
    }

    const questionCount = count ? parseInt(count) : 5;
    console.log(`Generating ${questionCount} questions on "${topic}" (${difficulty}) [${questionType}]...`);
    
    const questions = await aiGenerateQuestions(topic, difficulty, questionType, questionCount);
    res.json({ questions });
  } catch (error) {
    console.error('AI generate questions route error:', error);
    res.status(500).json({ message: 'AI question generation failed', error: error.message });
  }
});

export default router;
