import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, FileText, AlertTriangle, Users, Trash2, Calendar, Clipboard, ArrowRight, Edit } from 'lucide-react';

const TeacherDashboard = () => {
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

        // Fetch teacher's exams
        const examsResponse = await fetch(`${apiUrl}/exams/teacher`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!examsResponse.ok) throw new Error('Failed to load exams');
        const examsData = await examsResponse.json();
        setExams(examsData);

        // Fetch attempts for teacher's exams
        const attemptsResponse = await fetch(`${apiUrl}/attempts/teacher`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!attemptsResponse.ok) throw new Error('Failed to load student attempts');
        const attemptsData = await attemptsResponse.json();
        setAttempts(attemptsData);

      } catch (err) {
        console.error(err);
        setError(err.message || 'Error loading dashboard analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, apiUrl]);

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This will remove the exam and all candidate records.')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete exam');
      }

      setExams(exams.filter(exam => exam._id !== examId));
      // Refresh attempts since their exam was deleted
      setAttempts(attempts.filter(att => att.exam && att.exam._id !== examId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Calculations
  const totalExams = exams.length;
  const totalAttempts = attempts.length;
  const highRiskAttempts = attempts.filter(att => att.violationsCount >= 3).length;
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score / curr.maxScore * 100), 0) / totalAttempts) 
    : 0;

  // Custom SVG bar graph score ranges: 0-40, 41-60, 61-80, 81-100
  const getGraphData = () => {
    const segments = { '0-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
    attempts.forEach(att => {
      const percent = (att.score / att.maxScore) * 100;
      if (percent <= 40) segments['0-40%']++;
      else if (percent <= 60) segments['41-60%']++;
      else if (percent <= 80) segments['61-80%']++;
      else segments['81-100%']++;
    });
    return Object.entries(segments);
  };

  const graphData = getGraphData();
  const maxSegmentCount = Math.max(...graphData.map(([_, count]) => count), 1);

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
      {/* Header Panel */}
      <div className="responsive-flex-row" style={{ marginBottom: '36px' }}>
        <div>
          <h1 className="title-glow" style={{ fontSize: '2rem', marginBottom: '6px' }}>Teacher Terminal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage questions, track exam attempts, and review AI proctor logs</p>
        </div>
        <Link to="/create-exam" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          <Plus size={18} /> Create Exam
        </Link>
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

      {/* Stats Board */}
      <div className="grid-cols-4" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '12px', borderRadius: '12px', color: '#00e5ff' }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exams Created</p>
            <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>{totalExams}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(189, 0, 255, 0.1)', padding: '12px', borderRadius: '12px', color: '#bd00ff' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Attempts</p>
            <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>{totalAttempts}</h3>
          </div>
        </div>

        <div className="glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          borderColor: highRiskAttempts > 0 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255,255,255,0.05)',
          background: highRiskAttempts > 0 ? 'rgba(255, 71, 87, 0.05)' : 'rgba(20,28,48,0.55)'
        }}>
          <div style={{
            background: highRiskAttempts > 0 ? 'rgba(255, 71, 87, 0.15)' : 'rgba(245, 158, 11, 0.1)',
            padding: '12px',
            borderRadius: '12px',
            color: highRiskAttempts > 0 ? '#ff4757' : '#f59e0b'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>High-Risk Flags</p>
            <h3 style={{
              fontSize: '1.75rem',
              fontFamily: 'var(--font-display)',
              color: highRiskAttempts > 0 ? '#ff4757' : 'inherit'
            }}>{highRiskAttempts}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
            <Clipboard size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Grade</p>
            <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>{averageScore}%</h3>
          </div>
        </div>
      </div>

      {/* Grid: Exams Panel & Performance Graph */}
      <div className="grid-cols-3" style={{ marginBottom: '40px' }}>
        {/* Exams List (Span 2 columns) */}
        <div className="glass-panel col-span-2-desktop" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#00e5ff" /> Live Examinations ({exams.length})
          </h3>
          
          {exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '16px' }}>No exams created yet. Design your first workspace template.</p>
              <Link to="/create-exam" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Create First Exam</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {exams.map(exam => (
                <div key={exam._id} className="glass-card" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'rgba(10, 14, 23, 0.4)'
                }}>
                  <div>
                    <h4 style={{ color: '#f3f4f6', marginBottom: '4px' }}>{exam.title}</h4>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>🕒 {exam.duration} Min</span>
                      <span>📝 {exam.questions ? exam.questions.length : 0} Questions</span>
                      <span>🎯 Min. Pass Score: {exam.passingScore}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link
                      to={`/edit-exam/${exam._id}`}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDeleteExam(exam._id)}
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Distribution Graph (Span 1 column) */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Score Distribution</h3>
          {attempts.length === 0 ? (
            <div style={{ display: 'flex', height: '180px', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>
              Pending attempts submission data...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {graphData.map(([label, count]) => {
                const percentage = (count / maxSegmentCount) * 100;
                return (
                  <div key={label} style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      <span>{label}</span>
                      <span>{count} Student{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #bd00ff, #00e5ff)',
                        borderRadius: '4px',
                        boxShadow: '0 0 8px rgba(0, 229, 255, 0.4)'
                      }} />
                    </div>
                  </div>
                );
              })}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid rgba(0, 229, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                📈 Based on the results of the completed candidate profiles.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Submissions Logs */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Recent Student Attempts</h3>
        
        {attempts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No candidates have taken the tests yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Student</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Exam Title</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Score</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Violations</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Result</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Review</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(att => {
                  const studentName = att.student ? att.student.name : 'Unknown Student';
                  const examTitle = att.exam ? att.exam.title : 'Deleted Exam';
                  const percentScore = Math.round((att.score / att.maxScore) * 100);
                  const isHighRisk = att.violationsCount >= 3;
                  
                  return (
                    <tr key={att._id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'var(--transition-smooth)'
                    }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                       onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '14px 16px', fontWeight: '500' }}>{studentName}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{examTitle}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)' }}>
                        {att.score} / {att.maxScore} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({percentScore}%)</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          color: isHighRisk ? '#ff4757' : (att.violationsCount > 0 ? '#f59e0b' : '#10b981'),
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isHighRisk && '⚠️ '}{att.violationsCount} flag{att.violationsCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: att.isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: att.isPassed ? '#10b981' : '#ff5c5c',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          border: `1px solid ${att.isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}>
                          {att.isPassed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to={`/exam-result/${att._id}`} style={{
                          color: '#00e5ff',
                          textDecoration: 'none',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.85rem'
                        }}>
                          Analyze <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
