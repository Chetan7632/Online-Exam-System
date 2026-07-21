import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldAlert, BookOpen, ArrowRight, Sparkles, Brain } from 'lucide-react';

const Home = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 80px' }}>
      
      {/* Hero Section */}
      <header style={{
        textAlign: 'center',
        padding: '60px 20px 80px',
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 60%)',
        borderRadius: '24px',
        marginBottom: '60px',
        border: '1px solid rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 229, 255, 0.05)',
          padding: '6px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(0, 229, 255, 0.15)',
          marginBottom: '24px'
        }}>
          <Sparkles size={14} color="#00e5ff" />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: '#00e5ff' }}>
            AI-Proctored Examination Platform
          </span>
        </div>
        
        <h1 className="title-glow responsive-title-h1" style={{
          fontWeight: '900',
          lineHeight: '1.2',
          marginBottom: '20px',
          letterSpacing: '0.5px'
        }}>
          Secure, AI-Evaluated<br />Online Exam Suite
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          maxWidth: '650px',
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Welcome to the next generation of academic evaluation. Empowering teachers with automated Google Gemini assessments and securing examinations with real-time browser compliance verification.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '14px 28px', textDecoration: 'none' }}>
            Enter Candidate Portal <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: '14px 28px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            Initialize Registry
          </Link>
        </div>
      </header>

      {/* Platform Features Grid */}
      <section style={{ marginBottom: '80px' }}>
        <h2 className="title-glow" style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '40px' }}>
          Core Competencies
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          <div className="glass-card">
            <div style={{ display: 'inline-flex', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.1)', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
              <ShieldAlert size={24} color="#00e5ff" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#f3f4f6', marginBottom: '12px' }}>AI-Powered Security</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Real-time window focus validation, browser tab lockouts, copy-paste disabled buffers, and full-screen compliance scanning to ensure assessment authenticity.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'inline-flex', background: 'rgba(189, 0, 255, 0.05)', border: '1px solid rgba(189, 0, 255, 0.1)', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
              <Brain size={24} color="#bd00ff" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#f3f4f6', marginBottom: '12px' }}>Gemini Grading Engine</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Instant grading of subjective prompts using custom evaluation keys, scoring indexes, and generating comprehensive analytical feedback for correct learning roadmaps.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ display: 'inline-flex', background: 'rgba(255, 0, 127, 0.05)', border: '1px solid rgba(255, 0, 127, 0.1)', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
              <BookOpen size={24} color="#ff007f" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#f3f4f6', marginBottom: '12px' }}>Chamber Customizer</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Create multiple choice, true/false, and long subjective assessments. Custom parameters allow examiners to configure duration, points, templates, and safety requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '40px',
        marginTop: '60px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div>
            <div className="title-glow" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>150+</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chambers Active</div>
          </div>
          <div>
            <div className="title-glow" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>15k+</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessments Graded</div>
          </div>
          <div>
            <div className="title-glow" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>99.9%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proctor Lock Compliance</div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © 2026 Online Exam Proctored Space. All rights reserved. Registered under global secure examination compliance acts.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginTop: '12px', fontWeight: '500', letterSpacing: '0.5px' }}>
          Designed & Developed by Chetan Badadhe
        </p>
      </footer>
    </div>
  );
};

export default Home;
