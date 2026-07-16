import express from 'express';
import Attempt from '../models/Attempt.js';
import Exam from '../models/Exam.js';
import { protect, authorize } from '../middleware/auth.js';
import { aiGradeSubjective, aiGetPerformanceInsights } from '../utils/gemini.js';

const router = express.Router();

// @desc    Submit an exam attempt
// @route   POST /api/attempts
// @access  Private (Student only)
router.post('/', protect, authorize('student'), async (req, res) => {
  const { examId, answers, violations } = req.body;

  try {
    if (!examId || !answers) {
      return res.status(400).json({ message: 'Exam ID and answers are required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Initialize scoring variables
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];
    const subjectiveGradingPromises = [];

    // Calculate maximum score possible
    exam.questions.forEach(q => {
      maxScore += (q.points || 1);
    });

    // Score each question
    for (let question of exam.questions) {
      const studentAnsObj = answers.find(a => a.questionId === question.id);
      const studentAnswerText = studentAnsObj ? studentAnsObj.studentAnswer : '';
      
      let questionScore = 0;
      let questionFeedback = '';

      if (question.questionType === 'mcq' || question.questionType === 'true_false') {
        // Direct match scoring
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
        // Queue subjective grading to Gemini
        const points = question.points || 1;
        
        const gradingPromise = (async () => {
          const gradingResult = await aiGradeSubjective(
            question.questionText,
            question.correctAnswer, // ideal answer
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

    // Resolve subjective grading (if any subjective questions exist)
    if (subjectiveGradingPromises.length > 0) {
      const subjectiveGradedAnswers = await Promise.all(subjectiveGradingPromises);
      subjectiveGradedAnswers.forEach(ans => {
        totalScore += ans.score;
        gradedAnswers.push(ans);
      });
    }

    // Calculate passing score & check if student passed
    const percentageScore = (totalScore / maxScore) * 100;
    const isPassed = percentageScore >= (exam.passingScore || 40);

    // Compile questions report to feed to AI insights engine
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

    // Get Overall Performance Insights from Gemini
    const aiFeedback = await aiGetPerformanceInsights(
      exam.title,
      totalScore,
      maxScore,
      violationsCount,
      questionsReport
    );

    // Create the attempt record
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
    console.error('Submit attempt error:', error);
    res.status(500).json({ message: 'Server error processing attempt', error: error.message });
  }
});

// @desc    Get current student's attempts
// @route   GET /api/attempts/student
// @access  Private (Student only)
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user.id }).populate('exam');
    res.json(attempts);
  } catch (error) {
    console.error('Fetch student attempts error:', error);
    res.status(500).json({ message: 'Server error fetching attempts', error: error.message });
  }
});

// @desc    Get attempts of teacher's exams
// @route   GET /api/attempts/teacher
// @access  Private (Teacher only)
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    // Find all exams created by this teacher
    const exams = await Exam.find({ creator: req.user.id });
    const examIds = exams.map(e => e._id);

    // Find attempts for those exams
    const attempts = await Attempt.find({ exam: { $in: examIds } })
      .populate('exam')
      .populate('student');
      
    res.json(attempts);
  } catch (error) {
    console.error('Fetch teacher student attempts error:', error);
    res.status(500).json({ message: 'Server error fetching student attempts', error: error.message });
  }
});

// @desc    Get detailed attempt logs
// @route   GET /api/attempts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('exam')
      .populate('student');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    // Security check: Only creator teacher or owner student can view this attempt
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
    console.error('Fetch attempt details error:', error);
    res.status(500).json({ message: 'Server error fetching attempt details', error: error.message });
  }
});

export default router;
