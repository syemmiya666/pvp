import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('zenith_token', token);
      localStorage.removeItem('zenith_guild_id');
      setStatus({ type: 'success', text: 'Authentication successful! Redirecting...' });
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else if (error) {
      setStatus({ type: 'error', text: `Authentication Failed: ${error}` });
    }
  }, [location, navigate]);

  return (
    <div className="login-body">
      <div className="login-card glass-panel">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          margin: '0 auto 20px auto',
          background: 'rgba(88, 101, 242, 0.1)',
          border: '1px solid rgba(88, 101, 242, 0.3)',
          borderRadius: '24px',
          boxShadow: '0 0 30px rgba(88, 101, 242, 0.2)'
        }}>
          <span style={{ 
            fontSize: '3.5rem', 
            fontWeight: '900', 
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1,
            background: 'linear-gradient(135deg, #00A8FC, #5865F2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px rgba(88, 101, 242, 0.5))'
          }}>
            Z
          </span>
        </div>
        <h2 className="brand-text-glow" style={{ margin: 0, paddingBottom: '5px' }}>ZENITH</h2>
        <p>Premium Guild Management & Automation</p>
        
        {!status ? (
          <a href="/api/auth/login" className="btn-discord" style={{ textDecoration: 'none' }}>
            <i className="fa-brands fa-discord"></i> Login with Discord
          </a>
        ) : (
          <div id="login-status">
            <span style={{ color: status.type === 'success' ? '#4ADE80' : 'red' }}>
              {status.type === 'error' && <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '8px' }}></i>}
              {status.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

