import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, BookOpen, ShieldAlert, Award, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="glass-panel" style={{
      margin: '20px auto',
      maxWidth: '1200px',
      padding: '16px 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: '12px',
      position: 'sticky',
      top: '20px',
      zIndex: 100,
      border: '1px solid rgba(0, 229, 255, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Award size={24} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.5))' }} />
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="title-glow" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: '700',
            letterSpacing: '1px'
          }}>
            Online EXAM 
          </span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        {user.role === 'teacher' ? (
          <>
            <Link to="/teacher-dashboard" style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'var(--transition-smooth)'
            }} onMouseOver={e => e.target.style.color = '#00e5ff'}
               onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
              Exams
            </Link>
            <Link to="/create-exam" style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'var(--transition-smooth)'
            }} onMouseOver={e => e.target.style.color = '#00e5ff'}
               onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
              Create Workspace
            </Link>
          </>
        ) : (
          <>
            <Link to="/student-dashboard" style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'var(--transition-smooth)'
            }} onMouseOver={e => e.target.style.color = '#00e5ff'}
               onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
              Dashboard
            </Link>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.03)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
             onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
            <User size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{user.name}</span>
            <span style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              background: user.role === 'teacher' ? 'rgba(189, 0, 255, 0.2)' : 'rgba(0, 229, 255, 0.15)',
              color: user.role === 'teacher' ? '#df6bff' : '#00e5ff',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: '700',
              border: `1px solid ${user.role === 'teacher' ? 'rgba(189,0,255,0.3)' : 'rgba(0,229,255,0.3)'}`
            }}>
              {user.role}
            </span>
          </div>
        </Link>

        <button onClick={handleLogout} className="btn btn-secondary" style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)'
        }} onMouseOver={e => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        }} onMouseOut={e => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        }}>
          <LogOut size={16} color="#ff6b6b" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
