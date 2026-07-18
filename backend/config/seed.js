import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Attempt from '../models/Attempt.js';

export const seedDatabase = async () => {
  try {
    // Check if users already exist
    const userCount = await User.find();
    if (userCount.length > 0) {
      console.log('📊 Database already populated. Skipping seeding.');
      return;
    }

    console.log('🌱 Seeding database with demo examination configurations...');

    // 1. Create Hashed Passwords
    const salt = await bcrypt.genSalt(10);
    const teacherPassword = await bcrypt.hash('teacher123', salt);
    const studentPassword = await bcrypt.hash('student123', salt);

    // 2. Create Users
    const teacher = await User.create({
      name: 'Dr. Clara Oswald',
      email: 'teacher@onlineexam.com',
      password: teacherPassword,
      role: 'teacher'
    });

    const student = await User.create({
      name: 'Danny Pink',
      email: 'student@onlineexam.com',
      password: studentPassword,
      role: 'student'
    });

    const teacherId = teacher._id;
    const studentId = student._id;

    console.log(`✅ Demo accounts initialized:`);
    console.log(`   - Instructor: teacher@onlineexam.com (teacher123)`);
    console.log(`   - Candidate: student@onlineexam.com (student123)`);

    // 3. Create Demo Exam
    const exam = await Exam.create({
      title: 'Google Gemini Developer Assessment',
      description: 'This exam tests your understanding of Large Language Models, prompt engineering principles, and the development API integrations of the Google Gemini ecosystem.',
      creator: teacherId,
      duration: 30,
      passingScore: 50,
      questions: [
        {
          id: 'q_gemini_1',
          questionText: 'Which Gemini model family is optimized for lightweight, low-latency, high-speed text generation tasks?',
          questionType: 'mcq',
          options: [
            'Gemini 1.5 Pro',
            'Gemini 1.5 Flash',
            'Gemini Ultra 1.0',
            'Gemini Nano'
          ],
          correctAnswer: '1', // Index 1: Gemini 1.5 Flash
          points: 1
        },
        {
          id: 'q_gemini_2',
          questionText: 'True or False: The Gemini 1.5 Pro model supports a native context window capability of up to 2 million tokens.',
          questionType: 'true_false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 1
        },
        {
          id: 'q_gemini_3',
          questionText: 'Explain the difference between zero-shot prompting and few-shot prompting. Under what conditions is few-shot prompting preferred?',
          questionType: 'subjective',
          options: [],
          correctAnswer: 'Zero-shot prompt gives no examples of output format. Few-shot prompt embeds one or more demonstration examples of input-output pairs. Few-shot is preferred for highly structured formats, complex stylistic rules, or domain-specific classification tasks where instructions alone fail.',
          points: 3
        }
      ]
    });

    console.log(`✅ Demo Exam seeded: "Google Gemini Developer Assessment" (${exam.questions.length} questions).`);

    // 4. Create Historic Student Attempt
    const studentAnswers = [
      {
        questionId: 'q_gemini_1',
        studentAnswer: '1', // Correct (Gemini 1.5 Flash)
        score: 1,
        aiFeedback: 'Correct answer!'
      },
      {
        questionId: 'q_gemini_2',
        studentAnswer: 'True', // Correct (True)
        score: 1,
        aiFeedback: 'Correct answer!'
      },
      {
        questionId: 'q_gemini_3',
        studentAnswer: 'Zero shot is when you ask the model to do something without giving it examples of what you want it to output, relying on general knowledge. Few shot is when you give it examples of input and output before asking the question. Few shot is better when you want the output in a very specific format or need the model to follow a precise style.',
        score: 2.5, // Partially correct (2.5 out of 3)
        aiFeedback: 'Excellent explanation. You accurately defined both terms and identified formatting constraints as a key reason for using few-shot prompts. Mentioning specific performance characteristics under scarce data would complete the explanation.'
      }
    ];

    const violations = [
      {
        type: 'tab_switch',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        details: 'Focus lost: Student switched browser tabs or minimized window.'
      }
    ];

    const attempt = await Attempt.create({
      exam: exam._id,
      student: studentId,
      answers: studentAnswers,
      violations: violations,
      violationsCount: 1,
      score: 4.5,
      maxScore: 5,
      passingScore: 50,
      isPassed: true,
      status: 'completed',
      aiFeedback: `
        <div style="font-family: inherit; line-height: 1.6;">
          <h3 style="color: #00e5ff; margin-bottom: 8px;">Cognitive Performance Index: ELITE COGNITIVE (90%)</h3>
          <p>You scored <strong>4.5 / 5.0</strong> on the <strong>Google Gemini Developer Assessment</strong> exam.</p>
          <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 10px; margin: 12px 0; border-radius: 4px;">
            <strong style="color: #f59e0b;">⚠️ Security Review:</strong> We logged <strong>1 window switch warning</strong> during your session. Please verify that notifications are disabled before beginning future examinations to prevent focus loss flags.
          </div>
          <h4 style="color: #00e5ff; margin-top: 16px;">💡 Topic Strengths</h4>
          <ul>
            <li><strong>Model Architecture selection:</strong> Spot-on recall regarding the role of Gemini 1.5 Flash.</li>
            <li><strong>Core Context Limitations:</strong> Correct identification of 1.5 Pro context thresholds.</li>
            <li><strong>Few-Shot Logic:</strong> Strong grasp of custom output structures and stylistic guidance.</li>
          </ul>
          <h4 style="color: #00e5ff; margin-top: 16px;">🗺️ Custom Review Path</h4>
          <ol>
            <li>Practice writing prompt wrappers inside Gemini developers console.</li>
            <li>Look up token pricing models between Flash and Pro on Google Cloud vertex documentation.</li>
          </ol>
        </div>
      `,
      gradedByAI: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    });

    console.log(`✅ Demo attempt logs seeded for candidate "Danny Pink".`);
    console.log(`🌱 Seeding complete! Application is test-ready.`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};
