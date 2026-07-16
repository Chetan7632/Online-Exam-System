import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Sparkles, Check, ChevronRight, ChevronLeft } from 'lucide-react';

const EditExam = () => {
  const { id } = useParams();
  const { token, apiUrl } = useContext(AuthContext);
  const navigate = useNavigate();

  // Exam Core Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [passingScore, setPassingScore] = useState('40');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Generator Panel State
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiType, setAiType] = useState('mcq');
  const [aiCount, setAiCount] = useState('5');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreviewQuestions, setAiPreviewQuestions] = useState([]);

  // Manual Question State
  const [manualType, setManualType] = useState('mcq');
  const [manualText, setManualText] = useState('');
  const [manualPoints, setManualPoints] = useState('1');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrect, setManualCorrect] = useState('0'); // index for MCQ, True/False text, model answers for subjective

  // Fetch current exam details
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/exams/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Failed to retrieve exam details');
        }
        const data = await response.json();

        setTitle(data.title || '');
        setDescription(data.description || '');
        setDuration(data.duration?.toString() || '60');
        setPassingScore(data.passingScore?.toString() || '40');
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err.message || 'Error loading exam data');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [id, token, apiUrl]);

  const handleAddManualQuestion = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    let parsedCorrect = manualCorrect;
    let finalOptions = [];

    if (manualType === 'mcq') {
      finalOptions = [...manualOptions].filter(o => o.trim() !== '');
      if (finalOptions.length < 2) {
        alert('MCQ must have at least 2 options.');
        return;
      }
      parsedCorrect = manualCorrect.toString();
    } else if (manualType === 'true_false') {
      finalOptions = ['True', 'False'];
      parsedCorrect = manualCorrect.toString();
    } else {
      finalOptions = [];
      parsedCorrect = manualCorrect.trim();
    }

    const newQ = {
      id: `man_${Date.now()}`,
      questionText: manualText,
      questionType: manualType,
      options: finalOptions,
      correctAnswer: parsedCorrect,
      points: Number(manualPoints)
    };

    setQuestions([...questions, newQ]);

    // Reset Form
    setManualText('');
    setManualOptions(['', '', '', '']);
    setManualCorrect('0');
  };

  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      alert('Please specify a topic for the AI.');
      return;
    }

    setAiLoading(true);
    setAiPreviewQuestions([]);

    try {
      const response = await fetch(`${apiUrl}/ai/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
          questionType: aiType,
          count: Number(aiCount)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'AI Question Generation failed');
      }

      const data = await response.json();
      setAiPreviewQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAiQuestionsToDraft = () => {
    if (aiPreviewQuestions.length === 0) return;

    const formatted = aiPreviewQuestions.map((q, idx) => ({
      ...q,
      id: `ai_${idx}_${Date.now()}`
    }));

    setQuestions([...questions, ...formatted]);
    setAiPreviewQuestions([]);
    setAiTopic('');
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert('Please enter an exam title.');
      return;
    }
    if (questions.length === 0) {
      alert('Please add at least one question.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          duration: Number(duration),
          passingScore: Number(passingScore),
          questions
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update exam');
      }

      navigate('/teacher-dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 229, 255, 0.1)',
          borderTop: '3px solid #00e5ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#ff5c5c', marginBottom: '16px' }}>Error Loading Exam</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
          <Link to="/teacher-dashboard" className="btn btn-secondary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/teacher-dashboard" style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '10px',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition-smooth)'
        }} onMouseOver={e => e.currentTarget.style.color = '#00e5ff'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="title-glow" style={{ fontSize: '2rem', marginBottom: '6px' }}>Exam Editor</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Modify variables, update structure, and revise examination details.</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 5fr',
        gap: '32px'
      }}>
        {/* Left Column: Core settings & Questions Draft */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Exam Info Card */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#f3f4f6' }}>1. Exam Properties</h3>

            <div className="form-group">
              <label className="form-label">Exam Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Advanced React Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Instructions</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="e.g. This exam covers hooks, custom middleware, and reconciliation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  min="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Passing Grade (%)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Draft Questions List */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f3f4f6' }}>2. Question Queue ({questions.length})</h3>
              {questions.length > 0 && (
                <button onClick={handleSaveExam} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Save Exam Changes
                </button>
              )}
            </div>

            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                Your question draft is currently empty. Use the manual creator below or the Gemini AI helper on the right.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {questions.map((q, index) => (
                  <div key={q.id || q._id} className="glass-card" style={{
                    position: 'relative',
                    background: 'rgba(10, 14, 23, 0.4)',
                    padding: '16px 20px',
                    paddingRight: '60px'
                  }}>
                    <div style={{ position: 'absolute', right: '16px', top: '16px' }}>
                      <button onClick={() => handleDeleteQuestion(q.id || q._id)} className="btn btn-danger" style={{ padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>Q{index + 1}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        color: q.questionType === 'subjective' ? '#bd00ff' : '#00e5ff',
                        fontWeight: '700'
                      }}>{q.questionType}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {q.points} pt{q.points !== 1 ? 's' : ''}</span>
                    </div>

                    <p style={{ fontWeight: '500', marginBottom: '12px' }}>{q.questionText}</p>

                    {q.options && q.options.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        {q.options.map((opt, idx) => (
                          <div key={idx} style={{
                            background: q.correctAnswer === idx.toString() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                            border: q.correctAnswer === idx.toString() ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            color: q.correctAnswer === idx.toString() ? '#10b981' : 'var(--text-secondary)'
                          }}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      🔑 Model Answer: <span style={{ color: '#10b981', fontWeight: '500' }}>
                        {q.questionType === 'mcq' && q.options ? q.options[parseInt(q.correctAnswer)] : q.correctAnswer}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Question Creator Card */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#f3f4f6' }}>3. Manual Question Editor</h3>
            <form onSubmit={handleAddManualQuestion}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Question Type</label>
                  <select
                    className="form-input"
                    value={manualType}
                    onChange={(e) => {
                      setManualType(e.target.value);
                      if (e.target.value === 'true_false') setManualCorrect('True');
                      else if (e.target.value === 'subjective') setManualCorrect('');
                      else setManualCorrect('0');
                    }}
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="true_false">True / False</option>
                    <option value="subjective">Subjective (AI-Graded Text)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Points</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={manualPoints}
                    onChange={(e) => setManualPoints(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter question text here..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  required
                />
              </div>

              {/* Dynamic Answer Fields */}
              {manualType === 'mcq' && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">MCQ Options (Fill out at least 2)</label>
                  <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
                    {manualOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="radio"
                          name="correct_mcq"
                          checked={manualCorrect === idx.toString()}
                          onChange={() => setManualCorrect(idx.toString())}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          value={opt}
                          onChange={(e) => {
                            const copy = [...manualOptions];
                            copy[idx] = e.target.value;
                            setManualOptions(copy);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select the radio button corresponding to the correct answer.</span>
                </div>
              )}

              {manualType === 'true_false' && (
                <div className="form-group">
                  <label className="form-label">Correct Answer</label>
                  <select
                    className="form-input"
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value)}
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {manualType === 'subjective' && (
                <div className="form-group">
                  <label className="form-label">Ideal Answer / Evaluation Rubric (AI Reference Keyphrase)</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Provide keywords or a model summary the student answer must outline..."
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(e.target.value)}
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
                <Plus size={16} /> Insert Into Question Queue
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Assistant Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="glass-panel" style={{
            padding: '28px',
            border: '1px solid rgba(0, 229, 255, 0.25)',
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.05)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.4))' }} />
              Gemini AI Question Generator
            </h3>

            <div className="form-group">
              <label className="form-label">Target Topic</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. React Custom Hooks"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select className="form-input" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
                <option value="easy">Easy (1 Point)</option>
                <option value="medium">Medium (2 Points)</option>
                <option value="hard">Hard (3 Points)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Format Style</label>
              <select className="form-input" value={aiType} onChange={(e) => setAiType(e.target.value)}>
                <option value="mcq">Multiple Choice Questions (MCQ)</option>
                <option value="true_false">True / False Cards</option>
                <option value="subjective">Subjective (Open Paragraph)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Question Count</label>
              <select className="form-input" value={aiCount} onChange={(e) => setAiCount(e.target.value)}>
                <option value="3">3 Questions</option>
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
              </select>
            </div>

            <button
              onClick={handleGenerateAiQuestions}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', gap: '10px' }}
              disabled={aiLoading}
            >
              <Sparkles size={16} />
              {aiLoading ? 'Gemini is Synthesizing...' : 'Generate AI Questions'}
            </button>

            {/* AI Generator Loading Animation */}
            {aiLoading && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  border: '3px solid rgba(0, 229, 255, 0.1)',
                  borderTop: '3px solid #00e5ff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '10px'
                }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Processing schema parameters through Google Gemini...</p>
              </div>
            )}

            {/* AI Generated Questions Preview */}
            {aiPreviewQuestions.length > 0 && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(0, 229, 255, 0.03)',
                border: '1px solid rgba(0, 229, 255, 0.15)',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: '#00e5ff', fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> Generated Questions Preview ({aiPreviewQuestions.length})
                </h4>

                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', paddingRight: '4px' }}>
                  {aiPreviewQuestions.map((q, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.8rem',
                      background: 'rgba(255,255,255,0.02)',
                      padding: '10px',
                      borderRadius: '6px',
                      borderLeft: '2px solid #00e5ff'
                    }}>
                      <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>{q.questionText}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>Points: {q.points || 1} • {q.questionType}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleAddAiQuestionsToDraft} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}>
                  Inject All Questions to Draft Queue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EditExam;
