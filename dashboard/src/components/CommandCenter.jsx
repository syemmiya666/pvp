import React, { useEffect, useMemo, useState } from 'react';
import commandCatalog from '../data/commandCatalog';

const fallbackMeta = {
  total: commandCatalog.length,
  slashCount: commandCatalog.filter(command => command.slash).length,
  categories: commandCatalog.reduce((acc, command) => {
    acc[command.category] = (acc[command.category] || 0) + 1;
    return acc;
  }, {}),
  commands: commandCatalog
};

export default function CommandCenter() {
  const [meta, setMeta] = useState(fallbackMeta);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('zenith_token');
        const res = await fetch('/api/meta/commands', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setMeta(data);
          setUsingFallback(false);
        } else {
          setMeta(fallbackMeta);
          setUsingFallback(true);
        }
      } catch (error) {
        console.error('[Command Center]', error);
        setMeta(fallbackMeta);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  const categories = useMemo(() => {
    if (!meta?.categories) return ['All'];
    return ['All', ...Object.keys(meta.categories).sort((a, b) => a.localeCompare(b))];
  }, [meta]);

  const filteredCommands = useMemo(() => {
    if (!meta?.commands) return [];

    return meta.commands.filter(command => {
      const haystack = [
        command.name,
        command.description,
        command.category,
        ...(command.aliases || [])
      ].join(' ').toLowerCase();

      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || command.category === categoryFilter;
      const matchesMode =
        modeFilter === 'All' ||
        (modeFilter === 'Slash + Prefix' && command.slash) ||
        (modeFilter === 'Prefix Only' && !command.slash);

      return matchesQuery && matchesCategory && matchesMode;
    });
  }, [meta, query, categoryFilter, modeFilter]);

  if (loading) return <div className="loader">Loading Command Center...</div>;
  if (!meta) return <div className="loader">Unable to load command metadata.</div>;

  return (
    <div className="command-center animate-fade-in">
      <div className="command-hero glass-panel">
        <div>
          <p className="command-eyebrow">Open Source Ready</p>
          <h2 className="glow-text">Command Center</h2>
          <p className="subtitle">A searchable command catalog for admins, contributors, and anyone onboarding into the project.</p>
          {usingFallback && (
            <p className="command-fallback-note">Showing the bundled command catalog while live metadata is unavailable.</p>
          )}
        </div>
        <div className="command-hero-stats">
          <div className="command-stat-chip">
            <strong>{meta.total}</strong>
            <span>Total Commands</span>
          </div>
          <div className="command-stat-chip">
            <strong>{meta.slashCount}</strong>
            <span>Slash Ready</span>
          </div>
          <div className="command-stat-chip">
            <strong>{Object.keys(meta.categories || {}).length}</strong>
            <span>Categories</span>
          </div>
        </div>
      </div>

      <div className="command-toolbar glass-panel">
        <div className="command-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands, aliases, or descriptions..."
          />
        </div>

        <div className="command-filters">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
            <option value="All">All Modes</option>
            <option value="Slash + Prefix">Slash + Prefix</option>
            <option value="Prefix Only">Prefix Only</option>
          </select>
        </div>
      </div>

      <div className="command-grid">
        {filteredCommands.map(command => (
          <div key={command.name} className="glass-panel command-card">
            <div className="command-card-top">
              <div>
                <div className="command-card-name-row">
                  <h3>/{command.name}</h3>
                  {!command.slash && <span className="command-badge subtle">Prefix</span>}
                  {command.slash && <span className="command-badge">Hybrid</span>}
                </div>
                <p className="command-category">{command.category}</p>
              </div>
              <div className="command-cooldown">{command.cooldown || 0}s</div>
            </div>

            <p className="command-description">{command.description}</p>

            <div className="command-meta-list">
              <div>
                <span className="command-meta-label">Aliases</span>
                <span className="command-meta-value">{command.aliases?.length ? command.aliases.join(', ') : 'None'}</span>
              </div>
              <div>
                <span className="command-meta-label">Access</span>
                <span className="command-meta-value">{command.ownerOnly ? 'Owner Only' : 'Server/Admin Safe'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!filteredCommands.length && (
        <div className="glass-panel command-empty">
          <i className="fa-solid fa-box-open" />
          <p>No commands matched your filters.</p>
        </div>
      )}
    </div>
  );
}

