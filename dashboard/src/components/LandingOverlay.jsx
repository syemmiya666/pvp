import React from 'react';

export default function LandingOverlay({ guilds, onSelectGuild }) {
  if (!guilds || guilds.length === 0) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, background: 'rgba(5,5,5,0.95)' }}>
      <div className="modal-card glass-panel pop-in" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h2>Welcome to Zenith</h2>
        <p className="modal-subtitle">Select a server to manage its dashboard.</p>
        
        <div className="landing-grid mt-4">
          {guilds.map(g => (
            <div 
              key={g.id} 
              className="landing-guild-card" 
              onClick={() => onSelectGuild(g.id)}
            >
              {g.icon ? (
                <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`} alt="Server Icon" />
              ) : (
                <div className="placeholder-icon">#</div>
              )}
              <h3>{g.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

