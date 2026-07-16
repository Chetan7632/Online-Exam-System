import mongoose from 'mongoose';
import { getModel } from '../config/db.js';

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'true_false', 'subjective'],
    required: true
  },
  options: [{
    type: String
  }], // Used for MCQ questions
  correctAnswer: {
    type: String,
    required: true
  }, // For MCQ (index or option text), True/False (true/false), Subjective (ideal answer model keyphrase)
  points: {
    type: Number,
    default: 1
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    trim: true,
    default: 'General'
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 60 // duration in minutes
  },
  passingScore: {
    type: Number,
    required: true,
    default: 40 // passing percentage (e.g., 40%)
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Exam = getModel('Exam', examSchema);
export default Exam;
