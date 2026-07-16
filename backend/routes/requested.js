import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Attempt from '../models/Attempt.js';
import { protect, authorize } from '../middleware/auth.js';
import { aiGenerateQuestions, aiGradeSubjective, aiGetPerformanceInsights } from '../utils/gemini.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforonlineexamplatform2026';

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

/* ==========================================================================
   AUTHENTICATION APIs
   ========================================================================== */

// @desc    Register a new user
// @route   POST /register or /api/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'student'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Requested Register API Error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /login or /api/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user)
    });
  } catch (error) {
    console.error('Requested Login API Error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /profile or /api/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Requested Profile GET API Error:', error);
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /profile or /api/profile
router.put('/profile', protect, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      user.email = email.toLowerCase();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser)
    });
  } catch (error) {
    console.error('Requested Profile PUT API Error:', error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});

/* ==========================================================================
   EXAM APIs
   ========================================================================== */

// @desc    Create a new exam
// @route   POST /exam/create or /api/exam/create
router.post('/exam/create', protect, authorize('teacher'), async (req, res) => {
  const { title, description, duration, passingScore, questions } = req.body;

  try {
    if (!title || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide title, duration, and at least one question' });
    }

    const exam = await Exam.create({
      title,
      description,
      creator: req.user.id,
      duration: Number(duration),
      passingScore: Number(passingScore || 40),
      questions
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error('Requested Exam Create API Error:', error);
    res.status(500).json({ message: 'Server error creating exam', error: error.message });
  }
});

// @desc    Get all exams (sanitized for students, detailed for teachers)
// @route   GET /exam or /api/exam
router.get('/exam', protect, async (req, res) => {
  try {
    const exams = await Exam.find().populate('creator');
    
    // Sanitize correct answers for students
    const sanitizedExams = exams.map(exam => {
      const examObj = exam.toObject ? exam.toObject() : exam;
      if (req.user.role === 'student' && examObj.questions) {
        examObj.questions = examObj.questions.map(q => {
          const { correctAnswer, ...rest } = q;
          return rest;
        });
      }
      return examObj;
    });

    res.json(sanitizedExams);
  } catch (error) {
    console.error('Requested Exam GET API Error:', error);
    res.status(500).json({ message: 'Server error fetching exams', error: error.message });
  }
});

// @desc    Update an exam
// @route   PUT /exam/:id or /api/exam/:id
router.put('/exam/:id', protect, authorize('teacher'), async (req, res) => {
  const { title, description, duration, passingScore, questions } = req.body;

  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const creatorId = exam.creator && typeof exam.creator === 'object' ? exam.creator._id : exam.creator;
    if (creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this exam' });
    }

    if (title !== undefined) exam.title = title;
    if (description !== undefined) exam.description = description;
    if (duration !== undefined) exam.duration = Number(duration);
    if (passingScore !== undefined) exam.passingScore = Number(passingScore);
    if (questions !== undefined) exam.questions = questions;

    const updatedExam = await exam.save();
    res.json(updatedExam);
  } catch (error) {
    console.error('Requested Exam PUT API Error:', error);
    res.status(500).json({ message: 'Server error updating exam', error: error.message });
  }
});

// @desc    Delete an exam
// @route   DELETE /exam/:id or /api/exam/:id
router.delete('/exam/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const creatorId = exam.creator && typeof exam.creator === 'object' ? exam.creator._id : exam.creator;
    if (creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this exam' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Requested Exam DELETE API Error:', error);
    res.status(500).json({ message: 'Server error deleting exam', error: error.message });
  }
});

/* ==========================================================================
   QUESTION APIs
   ========================================================================== */

// @desc    Add a question to an existing exam
// @route   POST /question/add or /api/question/add
router.post('/question/add', protect, authorize('teacher'), async (req, res) => {
  const { examId, question } = req.body;

  try {
    if (!examId || !question) {
      return res.status(400).json({ message: 'Please provide examId and question object' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const creatorId = exam.creator && typeof exam.creator === 'object' ? exam.creator._id : exam.creator;
    if (creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this exam' });
    }

    // Set default id if not provided
    const newQuestion = {
      id: question.id || `man_${Date.now()}`,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      points: Number(question.points || 1)
    };

    if (!newQuestion.questionText || !newQuestion.questionType || newQuestion.correctAnswer === undefined) {
      return res.status(400).json({ message: 'Question object must contain questionText, questionType, and correctAnswer' });
    }

    exam.questions.push(newQuestion);
    await exam.save();

    res.status(201).json({
      message: 'Question added successfully',
      question: newQuestion,
      examId
    });
  } catch (error) {
    console.error('Requested Question Add API Error:', error);
    res.status(500).json({ message: 'Server error adding question', error: error.message });
  }
});

// @desc    Generate questions using Gemini AI
// @route   POST /question/generate-ai or /api/question/generate-ai
router.post('/question/generate-ai', protect, authorize('teacher'), async (req, res) => {
  const { topic, difficulty, questionType, count } = req.body;

  try {
    if (!topic || !difficulty || !questionType) {
      return res.status(400).json({ message: 'Please provide topic, difficulty, and questionType' });
    }

    const questionCount = count ? parseInt(count) : 5;
    console.log(`Generating ${questionCount} questions on "${topic}" (${difficulty}) via Custom API...`);
    
    const questions = await aiGenerateQuestions(topic, difficulty, questionType, questionCount);
    res.json({ questions });
  } catch (error) {
    console.error('Requested Question Generate AI API Error:', error);
    res.status(500).json({ message: 'AI question generation failed', error: error.message });
  }
});

/* ==========================================================================
   RESULT APIs
   ========================================================================== */

// @desc    Submit an exam attempt
// @route   POST /submit-exam or /api/submit-exam
router.post('/submit-exam', protect, authorize('student'), async (req, res) => {
  const { examId, answers, violations } = req.body;

  try {
    if (!examId || !answers) {
      return res.status(400).json({ message: 'Exam ID and answers are required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];
    const subjectiveGradingPromises = [];

    exam.questions.forEach(q => {
      maxScore += (q.points || 1);
    });

    for (let question of exam.questions) {
      const studentAnsObj = answers.find(a => a.questionId === question.id);
      const studentAnswerText = studentAnsObj ? studentAnsObj.studentAnswer : '';
      
      let questionScore = 0;
      let questionFeedback = '';

      if (question.questionType === 'mcq' || question.questionType === 'true_false') {
        if (studentAnswerText.toString().trim().toLowerCase() === question.correctAnswer.toString().trim().toLowerCase()) {
          questionScore = question.points || 1;
          questionFeedback = 'Correct answer!';
        } else {
          questionScore = 0;
          questionFeedback = `Incorrect answer. The correct answer was: ${
            question.questionType === 'mcq' 
              ? (question.options && question.options[parseInt(question.correctAnswer)] ? question.options[parseInt(question.correctAnswer)] : question.correctAnswer)
              : question.correctAnswer
          }`;
        }
        
        totalScore += questionScore;
        gradedAnswers.push({
          questionId: question.id,
          studentAnswer: studentAnswerText,
          score: questionScore,
          aiFeedback: questionFeedback
        });
      } else if (question.questionType === 'subjective') {
        const points = question.points || 1;
        
        const gradingPromise = (async () => {
          const gradingResult = await aiGradeSubjective(
            question.questionText,
            question.correctAnswer,
            studentAnswerText,
            points
          );
          
          return {
            questionId: question.id,
            studentAnswer: studentAnswerText,
            score: gradingResult.score,
            aiFeedback: gradingResult.feedback
          };
        })();
        
        subjectiveGradingPromises.push(gradingPromise);
      }
    }

    if (subjectiveGradingPromises.length > 0) {
      const subjectiveGradedAnswers = await Promise.all(subjectiveGradingPromises);
      subjectiveGradedAnswers.forEach(ans => {
        totalScore += ans.score;
        gradedAnswers.push(ans);
      });
    }

    const percentageScore = (totalScore / maxScore) * 100;
    const isPassed = percentageScore >= (exam.passingScore || 40);

    const questionsReport = exam.questions.map(q => {
      const graded = gradedAnswers.find(ga => ga.questionId === q.id);
      return {
        questionText: q.questionText,
        type: q.questionType,
        pointsPossible: q.points || 1,
        pointsEarned: graded ? graded.score : 0,
        feedback: graded ? graded.aiFeedback : ''
      };
    });

    const violationsCount = violations ? violations.length : 0;

    const aiFeedback = await aiGetPerformanceInsights(
      exam.title,
      totalScore,
      maxScore,
      violationsCount,
      questionsReport
    );

    const attempt = await Attempt.create({
      exam: examId,
      student: req.user.id,
      answers: gradedAnswers,
      violations: violations || [],
      violationsCount,
      score: Number(totalScore.toFixed(1)),
      maxScore,
      passingScore: exam.passingScore || 40,
      isPassed,
      status: 'completed',
      aiFeedback,
      gradedByAI: true
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Requested Submit Exam API Error:', error);
    res.status(500).json({ message: 'Server error processing attempt', error: error.message });
  }
});

// @desc    Get results list (student's own attempts if student, teacher's exam attempts if teacher)
// @route   GET /results or /api/results
router.get('/results', protect, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const attempts = await Attempt.find({ student: req.user.id }).populate('exam');
      return res.json(attempts);
    } else if (req.user.role === 'teacher') {
      const exams = await Exam.find({ creator: req.user.id });
      const examIds = exams.map(e => e._id);
      const attempts = await Attempt.find({ exam: { $in: examIds } })
        .populate('exam')
        .populate('student');
      return res.json(attempts);
    } else {
      return res.status(400).json({ message: 'Invalid role for fetching results' });
    }
  } catch (error) {
    console.error('Requested Results GET API Error:', error);
    res.status(500).json({ message: 'Server error fetching results', error: error.message });
  }
});

// @desc    Get specific attempt details by ID
// @route   GET /result/:id or /api/result/:id
router.get('/result/:id', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('exam')
      .populate('student');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    const attemptStudentId = attempt.student && typeof attempt.student === 'object' ? attempt.student._id : attempt.student;
    const examCreatorId = attempt.exam && typeof attempt.exam === 'object' ? attempt.exam.creator : null;

    if (req.user.role === 'student' && attemptStudentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this attempt review' });
    }

    if (req.user.role === 'teacher' && examCreatorId && examCreatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You do not own this exam' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('Requested Result GET By ID API Error:', error);
    res.status(500).json({ message: 'Server error fetching attempt details', error: error.message });
  }
});

export default router;
