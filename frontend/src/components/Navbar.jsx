import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LogOut, BookOpen, ShieldAlert, User, Sun, Moon, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="glass-panel" style={{
        margin: '20px auto',
        maxWidth: '1200px',
        width: 'calc(100% - 20px)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '12px',
        position: 'sticky',
        top: '20px',
        zIndex: 100,
        border: '1px solid rgba(0, 229, 255, 0.1)',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/logo.png" 
            alt="Online Exam Logo" 
            style={{ 
              height: '24px', 
              width: '24px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.4))'
            }} 
          />
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

        {/* Desktop Links & Actions combined for uniform spacing - Hidden on Mobile */}
        <div className="nav-desktop-links" style={{ marginLeft: 'auto' }}>
          <Link to="/" className="btn btn-secondary" style={{
            textDecoration: 'none',
            padding: '8px 16px',
            fontSize: '0.85rem',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            Home
          </Link>
          {user && (
            user.role === 'teacher' ? (
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
            )
          )}

          {user ? (
            <>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-subtle)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
                   onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
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
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                Access Portal
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem' }}>
                Create Profile
              </Link>
            </>
          )}

          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} color="#00e5ff" style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.4))' }} />
            ) : (
              <Moon size={18} color="#7209b7" style={{ filter: 'drop-shadow(0 0 4px rgba(114,9,183,0.4))' }} />
            )}
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="nav-mobile-toggle"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Toggle Mobile Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`nav-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div className={`nav-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="title-glow" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            fontWeight: '700',
            letterSpacing: '1px'
          }}>
            NAVIGATION
          </span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
          <Link 
            to="/" 
            className="btn btn-secondary" 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ textDecoration: 'none', justifyContent: 'flex-start', padding: '12px' }}
          >
            Home
          </Link>
          {user && (
            user.role === 'teacher' ? (
              <>
                <Link 
                  to="/teacher-dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '10px 8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Exams Dashboard
                </Link>
                <Link 
                  to="/create-exam" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '10px 8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Create Exam
                </Link>
              </>
            ) : (
              <Link 
                to="/student-dashboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  padding: '10px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Student Dashboard
              </Link>
            )
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-subtle)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>{user.name}</span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    background: user.role === 'teacher' ? 'rgba(189, 0, 255, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                    color: user.role === 'teacher' ? '#df6bff' : '#00e5ff',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    border: `1px solid ${user.role === 'teacher' ? 'rgba(189,0,255,0.2)' : 'rgba(0,229,255,0.2)'}`
                  }}>
                    {user.role}
                  </span>
                </div>
              </Link>

              <button 
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} 
                className="btn btn-secondary" 
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ff6b6b',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={16} /> Log Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="btn btn-secondary" 
                style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
              >
                Access Portal
              </Link>
              <Link 
                to="/register" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="btn btn-primary" 
                style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}
              >
                Create Profile
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle Theme:</span>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun size={18} color="#00e5ff" />
              ) : (
                <Moon size={18} color="#7209b7" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

