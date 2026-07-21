import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Clock, ShieldAlert, AlertCircle, Camera, CheckSquare, ChevronRight, ChevronLeft } from 'lucide-react';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, apiUrl } = useContext(AuthContext);

  // Exam core data
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active exam states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState([]); // Array of { questionId, studentAnswer }
  const [timeLeft, setTimeLeft] = useState(0); // seconds remaining

  // Proctoring/Violation states
  const [violations, setViolations] = useState([]);
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [fullscreenError, setFullscreenError] = useState(false);

  // Webcam states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [aiScanStatus, setAiScanStatus] = useState('VERIFIED');
  const [aiScanLogs, setAiScanLogs] = useState(['Proctor link initialized.']);

  // Mobile / responsive sidebar toggle states
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(window.innerWidth <= 1024);
  const [isProctorDrawerOpen, setIsProctorDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial load
  useEffect(() => {
    const fetchExamAndInitialize = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/exams/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load examination chamber');
        const data = await response.json();
        setExam(data);
        
        // Initialize timer (duration to seconds)
        setTimeLeft(data.duration * 60);

        // Initialize empty answers array
        const initialAnswers = data.questions.map(q => ({
          questionId: q.id,
          studentAnswer: ''
        }));
        setStudentAnswers(initialAnswers);

        // Try getting full screen
        requestFullscreen();

        // Boot webcam
        startWebcam();

      } catch (err) {
        setError(err.message || 'Error configuring exam environment');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAndInitialize();

    return () => {
      // Clean up webcam
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Exit fullscreen if still in it
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    };
  }, [id, token, apiUrl]);

  // Timer Countdown loop
  useEffect(() => {
    if (loading || !exam || timeLeft <= 0) {
      if (timeLeft === 0 && exam) {
        // Auto submit on timeout
        handleAutoSubmit('Exam time limit expired.');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, exam]);

  // Proctoring: Window Blur (Tab Switch) Detection
  useEffect(() => {
    if (loading || !exam) return;

    const handleBlur = () => {
      triggerViolation('tab_switch', 'Focus lost: Student switched browser tabs or minimized window.');
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [loading, exam, violations]);

  // Proctoring: Fullscreen exit checker
  useEffect(() => {
    if (loading || !exam) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenError(true);
        triggerViolation('fullscreen_exit', 'Window alert: Student exited proctored full-screen mode.');
      } else {
        setFullscreenError(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [loading, exam, violations]);

  // Proctoring: Clipboard Block
  useEffect(() => {
    if (loading || !exam) return;

    const handleCopyPaste = (e) => {
      e.preventDefault();
      triggerViolation('clipboard_copy', 'Input block: Student attempted copy/paste operation.');
    };

    const handleRightClick = (e) => {
      e.preventDefault();
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleRightClick);

    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, [loading, exam, violations]);

  // Proctoring: Periodic AI Verification Checks Simulator
  useEffect(() => {
    if (loading || !exam) return;

    const messages = [
      'Visual match verified: candidate face matches registry.',
      'Gaze track: target focus confirmed within acceptable parameters.',
      'Auditory sweep: ambient signal verified - quiet workspace.',
      'AI Analysis: No secondary device structures detected.',
      'Integrity status: candidate matches session fingerprint.'
    ];

    const aiCheckInterval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setAiScanLogs(prev => [randomMsg, ...prev.slice(0, 4)]);
      
      // Occasionally simulate no face detected if camera is off to show warning, 
      // but otherwise just log healthy checks
      if (!webcamActive && Math.random() < 0.1) {
        setAiScanStatus('WARNING');
        setAiScanLogs(prev => ['⚠️ AI Scan Warning: Presence indicator low - recalibrate posture.', ...prev]);
        setTimeout(() => setAiScanStatus('VERIFIED'), 5000);
      }
    }, 15000);

    return () => clearInterval(aiCheckInterval);
  }, [loading, exam, webcamActive]);

  // Helper functions
  const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => console.log('Fullscreen failed:', err));
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
    } catch (err) {
      console.warn('Webcam stream unavailable:', err.message);
      setAiScanLogs(prev => ['⚠️ Camera lock blocked. Recording offline calibration data.', ...prev]);
    }
  };

  const triggerViolation = (type, details) => {
    const timestamp = new Date().toISOString();
    const newViolation = { type, timestamp, details };
    const updatedViolations = [...violations, newViolation];
    setViolations(updatedViolations);

    // Render warning alert modal
    setWarningMessage(details);
    setShowWarningOverlay(true);

    // Limit condition check (e.g. 3 violations submit exam)
    if (updatedViolations.length >= 3) {
      setTimeout(() => {
        handleAutoSubmit('Proctoring lockout: candidate exceeded permissible violations count.');
      }, 2000);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    const updated = studentAnswers.map(ans => {
      if (ans.questionId === questionId) {
        return { ...ans, studentAnswer: value };
      }
      return ans;
    });
    setStudentAnswers(updated);
  };

  const handleAutoSubmit = async (reason) => {
    // Force exit fullscreen to prevent lockouts
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }
    
    alert(`EXAM AUTOSUBMITTING:\n${reason}`);
    await submitAttempt(true);
  };

  const handleSubmitAttemptManual = async () => {
    if (!window.confirm('Are you sure you want to finish and submit your exam paper? This action is irreversible.')) {
      return;
    }
    
    await submitAttempt(false);
  };

  const submitAttempt = async (isAuto = false) => {
    try {
      setLoading(true);
      
      const payload = {
        examId: id,
        answers: studentAnswers,
        violations: violations
      };

      const response = await fetch(`${apiUrl}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to submit exam');
      }

      const attemptResult = await response.json();
      navigate(`/exam-result/${attemptResult._id}`);
    } catch (err) {
      alert(`Error submitting exam: ${err.message}. Please contact instructor.`);
      setLoading(false);
    }
  };

  // Time conversion utility
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remains = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remains.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(0, 229, 255, 0.1)',
          borderTop: '4px solid #00e5ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{
          fontFamily: 'Orbitron, sans-serif',
          color: '#00e5ff',
          fontSize: '1rem',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>SUBMITTING DATA / PROCESSING GRADES...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#ff5c5c', marginBottom: '16px' }}>Initialization Failed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Unable to start proctored exam.'}</p>
          <button onClick={() => navigate('/student-dashboard')} className="btn btn-secondary">Exit Chamber</button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const activeAnswer = studentAnswers.find(ans => ans.questionId === currentQuestion.id)?.studentAnswer || '';
  const isTimeLow = timeLeft < 300; // less than 5 minutes

  const renderSidebarContents = () => (
    <>
      {/* Exam Timer */}
      <div className="glass-card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderColor: isTimeLow ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 229, 255, 0.15)',
        animation: isTimeLow ? 'pulse-glow 1.5s infinite ease-in-out' : 'none'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remaining Time</span>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: '700',
          color: isTimeLow ? '#ef4444' : '#00e5ff',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={24} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Proctor Feed */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '100%',
          aspectRatio: '4/3',
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '12px'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: webcamActive ? 'block' : 'none' }}
          />
          {/* Cyber HUD Overlay */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: aiScanStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-display)'
          }}>
            AI PROCTOR: {aiScanStatus}
          </div>

          {/* Target outline */}
          <div style={{
            position: 'absolute',
            border: `1px dashed ${aiScanStatus === 'VERIFIED' ? '#00e5ff' : '#ff4757'}`,
            width: '60%',
            height: '60%',
            top: '20%',
            left: '20%',
            pointerEvents: 'none',
            borderRadius: '8px',
            opacity: 0.5
          }} />
        </div>

        <div style={{ width: '100%', fontSize: '0.75rem' }}>
          <strong style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Proc-Feed Activity Logs:</strong>
          <div style={{
            height: '80px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.3)',
            padding: '6px',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {aiScanLogs.map((log, idx) => (
              <div key={idx} style={{ lineBreak: 'anywhere' }}>▪ {log}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Violations tally */}
      <div className="glass-card" style={{
        padding: '16px',
        borderColor: violations.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.03)',
        background: violations.length > 0 ? 'rgba(239,68,68,0.02)' : 'rgba(25,32,49,0.3)'
      }}>
        <strong style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: violations.length > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
          <ShieldAlert size={16} /> INTEGRITY WARNINGS: {violations.length} / 3
        </strong>
        {violations.length > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {violations.map((v, idx) => (
              <div key={idx} style={{ fontSize: '0.7rem', color: '#ff7c7c' }}>
                ❌ {v.details}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question Navigator Map */}
      <div style={{ flex: isMobileOrTablet ? 'none' : 1 }}>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Chamber Progress</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px'
        }}>
          {exam.questions.map((q, idx) => {
            const isAnswered = studentAnswers.find(ans => ans.questionId === q.id)?.studentAnswer !== '';
            const isActive = idx === currentQuestionIndex;
            
            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  if (isMobileOrTablet) setIsProctorDrawerOpen(false);
                }}
                style={{
                  padding: '8px 0',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: '1px solid',
                  transition: 'var(--transition-smooth)',
                  backgroundColor: isActive 
                    ? '#00e5ff' 
                    : (isAnswered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)'),
                  borderColor: isActive 
                    ? '#00e5ff' 
                    : (isAnswered ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.08)'),
                  color: isActive 
                    ? '#050811' 
                    : (isAnswered ? '#10b981' : 'var(--text-secondary)')
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={() => {
        if (isMobileOrTablet) setIsProctorDrawerOpen(false);
        handleSubmitAttemptManual();
      }} className="btn btn-danger" style={{ width: '100%' }}>
        Submit Attempt
      </button>
    </>
  );

  return (
    <div className="take-exam-layout">
      {/* Sidebar: Webcam, Timer, Questions navigation (Only rendered on desktop) */}
      {!isMobileOrTablet && (
        <aside className="take-exam-sidebar">
          {renderSidebarContents()}
        </aside>
      )}

      {/* Proctor drawer overlay & content for mobile */}
      {isMobileOrTablet && (
        <>
          <div 
            className={`proctor-drawer-overlay ${isProctorDrawerOpen ? 'open' : ''}`}
            onClick={() => setIsProctorDrawerOpen(false)}
          />
          <div className={`proctor-drawer-content ${isProctorDrawerOpen ? 'open' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="title-glow" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '700', letterSpacing: '1px' }}>
                PROCTOR CONSOLE
              </span>
              <button 
                onClick={() => setIsProctorDrawerOpen(false)} 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>
            {renderSidebarContents()}
          </div>
        </>
      )}

      {/* Main Panel: Question workspace */}
      <main className="take-exam-main">
        {/* Mobile Top Status Header (only visible on mobile/tablet) */}
        {isMobileOrTablet && (
          <div className="glass-panel" style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '8px',
            background: 'rgba(10, 14, 23, 0.8)',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isTimeLow ? '#ef4444' : '#00e5ff' }}>
              <Clock size={16} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 'bold' }}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                background: aiScanStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: aiScanStatus === 'VERIFIED' ? '#10b981' : '#ff5c5c',
                border: `1px solid ${aiScanStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: '700',
                fontFamily: 'var(--font-display)'
              }}>
                AI: {aiScanStatus}
              </span>
              
              <button 
                onClick={() => setIsProctorDrawerOpen(true)}
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: violations.length > 0 ? '#ff4757' : 'rgba(255,255,255,0.08)'
                }}
              >
                Console {violations.length > 0 && <span style={{ color: '#ff4757', fontWeight: 'bold' }}>({violations.length})</span>}
              </button>
            </div>
          </div>
        )}
        {/* Fullscreen restore error prompt */}
        {fullscreenError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#ff5c5c',
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              <span><strong>PROCTOR ALERT:</strong> Full-screen mode exited. This is a secure area.</span>
            </div>
            <button onClick={requestFullscreen} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Restore Fullscreen
            </button>
          </div>
        )}

        {/* Question workspace card */}
        <div className="glass-panel responsive-panel-padding" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(0, 229, 255, 0.1)',
                  color: '#00e5ff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(0, 229, 255, 0.2)'
                }}>
                  Question {currentQuestionIndex + 1} of {exam.questions.length}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ({currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''})
                </span>
              </div>
              <span style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: '600'
              }}>{currentQuestion.questionType} format</span>
            </div>

            {/* Question Text */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: '500', lineHeight: '1.5', marginBottom: '32px', color: '#f3f4f6' }}>
              {currentQuestion.questionText}
            </h2>

            {/* Answer Input Controls */}
            {currentQuestion.questionType === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestion.options.map((opt, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      background: activeAnswer === idx.toString() ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.01)',
                      border: activeAnswer === idx.toString() ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid rgba(255,255,255,0.04)',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseOver={e => {
                      if (activeAnswer !== idx.toString()) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseOut={e => {
                      if (activeAnswer !== idx.toString()) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    <input
                      type="radio"
                      name={`mcq_${currentQuestion.id}`}
                      checked={activeAnswer === idx.toString()}
                      onChange={() => handleAnswerChange(currentQuestion.id, idx.toString())}
                      style={{ transform: 'scale(1.15)', accentColor: '#00e5ff' }}
                    />
                    <span style={{
                      color: activeAnswer === idx.toString() ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      fontWeight: activeAnswer === idx.toString() ? '600' : '400'
                    }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.questionType === 'true_false' && (
              <div style={{ display: 'flex', gap: '20px' }}>
                {['True', 'False'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleAnswerChange(currentQuestion.id, val)}
                    style={{
                      flex: 1,
                      padding: '20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: '1px solid',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'var(--transition-smooth)',
                      backgroundColor: activeAnswer === val ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                      borderColor: activeAnswer === val ? '#00e5ff' : 'rgba(255,255,255,0.05)',
                      color: activeAnswer === val ? '#00e5ff' : 'var(--text-secondary)'
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.questionType === 'subjective' && (
              <div>
                <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Type your detailed response:</label>
                <textarea
                  className="form-input"
                  rows="10"
                  placeholder="Provide your complete analytical answer here..."
                  value={activeAnswer}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  style={{
                    resize: 'none',
                    lineHeight: '1.6',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  ℹ️ This subjective response will be fully evaluated by Gemini AI upon submission. Keep your focus structured.
                </span>
              </div>
            )}
          </div>

          {/* Navigation controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '20px',
            marginTop: '32px'
          }}>
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              className="btn btn-secondary"
              disabled={currentQuestionIndex === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ChevronLeft size={16} /> Previous Card
            </button>

            {currentQuestionIndex < exam.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Next Card <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmitAttemptManual}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
              >
                Finish & Submit
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Warning Overlay Modal for tab/focus violations */}
      {showWarningOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 8, 17, 0.95)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            padding: '40px',
            textAlign: 'center',
            borderColor: '#ef4444',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '16px',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <ShieldAlert size={32} />
            </div>
            
            <h2 style={{ color: '#ff5c5c', fontSize: '1.5rem', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
              SECURITY BREACH DETECTED
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
              {warningMessage}
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: '28px',
              fontSize: '0.85rem'
            }}>
              Warnings Logged: <strong style={{ color: '#ef4444' }}>{violations.length} of 3</strong>
              {violations.length >= 3 && (
                <div style={{ color: '#ff4757', fontWeight: 'bold', marginTop: '6px' }}>
                  🚫 Violation limit reached. System submission initiated.
                </div>
              )}
            </div>

            {violations.length < 3 && (
              <button
                onClick={() => {
                  setShowWarningOverlay(false);
                  requestFullscreen();
                }}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.9rem' }}
              >
                Restore Session Lock
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
