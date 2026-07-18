import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, Award, CheckCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, apiUrl } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch all exams
        const examsResponse = await fetch(`${apiUrl}/exams`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!examsResponse.ok) throw new Error('Failed to load exams list');
        const examsData = await examsResponse.json();
        setExams(examsData);

        // Fetch student attempts
        const attemptsResponse = await fetch(`${apiUrl}/attempts/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!attemptsResponse.ok) throw new Error('Failed to load attempt logs');
        const attemptsData = await attemptsResponse.json();
        setAttempts(attemptsData);

      } catch (err) {
        console.error(err);
        setError(err.message || 'Error fetching dashboard datasets');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, apiUrl]);

  // Calculations
  const examsTaken = attempts.length;
  const passedExams = attempts.filter(att => att.isPassed).length;
  
  const averageScore = examsTaken > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score / curr.maxScore * 100), 0) / examsTaken)
    : 0;

  // AI Index / Level descriptor
  const getPerformanceIndex = () => {
    if (examsTaken === 0) return 'UNRATED';
    if (averageScore >= 80) return 'ELITE COGNITIVE';
    if (averageScore >= 60) return 'ADVANCED RESEARCHER';
    if (averageScore >= 40) return 'PROFICIENT DEVELOPER';
    return 'NOVICE ANALYST';
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

  return (
    <div className="dashboard-container">
      {/* Welcome & System Status Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '36px',
        background: 'rgba(0, 229, 255, 0.03)',
        border: '1px solid rgba(0, 229, 255, 0.1)',
        padding: '24px 30px',
        borderRadius: '16px'
      }}>
        <div>
          <h1 className="title-glow" style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Student Workspace</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to the online examination suite. Select a chamber below to begin.</p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          <ShieldCheck size={18} />
          PROCTORING LINK ONLINE
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#ff5c5c',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '28px'
        }}>
          {error}
        </div>
      )}

      {/* Metrics Board */}
      <div className="grid-cols-4" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '12px', borderRadius: '12px', color: '#00e5ff' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exams Completed</p>
            <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>{examsTaken}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(189, 0, 255, 0.1)', padding: '12px', borderRadius: '12px', color: '#bd00ff' }}>
            <Award size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg. Score Percentage</p>
            <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>{averageScore}%</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passed Threshold</p>
            <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>{passedExams} / {examsTaken}</h3>
          </div>
        </div>

        <div className="glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(20, 28, 48, 0.55), rgba(189, 0, 255, 0.05))',
          border: '1px solid rgba(189, 0, 255, 0.2)'
        }}>
          <div style={{ background: 'rgba(189, 0, 255, 0.15)', padding: '12px', borderRadius: '12px', color: '#bd00ff' }}>
            <Award size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Performance index</p>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#df6bff' }}>{getPerformanceIndex()}</h3>
          </div>
        </div>
      </div>

      {/* Grid: Available Chambers & Historical Logs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 5fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Available Exams Panel */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#f3f4f6' }}>Available Exam Chambers</h3>
          
          {exams.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>There are no examinations available on the server at this time.</p>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {exams.map(exam => {
                const hasTaken = attempts.some(att => att.exam && att.exam._id === exam._id);
                return (
                  <div key={exam._id} className="glass-card" style={{
                    background: 'rgba(10, 14, 23, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', color: '#f3f4f6', marginBottom: '6px' }}>{exam.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>{exam.description || 'No instructions provided.'}</p>
                      </div>
                      {hasTaken && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-secondary)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          ATTEMPTED
                        </span>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.15)',
                      padding: '12px 18px',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ display: 'flex', gap: '24px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {exam.duration} Mins</span>
                        <span>📝 {exam.questions ? exam.questions.length : 0} Questions</span>
                        <span>🎯 Passing Score: {exam.passingScore}%</span>
                      </div>
                      <Link to={`/exam/${exam._id}`} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                        Enter Chamber <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Previous Attempts Panel */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#f3f4f6' }}>Examination History</h3>
          
          {attempts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>No historical attempts on record.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {attempts.map(att => {
                const examTitle = att.exam ? att.exam.title : 'Deleted Exam';
                const percentScore = Math.round((att.score / att.maxScore) * 100);
                const attDate = new Date(att.createdAt).toLocaleDateString();

                return (
                  <div key={att._id} className="glass-card" style={{
                    background: 'rgba(10, 14, 23, 0.25)',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: '#f3f4f6', marginBottom: '4px' }}>{examTitle}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attempted: {attDate}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{
                        background: att.isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: att.isPassed ? '#10b981' : '#ff5c5c',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        border: `1px solid ${att.isPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                      }}>
                        {percentScore}% {att.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                      <Link to={`/exam-result/${att._id}`} style={{
                        color: '#00e5ff',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        Review <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

export default StudentDashboard;
