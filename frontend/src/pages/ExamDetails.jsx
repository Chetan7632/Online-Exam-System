import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Clock, HelpCircle, ShieldAlert, Camera, Check, Eye } from 'lucide-react';

const ExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, apiUrl } = useContext(AuthContext);

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Camera check states
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/exams/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Exam chamber template not found');
        const data = await response.json();
        setExam(data);
      } catch (err) {
        setError(err.message || 'Error loading exam data');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();

    return () => {
      // Stop camera stream when leaving page
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [id, token, apiUrl]);

  const requestCameraAccess = async () => {
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraAccess(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is highly recommended. The exam environment will simulate visual scanning if permission is blocked.');
      setHasCameraAccess(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const handleStartExam = () => {
    // Navigate to exam session page
    navigate(`/exam/${id}/take`);
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

  if (error || !exam) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#ff5c5c', marginBottom: '16px' }}>Error Loading Chamber</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'Unable to load examination details.'}</p>
          <Link to="/student-dashboard" className="btn btn-secondary">Return to Workspace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="title-glow" style={{ fontSize: '2rem', marginBottom: '6px' }}>Secure Exam Chamber Check-in</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Pre-flight authorization and hardware calibration workspace</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '5fr 4fr',
        gap: '32px'
      }}>
        {/* Left Column: Instructions and Core Data */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{exam.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
            {exam.description || 'This examination will verify your proficiency in the subject matter. Ensure a stable internet connection.'}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '32px',
            background: 'rgba(0,0,0,0.15)',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> Exam Duration</span>
              <strong style={{ color: '#00e5ff' }}>{exam.duration} Minutes</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={16} /> Total Question Cards</span>
              <strong>{exam.questions ? exam.questions.length : 0} Questions</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={16} /> Pass Threshold</span>
              <strong>{exam.passingScore}% Correct answers</strong>
            </div>
          </div>

          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', color: '#ff4757' }}>
            ⚠️ AI PROCTORING OPERATIONAL PROTOCOL:
          </h3>
          <ul style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingLeft: '20px',
            marginBottom: '28px',
            lineHeight: '1.5'
          }}>
            <li><strong>Full-Screen Mandate:</strong> The workspace runs exclusively in full-screen. Do not minimize or leave full-screen.</li>
            <li><strong>Tab Focus Lock:</strong> Any tab switching or window minimization logs a proctoring violation immediately.</li>
            <li><strong>Clipboard Operations Blocked:</strong> Copying/pasting content is disabled inside the examination sheets.</li>
            <li><strong>Auto-Submit Threshold:</strong> Logging <strong>3 or more focus violations</strong> will trigger immediate system lockout and automated exam submission.</li>
          </ul>

          <button onClick={handleStartExam} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
            Enter Proctored Chamber
          </button>
        </div>

        {/* Right Column: Hardware / Webcam Verification */}
        <div className="glass-panel" style={{
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          border: '1px solid rgba(0, 229, 255, 0.15)'
        }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Camera size={18} color="#00e5ff" /> Visual Calibrator
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px', maxWidth: '280px' }}>
            Verify your webcam feed to activate visual scanning analytics.
          </p>

          <div style={{
            width: '100%',
            aspectRatio: '4/3',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Visual scanlines overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
              backgroundSize: '100% 4px, 6px 100%',
              zIndex: 3,
              pointerEvents: 'none'
            }} />

            {/* Glowing sweep bar if camera is running */}
            {hasCameraAccess && (
              <div style={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: '4px',
                background: 'rgba(0, 229, 255, 0.6)',
                boxShadow: '0 0 10px #00e5ff',
                zIndex: 4,
                animation: 'scan-line 3s linear infinite',
                pointerEvents: 'none'
              }} />
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: hasCameraAccess ? 'block' : 'none'
              }}
            />

            {!hasCameraAccess && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.05)',
                  marginBottom: '12px'
                }}>
                  <Eye size={24} color="var(--text-muted)" />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Camera feed offline</p>
              </div>
            )}
          </div>

          {!hasCameraAccess ? (
            <button
              onClick={requestCameraAccess}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem' }}
              disabled={cameraLoading}
            >
              {cameraLoading ? 'Calibrating...' : 'Allow Webcam Access'}
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#10b981',
              fontSize: '0.85rem',
              fontWeight: '600',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              width: '100%'
            }}>
              <Check size={16} /> CAMERA STREAM CALIBRATED
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

export default ExamDetails;
