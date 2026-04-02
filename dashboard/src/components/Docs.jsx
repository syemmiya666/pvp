import React from 'react';

export default function Docs() {
  const credits = [
    {
      name: 'Devrock',
      avatar: 'https://raw.githubusercontent.com/devrock07/devrock07/refs/heads/main/assets/HeadIcon.png',
      github: 'https://github.com/devrock07',
      discord: 'https://discord.com/users/959733702609494076'
    },
    {
      name: 'Foil',
      avatar: 'https://avatars.githubusercontent.com/u/206226445?s=400&u=1240c5691ad5e11790198e28bd506431a92afb6a&v=4',
      github: 'https://github.com/aryanshrai03',
      discord: 'https://discord.com/users/1252101579855630346'
    }
  ];

  const sections = [
    {
      title: 'Moderation Suite',
      icon: 'fa-gavel',
      color: '#ff66b2',
      commands: [
        { name: '/ban', desc: 'Permanently remove a user from the server with a logged case ID.' },
        { name: '/kick', desc: 'Remove a user from the server with an automated case entry.' },
        { name: '/mute', desc: 'Timeout a user for a specific duration (supports aliases like /timeout).' },
        { name: '/warn', desc: 'Issue a formal warning. Warnings are tracked in the database and visible on the dashboard.' },
        { name: '/massban', desc: 'Ban up to 20 users at once using their IDs. Essential for raid defense.' },
        { name: '/case', desc: 'View or update the reason for any moderation case using its ID.' },
        { name: '/serverinfo', desc: 'Get a clean snapshot of the current guild, channel counts, boosts, and ownership.' },
        { name: '/userinfo', desc: 'Inspect join date, top role, nickname, and account details for a member.' }
      ]
    },
    {
      title: 'Auto Moderation',
      icon: 'fa-shield-halved',
      color: '#00c851',
      features: [
        { name: 'AI Toxicity Engine', desc: 'Powered by Llama-3, scans messages for insults, threats, and offensive language in real-time.' },
        { name: 'Static Defense', desc: 'High-speed filters for spam velocity, mass mentions, excessive caps, and invite links.' },
        { name: 'Custom Rules', desc: 'Blacklist specific words or whitelist trusted domains directly from the dashboard.' },
        { name: 'Automated Escalation', desc: 'Configure the bot to auto-warn or auto-mute users who violate AutoMod rules.' },
        { name: 'AutoMod Simulator', desc: 'Preview how a sample message would behave against the current configuration before saving changes.' }
      ]
    },
    {
      title: 'Dashboard Guide',
      icon: 'fa-chart-pie',
      color: '#33b5e5',
      tips: [
        { name: 'Real-time Stats', desc: 'Monitor your server health score and moderation activity charts on the Overview page.' },
        { name: 'Case Management', desc: 'Audit your mod team by viewing every single action taken in the Moderation tab.' },
        { name: 'One-Click Presets', desc: 'Use "Strict" or "Chill" modes to instantly configure your AutoMod security levels.' },
        { name: 'Command Center', desc: 'Browse every shipped command, search aliases, and understand categories from one dashboard page.' }
      ]
    },
    {
      title: 'Utility Toolkit',
      icon: 'fa-screwdriver-wrench',
      color: '#8b5cf6',
      commands: [
        { name: '/avatar', desc: 'Grab a full-resolution avatar link for any user.' },
        { name: '/botstats', desc: 'Check uptime, memory usage, ping, and total command coverage.' },
        { name: '/roleinfo', desc: 'Inspect role metadata like member count, position, and color.' }
      ]
    }
  ];

  return (
    <div className="docs-container animate-fade-in">
      <div className="docs-header">
        <h1 className="glow-text">Zenith <span className="badge">Documentation</span></h1>
        <p className="subtitle">Everything you need to know about your elite moderation system.</p>
      </div>

      <div className="glass-panel credits-card">
        <div className="credits-title-wrap">
          <h2>Credits</h2>
        </div>

        <div className="credits-grid">
          {credits.map(person => (
            <div key={person.name} className="credit-profile">
              <img src={person.avatar} alt={person.name} className="credit-avatar" />
              <div className="credit-info">
                <h3>{person.name}</h3>
                <p>Developer</p>
              </div>
              <div className="credit-actions">
                <a href={person.github} target="_blank" rel="noreferrer" className="credit-btn github">
                  <i className="fa-brands fa-github"></i>
                  GitHub
                </a>
                <a href={person.discord} target="_blank" rel="noreferrer" className="credit-btn discord">
                  <i className="fa-brands fa-discord"></i>
                  Discord
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="docs-grid">
        {sections.map(section => (
          <div key={section.title} className="glass-panel docs-card">
            <div className="section-title">
              <i className={`fa-solid ${section.icon}`} style={{ color: section.color }}></i>
              <h3>{section.title}</h3>
            </div>
            
            <div className="docs-content">
              {section.commands && section.commands.map(cmd => (
                <div key={cmd.name} className="doc-item">
                  <span className="cmd-name">{cmd.name}</span>
                  <p className="cmd-desc">{cmd.desc}</p>
                </div>
              ))}
              
              {section.features && section.features.map(feat => (
                <div key={feat.name} className="doc-item">
                  <span className="feat-name">{feat.name}</span>
                  <p className="feat-desc">{feat.desc}</p>
                </div>
              ))}

              {section.tips && section.tips.map(tip => (
                <div key={tip.name} className="doc-item">
                  <span className="tip-name">{tip.name}</span>
                  <p className="tip-desc">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .docs-container { padding: 20px; display: flex; flex-direction: column; gap: 30px; }
        .docs-header { text-align: center; }
        .docs-header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .subtitle { color: var(--text-secondary); font-size: 1.1rem; }
        .credits-card { padding: 30px; display: flex; flex-direction: column; gap: 24px; }
        .credits-title-wrap { text-align: center; }
        .credits-title-wrap h2 { font-size: 1.8rem; margin: 0; }
        .credits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .credit-profile { border-radius: 20px; padding: 22px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
        .credit-avatar { width: 96px; height: 96px; border-radius: 24px; object-fit: cover; box-shadow: 0 14px 30px rgba(0,0,0,0.25); }
        .credit-info h3 { margin: 0; font-size: 1.35rem; }
        .credit-info p { margin: 8px 0 0; color: var(--text-secondary); line-height: 1.6; font-size: 0.92rem; }
        .credit-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .credit-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; text-decoration: none; font-weight: 600; transition: 0.25s ease; border: 1px solid rgba(255,255,255,0.08); }
        .credit-btn.github { background: rgba(255,255,255,0.05); color: #fff; }
        .credit-btn.discord { background: rgba(88, 101, 242, 0.16); color: #cdd7ff; }
        .credit-btn:hover { transform: translateY(-2px); }
        
        .docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; }
        .docs-card { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
        
        .section-title { display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; }
        .section-title i { font-size: 1.5rem; }
        .section-title h3 { font-size: 1.3rem; margin: 0; }

        .docs-content { display: flex; flex-direction: column; gap: 20px; }
        .doc-item { display: flex; flex-direction: column; gap: 5px; }
        
        .cmd-name, .feat-name, .tip-name { 
          color: var(--premium-pink); 
          font-weight: 700; 
          font-family: var(--font-heading);
          font-size: 1rem;
        }
        
        .cmd-desc, .feat-desc, .tip-desc { 
          color: var(--text-secondary); 
          font-size: 0.9rem; 
          line-height: 1.5;
          margin: 0;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }

        @media (max-width: 768px) {
          .credits-grid { grid-template-columns: 1fr; }
          .credits-card { padding: 22px; }
          .docs-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

