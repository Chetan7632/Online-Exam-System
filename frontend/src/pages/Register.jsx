import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, UserCheck } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoadingLocal(true);
    setErrorMsg('');

    try {
      await register(name, email, password, role);
      if (role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
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
        border: '1px solid rgba(189, 0, 255, 0.15)',
        boxShadow: 'var(--shadow-purple)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(189, 0, 255, 0.1)',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '16px',
            border: '1px solid rgba(189, 0, 255, 0.3)',
            boxShadow: '0 0 15px rgba(189, 0, 255, 0.2)'
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
          <h2 className="title-glow" style={{
            fontSize: '1.5rem',
            marginBottom: '8px',
            background: 'linear-gradient(to right, #bd00ff, #ffffff, #ff007f)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Create Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
            Register your exam credentials to begin
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
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

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
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">System Role</label>
            <div style={{ position: 'relative' }}>
              <UserCheck size={18} color="var(--text-secondary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <select
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ paddingLeft: '44px' }}
              >
                <option value="student">Student (Candidate)</option>
                <option value="teacher">Teacher (Instructor)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{
            width: '100%',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))'
          }} disabled={loadingLocal}>
            {loadingLocal ? 'Processing Schema...' : 'Initialize Registry'}
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
          Already registered? <Link to="/login" style={{ color: '#bd00ff', textDecoration: 'none', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
