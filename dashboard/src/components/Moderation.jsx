import React, { useState, useEffect } from 'react';

export default function Moderation({ selectedGuild }) {
  const [warnings, setWarnings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cases');

  useEffect(() => {
    fetchData();
  }, [selectedGuild]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zenith_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [warnRes, caseRes] = await Promise.all([
        fetch(`/api/moderation/${selectedGuild}/warnings`, { headers }),
        fetch(`/api/moderation/${selectedGuild}/cases`, { headers })
      ]);

      if (warnRes.ok) setWarnings(await warnRes.json());
      if (caseRes.ok) setCases(await caseRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteWarning = async (warningId) => {
    try {
      const token = localStorage.getItem('zenith_token');
      const res = await fetch(`/api/moderation/${selectedGuild}/warnings/${warningId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setWarnings(warnings.filter(w => w._id !== warningId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateCaseReason = async (caseId, newReason) => {
    try {
      const token = localStorage.getItem('zenith_token');
      const res = await fetch(`/api/moderation/${selectedGuild}/cases/${caseId}/reason`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: newReason })
      });
      if (res.ok) {
        setCases(cases.map(c => c.caseId === caseId ? { ...c, reason: newReason } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredWarnings = warnings.filter(w => 
    w.userId.includes(searchTerm) || 
    (w.reason && w.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCases = cases.filter(c => 
    c.targetId.includes(searchTerm) || 
    c.targetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.reason && c.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="loader">Loading Moderation Records...</div>;

  return (
    <div className="moderation-container animate-fade-in">
      <div className="section-header">
        <h2 className="glow-text"><i className="fa-solid fa-gavel"></i> Server Moderation</h2>
        <p className="subtitle">Manage cases and warnings for this server.</p>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <i className="fa-solid fa-folder-open"></i> Moderation Cases
        </button>
        <button 
          className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('warnings')}
        >
          <i className="fa-solid fa-triangle-exclamation"></i> Warnings List
        </button>
      </div>

      <div className="glass-panel search-bar-container">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input 
          type="text" 
          placeholder={`Search ${activeTab}...`} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {activeTab === 'cases' ? (
        <div className="cases-list">
          {filteredCases.length > 0 ? (
            filteredCases.map(c => (
              <div key={c._id} className="glass-panel case-row">
                <div className="case-id">#{c.caseId}</div>
                <div className="case-action-badge" data-action={c.action}>{c.action}</div>
                <div className="case-user">
                  <span className="user-tag">{c.targetTag}</span>
                  <span className="user-id">{c.targetId}</span>
                </div>
                <div className="case-reason">{c.reason}</div>
                <div className="case-mod">
                  <span className="mod-label">Mod:</span>
                  <span className="mod-tag">{c.moderatorTag}</span>
                </div>
                <div className="case-date">{new Date(c.timestamp).toLocaleDateString()}</div>
              </div>
            ))
          ) : (
            <div className="glass-panel no-results">No cases found.</div>
          )}
        </div>
      ) : (
        <div className="warnings-grid">
          {filteredWarnings.length > 0 ? (
            filteredWarnings.map(warning => (
              <div key={warning._id} className="glass-panel warning-card">
                <div className="warning-header">
                  <span className="user-badge">User ID: {warning.userId}</span>
                  <span className="date-badge">{new Date(warning.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="warning-body">
                  <p className="reason-label">Reason:</p>
                  <p className="reason-text">{warning.reason || 'No reason provided.'}</p>
                  <p className="moderator-text">By: <span className="mod-id">{warning.moderatorId}</span></p>
                </div>
                <div className="warning-footer">
                  <button onClick={() => deleteWarning(warning._id)} className="btn-danger-outline">
                    <i className="fa-solid fa-trash-can"></i> Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel no-results">No warnings found.</div>
          )}
        </div>
      )}

      <style jsx>{`
        .moderation-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .tabs-container {
          display: flex;
          gap: 15px;
          margin-bottom: 5px;
        }
        .tab-btn {
          background: var(--panel-bg);
          border: 1px solid var(--panel-border);
          color: var(--text-secondary);
          padding: 12px 24px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }
        .tab-btn:hover {
          background: rgba(255, 102, 178, 0.1);
          color: var(--premium-pink);
        }
        .tab-btn.active {
          background: var(--premium-pink);
          color: #fff;
          border-color: var(--premium-pink);
          box-shadow: var(--accent-glow);
        }
        .cases-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .case-row {
          display: grid;
          grid-template-columns: 60px 100px 200px 1fr 180px 100px;
          align-items: center;
          padding: 15px 25px;
          gap: 20px;
        }
        .case-id {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          color: var(--premium-pink);
          font-size: 1.1rem;
        }
        .case-action-badge {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          text-align: center;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.1);
        }
        .case-action-badge[data-action="BAN"] { color: #ff4444; background: rgba(255, 68, 68, 0.15); }
        .case-action-badge[data-action="KICK"] { color: #ffbb33; background: rgba(255, 187, 51, 0.15); }
        .case-action-badge[data-action="MUTE"] { color: #ff8800; background: rgba(255, 136, 0, 0.15); }
        .case-action-badge[data-action="WARN"] { color: #ffeb3b; background: rgba(255, 235, 59, 0.15); }
        
        .case-user {
          display: flex;
          flex-direction: column;
        }
        .user-tag { font-weight: 600; }
        .user-id { font-size: 0.75rem; color: var(--text-secondary); }

        .case-reason {
          font-size: 0.95rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .case-mod {
          font-size: 0.85rem;
          display: flex;
          gap: 8px;
        }
        .mod-label { color: var(--text-secondary); }
        .case-date {
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: right;
        }

        .glow-text {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          color: #fff;
          text-shadow: 0 0 15px rgba(255, 102, 178, 0.3);
          margin-bottom: 5px;
        }
        .subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
        }
        .search-bar-container {
          display: flex;
          align-items: center;
          padding: 15px 25px;
          gap: 15px;
          border-radius: 12px;
        }
        .search-input {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.1rem;
          width: 100%;
          outline: none;
        }
        .warnings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        .warning-card {
          padding: 25px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .warning-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-badge {
          background: rgba(255, 102, 178, 0.15);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-family: monospace;
        }
        .date-badge {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .reason-label {
          color: var(--text-secondary);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
        }
        .reason-text {
          font-size: 1.1rem;
          margin-bottom: 10px;
        }
        .moderator-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        .mod-id {
          color: #fff;
          font-family: monospace;
        }
        .btn-danger-outline {
          background: none;
          border: 1px solid var(--danger);
          color: var(--danger);
          padding: 8px 15px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          align-self: flex-end;
        }
        .btn-danger-outline:hover {
          background: var(--danger);
          color: #fff;
        }
        .no-results {
          grid-column: 1 / -1;
          padding: 50px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          color: var(--text-secondary);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

