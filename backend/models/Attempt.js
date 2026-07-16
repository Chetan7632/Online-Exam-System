import mongoose from 'mongoose';
import { getModel } from '../config/db.js';

const violationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tab_switch', 'fullscreen_exit', 'no_face_detected', 'multiple_faces_detected', 'clipboard_copy'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
});

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  studentAnswer: {
    type: String,
    default: ''
  },
  score: {
    type: Number,
    default: 0
  }, // Calculated score for this question (0 or points, or fractional for subjective)
  aiFeedback: {
    type: String
  } // Feedback for subjective answers
});

const attemptSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    alias: 'examId'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    alias: 'studentId'
  },
  answers: [answerSchema],
  violations: [violationSchema],
  violationsCount: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    default: 40
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['completed', 'pending_grading'],
    default: 'completed'
  },
  aiFeedback: {
    type: String,
    alias: 'feedback'
  }, // Overall critique from Gemini
  gradedByAI: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Attempt = getModel('Attempt', attemptSchema);
export default Attempt;
