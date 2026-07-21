import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, CheckCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDemoFill = (role) => {
    if (role === 'teacher') {
      setEmail('teacher@onlineexam.com');
      setPassword('teacher123');
    } else {
      setEmail('student@onlineexam.com');
      setPassword('student123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setLoadingLocal(true);
    setErrorMsg('');

    try {
      const user = await login(email, password);
      if (user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="glass-panel responsive-panel-padding" style={{
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(0, 229, 255, 0.15)',
        boxShadow: 'var(--shadow-neon)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(0, 229, 255, 0.1)',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '16px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
          }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ 
                height: '32px', 
                width: '32px', 
                objectFit: 'contain'
              }} 
            />
          </div>
          <h2 className="title-glow" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Login Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
            Welcome back to Online Exam Proctored Space
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#ff5c5c',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '500' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '20px' }} disabled={loadingLocal}>
            {loadingLocal ? 'Connecting Secure Link...' : 'Access Portal'}
          </button>
        </form>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            ⚡ Fast Testing Demo Accounts
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleDemoFill('teacher')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}
            >
              Demo Teacher
            </button>
            <button
              onClick={() => handleDemoFill('student')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px', fontSize: '0.75rem', textTransform: 'uppercase' }}
            >
              Demo Student
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
          New Candidate? <Link to="/register" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: '600' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
