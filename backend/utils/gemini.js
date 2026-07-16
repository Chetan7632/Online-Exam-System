import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let isAiAvailable = false;

if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    isAiAvailable = true;
    console.log('✅ Gemini AI Engine Initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI Engine:', error.message);
  }
} else {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not configured in .env. Falling back to Mock AI engine.');
}

/**
 * AI Question Generator
 */
export const aiGenerateQuestions = async (topic, difficulty, questionType, count = 5) => {
  if (!isAiAvailable) {
    return generateMockQuestions(topic, difficulty, questionType, count);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let typePrompt = '';
    if (questionType === 'mcq') {
      typePrompt = 'multiple choice questions (MCQ) containing 4 options (array of strings named options) and a correctAnswer (index 0, 1, 2, or 3 as a string index)';
    } else if (questionType === 'true_false') {
      typePrompt = 'true/false questions. options must be ["True", "False"] and correctAnswer must be "True" or "False"';
    } else {
      typePrompt = 'subjective questions requiring textual answers. options must be empty array [], and correctAnswer must be the ideal model answer or keypoints that the student should cover';
    }

    const prompt = `Generate exactly ${count} educational questions on the topic "${topic}" with difficulty level "${difficulty}".
    The question types must be: ${typePrompt}.
    Return the response ONLY as a valid JSON array. Do not include markdown code block formatting. Do not include any explanation.
    Each object in the JSON array must have:
    - id: unique string (e.g. "q1", "q2")
    - questionText: string
    - questionType: string (must be "${questionType}")
    - options: array of strings
    - correctAnswer: string
    - points: number (assign points: 1 for easy, 2 for medium, 3 for hard)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean markdown blocks if Gemini outputs them
    if (text.startsWith('```json')) {
      text = text.substring(7);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const parsedQuestions = JSON.parse(text);
    return parsedQuestions;
  } catch (error) {
    console.error('AI question generation failed, using mock generator:', error.message);
    return generateMockQuestions(topic, difficulty, questionType, count);
  }
};

/**
 * AI Subjective Grader
 */
export const aiGradeSubjective = async (questionText, idealAnswer, studentAnswer, points) => {
  if (!isAiAvailable) {
    return gradeMockSubjective(idealAnswer, studentAnswer, points);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an expert grading assistant. Grade the following student's answer.
    Question: "${questionText}"
    Ideal/Model Answer: "${idealAnswer}"
    Student's Answer: "${studentAnswer}"
    Maximum points possible: ${points}

    Evaluate the answer for accuracy, coverage of key points, and grammar.
    Return ONLY a JSON object with two fields (do not write markdown blocks or other text):
    - score: number (from 0 to ${points}, can be a decimal if partially correct)
    - feedback: string (1-2 sentences of explanation about why they got this score, pointing out any omissions or mistakes)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    if (text.startsWith('```json')) {
      text = text.substring(7);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    return JSON.parse(text);
  } catch (error) {
    console.error('AI subjective grading failed, using mock grader:', error.message);
    return gradeMockSubjective(idealAnswer, studentAnswer, points);
  }
};

/**
 * AI Performance Insights & Study Map
 */
export const aiGetPerformanceInsights = async (examTitle, score, maxScore, violationsCount, questionsReport) => {
  if (!isAiAvailable) {
    return generateMockInsights(examTitle, score, maxScore, violationsCount, questionsReport);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Review the student's exam performance and generate constructive study insights.
    Exam Title: "${examTitle}"
    Student Score: ${score} out of ${maxScore} (${((score / maxScore) * 100).toFixed(1)}%)
    Proctoring Violations Logged: ${violationsCount} (Focus lost, full-screen exits, etc.)
    Question Review Report: ${JSON.stringify(questionsReport)}

    Provide feedback covering:
    1. Overall performance review.
    2. Specific strong topics.
    3. Weak topics or areas of misunderstanding.
    4. Actionable study roadmap/recommendation.
    5. Integrity flag: critique if violations count > 0.
    
    Return the response as a single, clear, professionally formatted HTML string or standard Markdown string. Keep it under 250 words. Do not wrap in markdown code blocks.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('AI insights generation failed, using mock insights:', error.message);
    return generateMockInsights(examTitle, score, maxScore, violationsCount, questionsReport);
  }
};

/**
 * --- MOCK AI FALLBACK ENGINE IMPLEMENTATION ---
 */

function generateMockQuestions(topic, difficulty, questionType, count) {
  const list = [];
  const points = difficulty === 'easy' ? 1 : (difficulty === 'medium' ? 2 : 3);
  
  for (let i = 1; i <= count; i++) {
    if (questionType === 'mcq') {
      list.push({
        id: `mock_mcq_${i}_${Date.now()}`,
        questionText: `Sample MCQ ${i}: What is a core characteristic/principle related to "${topic}" at a ${difficulty} level?`,
        questionType: 'mcq',
        options: [
          `Option A: Primary feature of ${topic}`,
          `Option B: Secondary concept in ${topic}`,
          `Option C: Unrelated standard practice`,
          `Option D: Deprecated methodology`
        ],
        correctAnswer: "0", // Index 0
        points: points
      });
    } else if (questionType === 'true_false') {
      list.push({
        id: `mock_tf_${i}_${Date.now()}`,
        questionText: `Sample True/False ${i}: It is correct to state that "${topic}" is primarily designed to solve state-sharing issues.`,
        questionType: 'true_false',
        options: ["True", "False"],
        correctAnswer: i % 2 === 0 ? "True" : "False",
        points: points
      });
    } else {
      list.push({
        id: `mock_sub_${i}_${Date.now()}`,
        questionText: `Sample Subjective Question ${i}: Explain the architecture of "${topic}" and discuss its benefits and potential challenges under a ${difficulty} setting.`,
        questionType: 'subjective',
        options: [],
        correctAnswer: `Should mention core concepts of ${topic}, architectural modules, lifecycle, performance tuning, and scalability.`,
        points: points
      });
    }
  }
  return list;
}

function gradeMockSubjective(idealAnswer, studentAnswer, points) {
  if (!studentAnswer || studentAnswer.trim() === '') {
    return { score: 0, feedback: 'No answer was provided. Full points deducted.' };
  }

  // Basic keyword comparison
  const keywords = idealAnswer.toLowerCase().split(/[\s,._\-]+/);
  const studentLower = studentAnswer.toLowerCase();
  
  let matches = 0;
  const uniqueKeywords = [...new Set(keywords)].filter(k => k.length > 3);
  
  if (uniqueKeywords.length === 0) {
    matches = studentLower.length > 10 ? 1 : 0;
    uniqueKeywords.push('placeholder');
  } else {
    uniqueKeywords.forEach(word => {
      if (studentLower.includes(word)) {
        matches++;
      }
    });
  }

  const matchRatio = matches / uniqueKeywords.length;
  let score = points * matchRatio;
  
  // Add some points for writing length if match is low
  if (score < points * 0.3 && studentLower.length > 30) {
    score = points * 0.4;
  }
  
  // Cap score
  score = Math.min(points, Math.round(score * 10) / 10);
  
  let feedback = '';
  if (score === points) {
    feedback = 'Excellent. Your answer is highly comprehensive and correctly mentions all key elements.';
  } else if (score >= points * 0.6) {
    feedback = 'Good response. You captured the main concepts, but could expand further on structural details and optimization.';
  } else {
    feedback = 'Partial credit. Your response touches upon the topic but misses essential concepts outlined in the ideal model answer.';
  }

  return { score, feedback };
}

function generateMockInsights(examTitle, score, maxScore, violationsCount, questionsReport) {
  const percentage = (score / maxScore) * 100;
  let gradeString = percentage >= 80 ? 'Excellent' : (percentage >= 50 ? 'Satisfactory' : 'Needs Improvement');
  
  let html = `
    <div style="font-family: inherit; line-height: 1.6;">
      <h3 style="color: #00e5ff; margin-bottom: 8px;">Performance Summary: ${gradeString} (${percentage.toFixed(0)}%)</h3>
      <p>You scored <strong>${score} / ${maxScore}</strong> on the <strong>${examTitle}</strong> exam.</p>
  `;

  if (violationsCount > 0) {
    html += `
      <div style="background: rgba(255, 71, 87, 0.1); border-left: 4px solid #ff4757; padding: 10px; margin: 12px 0; border-radius: 4px;">
        <strong style="color: #ff4757;">⚠️ Integrity Alert:</strong> We logged <strong>${violationsCount} focus/window violations</strong> during your attempt. Please maintain application focus during future examinations.
      </div>
    `;
  }

  html += `<h4 style="color: #00e5ff; margin-top: 16px;">💡 Topic Analysis</h4><ul>`;
  
  if (percentage >= 70) {
    html += `
      <li><strong>Strengths:</strong> You demonstrated strong conceptual understanding of the core subject matter, displaying good accuracy across standard questions.</li>
      <li><strong>Areas of Growth:</strong> Aim to complete the questions faster and structure subjective explanations with technical syntax.</li>
    `;
  } else {
    html += `
      <li><strong>Strengths:</strong> You earned points in fundamental questions, proving you have active recall of basic terminology.</li>
      <li><strong>Areas of Growth:</strong> Subjective and medium-to-hard level analytical scenarios require additional study. Focus on core architectural constraints.</li>
    `;
  }

  html += `</ul><h4 style="color: #00e5ff; margin-top: 16px;">🗺️ Study Action Plan</h4><ol>`;
  html += `
    <li>Review the ideal answers for any incorrect MCQ questions.</li>
    <li>Dedicate 15 minutes of revision on standard templates and lifecycle patterns.</li>
    <li>Attempt a mock question set using the platform's AI generator to practice writing comprehensive answers.</li>
  </ol></div>`;

  return html;
}
