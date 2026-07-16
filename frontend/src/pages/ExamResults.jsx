import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Award, ShieldAlert, Sparkles, Check, X, Calendar, Clock, BookOpen, AlertTriangle, Download } from 'lucide-react';

const ExamResults = () => {
  const { attemptId } = useParams();
  const { token, apiUrl } = useContext(AuthContext);

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/attempts/${attemptId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to load candidate attempt grades');
        }

        const data = await response.json();
        setAttempt(data);
      } catch (err) {
        setError(err.message || 'Error loading exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [attemptId, token, apiUrl]);

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

  if (error || !attempt) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#ff5c5c', marginBottom: '16px' }}>Fetch Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Unable to retrieve attempt results.'}</p>
          <Link to="/student-dashboard" className="btn btn-secondary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const exam = attempt.exam || {};
  const student = attempt.student || {};
  const percentScore = Math.round((attempt.score / attempt.maxScore) * 100);
  const formattedDate = new Date(attempt.createdAt).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="dashboard-container printable-results" style={{ maxWidth: '1000px' }}>
      {/* Back Link & Export Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="no-print">
        <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
          ← Back to Dashboard Workspace
        </Link>
        <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export PDF Report
        </button>
      </div>

      {/* Grade Card Summary */}
      <div className="glass-panel" style={{
        padding: '36px',
        background: attempt.isPassed
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(10, 14, 23, 0.8))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(10, 14, 23, 0.8))',
        border: `1px solid ${attempt.isPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
        borderRadius: '16px',
        marginBottom: '32px',
        display: 'grid',
        gridTemplateColumns: '1fr 240px',
        gap: '30px',
        alignItems: 'center'
      }}>
        <div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: attempt.isPassed ? '#10b981' : '#ff5c5c',
            background: attempt.isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: `1px solid ${attempt.isPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'inline-block',
            marginBottom: '16px'
          }}>
            {attempt.isPassed ? 'PASSED EXAMINATION' : 'THRESHOLD NOT REACHED'}
          </span>
          
          <h1 style={{ fontSize: '1.75rem', color: '#f3f4f6', marginBottom: '8px' }}>{exam.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Candidate: <strong>{student.name}</strong> • Completed on: {formattedDate}
          </p>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>🕒 Duration Limit: {exam.duration} Min</span>
            <span>🎯 Passing Score: {exam.passingScore}%</span>
            <span>📝 Questions: {exam.questions ? exam.questions.length : 0}</span>
          </div>
        </div>

        {/* Circular score display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.03)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Aggregate Score</span>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: '700',
            color: attempt.isPassed ? '#10b981' : '#ff5c5c',
            lineHeight: '1'
          }}>
            {percentScore}%
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            ({attempt.score} / {attempt.maxScore} pts)
          </span>
        </div>
      </div>

      {/* Proctor logs alerts box if violations exist */}
      {attempt.violationsCount > 0 && (
        <div className="glass-panel" style={{
          padding: '20px',
          borderColor: attempt.violationsCount >= 3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
          background: attempt.violationsCount >= 3 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
          borderRadius: '12px',
          marginBottom: '32px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <div style={{ color: attempt.violationsCount >= 3 ? '#ef4444' : '#f59e0b', marginTop: '2px' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 style={{
              color: attempt.violationsCount >= 3 ? '#ff5c5c' : '#f59e0b',
              fontSize: '0.95rem',
              marginBottom: '6px',
              fontWeight: '600'
            }}>
              Proctoring Security Violations Logged ({attempt.violationsCount})
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
              The system recorded focus loss or application exits during this session.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {attempt.violations.map((v, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ⚠️ [{new Date(v.timestamp).toLocaleTimeString()}] - {v.details}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Performance feedback */}
      {attempt.aiFeedback && (
        <div className="glass-panel" style={{
          padding: '30px',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '36px'
        }}>
          <h3 style={{
            fontSize: '1.15rem',
            color: '#00e5ff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-display)'
          }}>
            <Sparkles size={18} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.4))' }} />
            Gemini AI Cognitive Evaluation
          </h3>
          
          <div
            className="ai-markdown-content"
            dangerouslySetInnerHTML={{ __html: attempt.aiFeedback }}
            style={{
              fontSize: '0.95rem',
              lineHeight: '1.6',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      )}

      {/* Question Itemized Review */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', color: '#f3f4f6' }}>Examination Review</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {exam.questions && exam.questions.map((q, idx) => {
            const studentAnsObj = attempt.answers.find(ans => ans.questionId === q.id);
            const studentAnswer = studentAnsObj ? studentAnsObj.studentAnswer : '';
            const scoreEarned = studentAnsObj ? studentAnsObj.score : 0;
            const isCorrect = scoreEarned === (q.points || 1);
            const isPartial = scoreEarned > 0 && scoreEarned < (q.points || 1);

            return (
              <div key={q.id} className="glass-panel" style={{
                padding: '24px',
                background: 'rgba(10, 14, 23, 0.4)',
                borderLeft: `4px solid ${isCorrect ? '#10b981' : (isPartial ? '#f59e0b' : '#ef4444')}`
              }}>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.04)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>Question {idx + 1}</span>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{q.questionType}</span>
                  </div>

                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: isCorrect ? '#10b981' : (isPartial ? '#f59e0b' : '#ff7c7c')
                  }}>
                    Score: {scoreEarned} / {q.points || 1} pt{q.points !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Question text */}
                <p style={{ fontWeight: '500', fontSize: '1rem', marginBottom: '20px', color: '#f3f4f6' }}>{q.questionText}</p>

                {/* MCQ details */}
                {q.questionType === 'mcq' && q.options && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    {q.options.map((opt, oIdx) => {
                      const isStudentChoice = studentAnswer === oIdx.toString();
                      const isCorrectChoice = q.correctAnswer === oIdx.toString();

                      let boxBg = 'rgba(255,255,255,0.01)';
                      let boxBorder = 'rgba(255,255,255,0.04)';
                      let textColor = 'var(--text-secondary)';

                      if (isCorrectChoice) {
                        boxBg = 'rgba(16, 185, 129, 0.08)';
                        boxBorder = 'rgba(16, 185, 129, 0.3)';
                        textColor = '#10b981';
                      } else if (isStudentChoice && !isCorrectChoice) {
                        boxBg = 'rgba(239, 68, 68, 0.08)';
                        boxBorder = 'rgba(239, 68, 68, 0.3)';
                        textColor = '#ff7c7c';
                      }

                      return (
                        <div key={oIdx} style={{
                          background: boxBg,
                          border: `1px solid ${boxBorder}`,
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: textColor,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{opt}</span>
                          {isCorrectChoice && <Check size={14} />}
                          {isStudentChoice && !isCorrectChoice && <X size={14} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text responses display (True/False and Subjective) */}
                {q.questionType === 'true_false' && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Your Answer: </span>
                      <strong style={{ color: studentAnswer === q.correctAnswer ? '#10b981' : '#ff7c7c' }}>{studentAnswer || 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Correct Answer: </span>
                      <strong style={{ color: '#10b981' }}>{q.correctAnswer}</strong>
                    </div>
                  </div>
                )}

                {q.questionType === 'subjective' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      background: 'rgba(0,0,0,0.15)',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Candidate Response:</span>
                      <p style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#e5e7eb' }}>
                        {studentAnswer || '[No response submitted]'}
                      </p>
                    </div>

                    <div style={{
                      background: 'rgba(16, 185, 129, 0.03)',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      border: '1px solid rgba(16, 185, 129, 0.1)'
                    }}>
                      <span style={{ display: 'block', color: '#10b981', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Evaluator Guide Answer Keyphrase:</span>
                      <p style={{ color: 'var(--text-secondary)' }}>{q.correctAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Individual Answer Evaluation Comments */}
                {studentAnsObj && studentAnsObj.aiFeedback && (
                  <div style={{
                    background: 'rgba(0, 229, 255, 0.02)',
                    border: '1px solid rgba(0, 229, 255, 0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ color: '#00e5ff', marginTop: '1px' }}>
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <strong>AI Grading analysis:</strong> {studentAnsObj.aiFeedback}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Style overrides for custom elements in dynamic html */}
      <style>{`
        .ai-markdown-content h3 {
          font-size: 1.1rem;
          color: #00e5ff;
          margin-top: 14px;
          margin-bottom: 8px;
        }
        .ai-markdown-content h4 {
          font-size: 0.95rem;
          color: #df6bff;
          margin-top: 12px;
          margin-bottom: 6px;
        }
        .ai-markdown-content ul, .ai-markdown-content ol {
          margin-left: 20px;
          margin-bottom: 12px;
        }
        .ai-markdown-content li {
          margin-bottom: 4px;
        }
        .ai-markdown-content p {
          margin-bottom: 10px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExamResults;
