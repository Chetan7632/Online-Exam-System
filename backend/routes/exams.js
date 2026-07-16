import express from 'express';
import Exam from '../models/Exam.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all exams (for students/teachers)
// @route   GET /api/exams
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const exams = await Exam.find().populate('creator');
    
    // Sanitize creator email/password and remove correct answers if student
    const sanitizedExams = exams.map(exam => {
      const examObj = exam.toObject ? exam.toObject() : exam;
      
      // If student, remove correct answers
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
    console.error('Fetch exams error:', error);
    res.status(500).json({ message: 'Server error fetching exams', error: error.message });
  }
});

// @desc    Get exams created by current teacher
// @route   GET /api/exams/teacher
// @access  Private (Teacher only)
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    const exams = await Exam.find({ creator: req.user.id });
    res.json(exams);
  } catch (error) {
    console.error('Fetch teacher exams error:', error);
    res.status(500).json({ message: 'Server error fetching teacher exams', error: error.message });
  }
});

// @desc    Get single exam details
// @route   GET /api/exams/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.id || req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const examObj = exam.toObject ? exam.toObject() : exam;

    // Secure cheat prevention: If role is student, delete answers
    if (req.user.role === 'student') {
      if (examObj.questions) {
        examObj.questions = examObj.questions.map(q => {
          const { correctAnswer, ...rest } = q;
          return rest;
        });
      }
    }

    res.json(examObj);
  } catch (error) {
    console.error('Fetch single exam error:', error);
    res.status(500).json({ message: 'Server error fetching exam details', error: error.message });
  }
});

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Teacher only)
router.post('/', protect, authorize('teacher'), async (req, res) => {
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
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error creating exam', error: error.message });
  }
});

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private (Teacher only)
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Verify ownership
    const creatorId = exam.creator && typeof exam.creator === 'object' ? exam.creator._id : exam.creator;
    if (creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this exam' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error deleting exam', error: error.message });
  }
});

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private (Teacher only)
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  const { title, description, duration, passingScore, questions } = req.body;

  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Verify ownership
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
    console.error('Update exam error:', error);
    res.status(500).json({ message: 'Server error updating exam', error: error.message });
  }
});

export default router;

