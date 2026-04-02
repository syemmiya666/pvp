import React, { useState, useEffect } from 'react';

export default function AutoModeration({ selectedGuild }) {
  const [config, setConfig] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [wordInput, setWordInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [simulatorInput, setSimulatorInput] = useState('FREE NITRO!!! Join discord.gg/example right now');
  const [simulatorMentions, setSimulatorMentions] = useState(0);
  const [simulatorAttachments, setSimulatorAttachments] = useState(0);
  const [simulatorResult, setSimulatorResult] = useState(null);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedGuild]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zenith_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [confRes, dataRes, insightsRes] = await Promise.all([
        fetch(`/api/automod/${selectedGuild}`, { headers }),
        fetch(`/api/guilds/${selectedGuild}/data`, { headers }),
        fetch(`/api/overview/${selectedGuild}/config-insights`, { headers })
      ]);

      if (confRes.ok) {
        const data = await confRes.json();
        setConfig(data);
        setOriginalConfig(JSON.parse(JSON.stringify(data)));
      }
      if (dataRes.ok) {
        const d = await dataRes.json();
        setChannels(d.channels || []);
      }
      if (insightsRes.ok) {
        const insights = await insightsRes.json();
        setRecommendations(insights.recommendations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  };

  const handleUpdate = (newConfig) => {
    setConfig(newConfig);
    setHasChanges(JSON.stringify(newConfig) !== JSON.stringify(originalConfig));
  };

  const saveChanges = async () => {
    try {
        const token = localStorage.getItem('zenith_token');
        const res = await fetch(`/api/automod/${selectedGuild}/config`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        if (res.ok) {
            const data = await res.json();
            setConfig(data.config || config);
            setOriginalConfig(JSON.parse(JSON.stringify(data.config || config)));
            setRecommendations(data.recommendations || []);
            setHasChanges(false);
        }
    } catch(e) {
        console.error(e);
    }
  };

  const revertChanges = () => {
    setConfig(JSON.parse(JSON.stringify(originalConfig)));
    setHasChanges(false);
  };

  const toggleMain = () => handleUpdate({ ...config, enabled: !config.enabled });

  const toggleCategory = (category) => {
    const updated = { ...config, ai: { ...config.ai, [category]: { ...config.ai[category], enabled: !config.ai[category].enabled } } };
    handleUpdate(updated);
  };

  const changeLevel = (category, level) => {
    const updated = { ...config, ai: { ...config.ai, [category]: { ...config.ai[category], level } } };
    handleUpdate(updated);
  };

  const toggleStatic = (mod) => {
    const updated = { ...config, static: { ...config.static, [mod]: { ...config.static[mod], enabled: !config.static[mod]?.enabled } } };
    handleUpdate(updated);
  };

  const changeStaticLimit = (mod, field, value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return;
    const updated = { ...config, static: { ...config.static, [mod]: { ...config.static[mod], [field]: num } } };
    handleUpdate(updated);
  };

  const toggleAction = (action) => {
    const updated = { ...config, actions: { ...config.actions, [action]: !config.actions[action] } };
    handleUpdate(updated);
  };

  const changeLogChannel = (e) => {
    const updated = { ...config, actions: { ...config.actions, logsChannelId: e.target.value } };
    handleUpdate(updated);
  };

  const addWord = () => {
    if (!wordInput.trim()) return;
    const current = config.static.words?.blacklist || [];
    if (current.includes(wordInput.trim().toLowerCase())) return;
    const updated = { ...config, static: { ...config.static, words: { ...config.static.words, blacklist: [...current, wordInput.trim().toLowerCase()] } } };
    handleUpdate(updated);
    setWordInput('');
  };

  const removeWord = (word) => {
    const current = config.static.words?.blacklist || [];
    const updated = { ...config, static: { ...config.static, words: { ...config.static.words, blacklist: current.filter(w => w !== word) } } };
    handleUpdate(updated);
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    const current = config.static.links?.whitelist || [];
    if (current.includes(linkInput.trim().toLowerCase())) return;
    const updated = { ...config, static: { ...config.static, links: { ...config.static.links, whitelist: [...current, linkInput.trim().toLowerCase()] } } };
    handleUpdate(updated);
    setLinkInput('');
  };

  const removeLink = (link) => {
    const current = config.static.links?.whitelist || [];
    const updated = { ...config, static: { ...config.static, links: { ...config.static.links, whitelist: current.filter(l => l !== link) } } };
    handleUpdate(updated);
  };

  const applyPreset = (type) => {
    let updated = JSON.parse(JSON.stringify(config));
    if (type === 'strict') {
      updated.static = {
        ...updated.static,
        spam: { enabled: true, limit: 3 },
        mentions: { enabled: true, limit: 3 },
        caps: { enabled: true, percent: 50 },
        invites: { enabled: true },
        links: { ...updated.static.links, enabled: true }
      };
      updated.ai = {
        insults: { enabled: true, level: 'Strict' },
        threats: { enabled: true, level: 'Strict' },
        identityAttacks: { enabled: true, level: 'Strict' },
        offensiveLanguage: { enabled: true, level: 'Strict' }
      };
    } else if (type === 'chill') {
      updated.static = {
        ...updated.static,
        spam: { enabled: true, limit: 10 },
        mentions: { enabled: false, limit: 10 },
        caps: { enabled: false, percent: 90 },
        invites: { enabled: false },
        links: { ...updated.static.links, enabled: false }
      };
      updated.ai = {
        insults: { enabled: true, level: 'Low' },
        threats: { enabled: false, level: 'Low' },
        identityAttacks: { enabled: false, level: 'Low' },
        offensiveLanguage: { enabled: false, level: 'Low' }
      };
    }
    handleUpdate(updated);
  };

  const runSimulation = async () => {
    try {
      setSimulatorLoading(true);
      const token = localStorage.getItem('zenith_token');
      const res = await fetch(`/api/automod/${selectedGuild}/simulate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config,
          content: simulatorInput,
          mentions: simulatorMentions,
          attachments: simulatorAttachments
        })
      });

      if (res.ok) {
        setSimulatorResult(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSimulatorLoading(false);
    }
  };

  if (loading || !config) return <div className="loader">Loading Security Matrix...</div>;

  const staticConfig = config.static || {};

  return (
    <div className="automod-container animate-fade-in">
      <div className="automod-header">
        <div className="header-info">
          <h2 className="glow-text">Auto Moderation</h2>
          <p className="subtitle">AI-powered protection and static filtering engine.</p>
        </div>
        <div className="header-actions">
          <div className="preset-selector">
            <span>Presets:</span>
            <button onClick={() => applyPreset('chill')} className="btn-secondary">Chill</button>
            <button onClick={() => applyPreset('strict')} className="btn-secondary strict">Strict</button>
          </div>
          <label className="main-toggle">
            <input type="checkbox" checked={config.enabled} onChange={toggleMain} />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {!!recommendations.length && (
        <div className="glass-panel mod-section full-width">
          <div className="section-title">
            <i className="fa-solid fa-lightbulb"></i>
            <h3>Configuration Guidance</h3>
          </div>
          <div className="recommendation-grid">
            {recommendations.map((item, index) => (
              <div key={`${item.title}-${index}`} className={`recommendation-card ${item.level || 'info'}`}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="automod-grid">
        
        <div className="glass-panel mod-section">
          <div className="section-title">
            <i className="fa-solid fa-bolt-lightning"></i>
            <h3>Static Defense Layers</h3>
          </div>
          
          <div className="filter-list">
            {[
              { id: 'spam', label: 'Spam Velocity', icon: 'fa-gauge-high', field: 'limit' },
              { id: 'mentions', label: 'Mass Mentions', icon: 'fa-at', field: 'limit' },
              { id: 'attachments', label: 'Attachment Flood', icon: 'fa-paperclip', field: 'limit' },
              { id: 'caps', label: 'Excessive Caps', icon: 'fa-font', field: 'percent' },
              { id: 'emojis', label: 'Emoji Spam', icon: 'fa-face-smile', field: 'limit' },
              { id: 'masslines', label: 'Wall of Text', icon: 'fa-align-left', field: 'limit' },
              { id: 'invites', label: 'Discord Invites', icon: 'fa-link-slash' }
            ].map(filter => (
              <div key={filter.id} className={`filter-card ${staticConfig[filter.id]?.enabled ? 'active' : ''}`}>
                <div className="filter-main">
                  <i className={`fa-solid ${filter.icon}`}></i>
                  <span>{filter.label}</span>
                  <label className="toggle-sm">
                    <input type="checkbox" checked={staticConfig[filter.id]?.enabled} onChange={() => toggleStatic(filter.id)} />
                    <span className="slider"></span>
                  </label>
                </div>
                {filter.field && staticConfig[filter.id]?.enabled && (
                  <div className="filter-settings">
                    <span className="label-sm">{filter.field === 'percent' ? 'Threshold %' : 'Max Limit'}</span>
                    <input 
                      type="number" 
                      value={staticConfig[filter.id][filter.field]} 
                      onChange={(e) => changeStaticLimit(filter.id, filter.field, e.target.value)} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        
        <div className="glass-panel mod-section ai-section">
          <div className="section-title">
            <i className="fa-solid fa-brain"></i>
            <h3>AI Toxicity Engine (Llama-3)</h3>
          </div>

          <div className="ai-categories">
            {Object.keys(config.ai).map(cat => (
              <div key={cat} className={`ai-card ${config.ai[cat].enabled ? 'active' : ''}`}>
                <div className="ai-card-header">
                  <span className="cat-name">{cat.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <label className="toggle-sm">
                    <input type="checkbox" checked={config.ai[cat].enabled} onChange={() => toggleCategory(cat)} />
                    <span className="slider"></span>
                  </label>
                </div>
                {config.ai[cat].enabled && (
                  <div className="ai-levels">
                    {['Low', 'Medium', 'Strict'].map(lvl => (
                      <button 
                        key={lvl} 
                        className={`lvl-btn ${config.ai[cat].level === lvl ? 'active' : ''}`}
                        onClick={() => changeLevel(cat, lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        
        <div className="glass-panel mod-section full-width">
          <div className="section-title">
            <i className="fa-solid fa-list-check"></i>
            <h3>Custom Rules (Words & Links)</h3>
          </div>
          <div className="custom-rules-grid">
            <div className="rule-box">
              <div className="rule-header">
                <span>Blacklisted Words</span>
                <label className="toggle-sm">
                  <input type="checkbox" checked={staticConfig.words?.enabled} onChange={() => toggleStatic('words')} />
                  <span className="slider"></span>
                </label>
              </div>
              {staticConfig.words?.enabled && (
                <div className="rule-content">
                  <div className="input-group">
                    <input type="text" placeholder="Add word..." value={wordInput} onChange={(e) => setWordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addWord()} />
                    <button onClick={addWord}><i className="fa-solid fa-plus"></i></button>
                  </div>
                  <div className="tag-cloud">
                    {staticConfig.words?.blacklist?.map(w => (
                      <span key={w} className="tag">{w} <i className="fa-solid fa-xmark" onClick={() => removeWord(w)}></i></span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rule-box">
              <div className="rule-header">
                <span>Whitelisted Links</span>
                <label className="toggle-sm">
                  <input type="checkbox" checked={staticConfig.links?.enabled} onChange={() => toggleStatic('links')} />
                  <span className="slider"></span>
                </label>
              </div>
              {staticConfig.links?.enabled && (
                <div className="rule-content">
                  <div className="input-group">
                    <input type="text" placeholder="Add domain (e.g. google.com)..." value={linkInput} onChange={(e) => setLinkInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLink()} />
                    <button onClick={addLink}><i className="fa-solid fa-plus"></i></button>
                  </div>
                  <div className="tag-cloud">
                    {staticConfig.links?.whitelist?.map(l => (
                      <span key={l} className="tag">{l} <i className="fa-solid fa-xmark" onClick={() => removeLink(l)}></i></span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        
        <div className="glass-panel mod-section full-width">
          <div className="section-title">
            <i className="fa-solid fa-shield-halved"></i>
            <h3>Automated Response Logic</h3>
          </div>
          
          <div className="actions-grid">
            <div className="action-toggle-list">
              {[
                { id: 'deleteMessage', label: 'Instantly Delete Violation', icon: 'fa-trash' },
                { id: 'warnUser', label: 'Issue Automated Warning', icon: 'fa-triangle-exclamation' },
                { id: 'muteUser', label: 'Apply Temporary Timeout', icon: 'fa-clock' },
                { id: 'reportToModerators', label: 'Log to Mod-Channel', icon: 'fa-clipboard-list' }
              ].map(action => (
                <div key={action.id} className="action-row">
                  <div className="action-info">
                    <i className={`fa-solid ${action.icon}`}></i>
                    <span>{action.label}</span>
                  </div>
                  <label className="toggle-sm">
                    <input type="checkbox" checked={config.actions[action.id]} onChange={() => toggleAction(action.id)} />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>

            <div className="action-config-details">
              {config.actions.muteUser && (
                <div className="config-item">
                  <label>Mute Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={config.actions.muteDuration || 10} 
                    onChange={(e) => handleUpdate({ ...config, actions: { ...config.actions, muteDuration: parseInt(e.target.value) || 10 } })}
                  />
                </div>
              )}
              {config.actions.reportToModerators && (
                <div className="config-item">
                  <label>Log Channel</label>
                  <select value={config.actions.logsChannelId || ''} onChange={changeLogChannel}>
                    <option value="">Select a channel...</option>
                    {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel mod-section full-width">
          <div className="section-title">
            <i className="fa-solid fa-flask"></i>
            <h3>AutoMod Simulator</h3>
          </div>

          <div className="simulator-grid">
            <div className="simulator-form">
              <label>Sample Message</label>
              <textarea
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                placeholder="Type a sample message to test against the current config..."
              />

              <div className="simulator-input-row">
                <div className="config-item">
                  <label>Mention Count</label>
                  <input type="number" value={simulatorMentions} onChange={(e) => setSimulatorMentions(parseInt(e.target.value) || 0)} />
                </div>
                <div className="config-item">
                  <label>Attachment Count</label>
                  <input type="number" value={simulatorAttachments} onChange={(e) => setSimulatorAttachments(parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <button className="btn-save" onClick={runSimulation} disabled={simulatorLoading}>
                {simulatorLoading ? 'Testing...' : 'Run Simulation'}
              </button>
            </div>

            <div className="simulator-result">
              {simulatorResult ? (
                <>
                  <div className={`simulation-status ${simulatorResult.result?.isViolation ? 'danger' : 'success'}`}>
                    <i className={`fa-solid ${simulatorResult.result?.isViolation ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                    <span>{simulatorResult.result?.isViolation ? 'Violation Detected' : 'No Static Violation Detected'}</span>
                  </div>
                  <p className="simulation-reason">
                    {simulatorResult.result?.reason || 'This sample passed the static filtering rules with the current config.'}
                  </p>
                  {simulatorResult.coverage && (
                    <div className="simulation-coverage">
                      <span>Static: {simulatorResult.coverage.staticEnabled}/{simulatorResult.coverage.staticTotal}</span>
                      <span>AI: {simulatorResult.coverage.aiEnabled}/{simulatorResult.coverage.aiTotal}</span>
                      <span>Words: {simulatorResult.coverage.wordsCount}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="simulation-placeholder">
                  <i className="fa-solid fa-vial-circle-check"></i>
                  <p>Run a simulation to preview how the current configuration reacts before you save it.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
      <div className={`save-bar-container ${hasChanges ? 'visible' : ''}`}>
        <div className="save-bar">
          <div className="save-bar-text">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Careful â€” you have unsaved changes!</span>
          </div>
          <div className="save-bar-actions">
            <button className="btn-revert" onClick={revertChanges}>Revert</button>
            <button className="btn-save" onClick={saveChanges}>Save Changes</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .automod-container { padding: 20px; display: flex; flex-direction: column; gap: 25px; padding-bottom: 100px; }
        .automod-header { display: flex; justify-content: space-between; align-items: center; gap: 18px; padding: 6px 2px 2px; }
        .header-info { min-width: 0; }
        .header-actions { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; justify-content: flex-end; }
        .preset-selector { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: var(--text-secondary); padding: 10px 14px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
        
        .automod-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        .mod-section { padding: 25px; }
        .mod-section.full-width { grid-column: 1 / -1; }
        .section-title { display: flex; align-items: center; gap: 12px; margin-bottom: 25px; }
        .section-title i { font-size: 1.2rem; color: var(--premium-pink); }
        .section-title h3 { font-family: var(--font-heading); font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; }
        .recommendation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .recommendation-card { padding: 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); }
        .recommendation-card strong { display: block; margin-bottom: 8px; }
        .recommendation-card p { color: var(--text-secondary); line-height: 1.5; font-size: 0.9rem; }
        .recommendation-card.info { border-color: rgba(59, 130, 246, 0.18); }
        .recommendation-card.warning { border-color: rgba(245, 158, 11, 0.22); }
        .recommendation-card.danger { border-color: rgba(239, 68, 68, 0.22); }

        .filter-list { display: flex; flex-direction: column; gap: 12px; }
        .filter-card { padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid transparent; transition: 0.3s; }
        .filter-card.active { border-color: rgba(255, 102, 178, 0.2); background: rgba(255, 102, 178, 0.03); }
        .filter-main { display: flex; align-items: center; gap: 15px; }
        .filter-main i { width: 20px; color: var(--text-secondary); }
        .filter-main span { flex: 1; font-weight: 500; }
        .filter-settings { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 15px; }
        .filter-settings input { width: 80px; }

        .ai-categories { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .ai-card { padding: 18px; border-radius: 14px; background: rgba(255,255,255,0.02); }
        .ai-card.active { border: 1px solid rgba(255, 102, 178, 0.2); }
        .ai-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .cat-name { font-weight: 600; font-size: 1rem; }
        .ai-levels { display: flex; gap: 8px; }
        .lvl-btn { flex: 1; padding: 6px; border-radius: 8px; border: 1px solid var(--panel-border); background: none; color: var(--text-secondary); cursor: pointer; transition: 0.3s; font-size: 0.85rem; }
        .lvl-btn.active { background: var(--premium-pink); color: #fff; border-color: var(--premium-pink); }

        .custom-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .rule-box { background: rgba(255,255,255,0.02); border-radius: 15px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .rule-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
        .input-group { display: flex; gap: 10px; }
        .input-group button { background: var(--premium-pink); border: none; color: #fff; width: 40px; border-radius: 10px; cursor: pointer; }
        .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { background: rgba(255, 102, 178, 0.15); color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .tag i { cursor: pointer; opacity: 0.6; transition: 0.3s; }
        .tag i:hover { opacity: 1; color: var(--danger); }

        .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .action-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .action-info { display: flex; align-items: center; gap: 15px; }
        .action-info i { color: var(--premium-pink); }
        .config-item { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .config-item label { font-size: 0.85rem; color: var(--text-secondary); }
        .simulator-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 22px; }
        .simulator-form { display: flex; flex-direction: column; gap: 14px; }
        .simulator-form label { font-size: 0.85rem; color: var(--text-secondary); }
        .simulator-form textarea { min-height: 150px; resize: vertical; background: rgba(0, 0, 0, 0.3); color: #fff; border: 1px solid var(--panel-border); border-radius: 12px; padding: 14px; font-family: var(--font-main); }
        .simulator-input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .simulator-result { border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 18px; display: flex; flex-direction: column; justify-content: center; gap: 14px; }
        .simulation-status { display: flex; align-items: center; gap: 10px; font-weight: 700; }
        .simulation-status.success { color: var(--success); }
        .simulation-status.danger { color: var(--danger); }
        .simulation-reason { color: var(--text-primary); line-height: 1.6; }
        .simulation-coverage { display: flex; flex-wrap: wrap; gap: 10px; color: var(--text-secondary); font-size: 0.82rem; }
        .simulation-coverage span { padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.04); }
        .simulation-placeholder { display: flex; flex-direction: column; gap: 10px; color: var(--text-secondary); align-items: flex-start; }
        .simulation-placeholder i { font-size: 1.6rem; color: var(--premium-pink); }

        
        .toggle-sm { position: relative; width: 42px; height: 22px; }
        .toggle-sm input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background: #333; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background: var(--premium-pink); }
        input:checked + .slider:before { transform: translateX(20px); }

        .main-toggle { position: relative; width: 60px; height: 30px; margin-left: 2px; }
        .main-toggle .slider:before { height: 22px; width: 22px; left: 4px; bottom: 4px; }
        .main-toggle input:checked + .slider:before { transform: translateX(30px); }

        @media (max-width: 1000px) {
          .automod-grid, .actions-grid, .custom-rules-grid, .simulator-grid, .simulator-input-row { grid-template-columns: 1fr; }
          .automod-header { align-items: flex-start; flex-direction: column; }
          .header-actions { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}

