import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const ACTION_COLORS = {
  WARN: { color: '#ffbb33', bg: 'rgba(255, 187, 51, 0.15)' },
  BAN: { color: '#ff4444', bg: 'rgba(255, 68, 68, 0.15)' },
  MUTE: { color: '#ff66b2', bg: 'rgba(255, 102, 178, 0.15)' },
  KICK: { color: '#ff8800', bg: 'rgba(255, 136, 0, 0.15)' },
  UNMUTE: { color: '#00C851', bg: 'rgba(0, 200, 81, 0.15)' },
  UNBAN: { color: '#33b5e5', bg: 'rgba(51, 181, 229, 0.15)' },
  PURGE: { color: '#aa66cc', bg: 'rgba(170, 102, 204, 0.15)' },
  MASSBAN: { color: '#cc0000', bg: 'rgba(204, 0, 0, 0.15)' }
};

export default function Overview({ selectedGuild }) {
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  const doughnutChartInstance = useRef(null);

  const [stats, setStats] = useState(null);
  const [guildInfo, setGuildInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (selectedGuild) fetchAllData();
  }, [selectedGuild]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('zenith_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, guildRes] = await Promise.all([
        fetch(`/api/moderation/${selectedGuild}/stats`, { headers }),
        fetch(`/api/overview/${selectedGuild}/guild-info`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (guildRes.ok) setGuildInfo(await guildRes.json());
    } catch (error) {
      console.error('[Overview Fetch Error]', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiAnalysis = async () => {
    if (!stats || !guildInfo) return;

    try {
      setAiLoading(true);
      setAiError(null);
      setAiAnalysis(null);

      const token = localStorage.getItem('zenith_token');
      const res = await fetch(`/api/overview/${selectedGuild}/ai-analysis`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stats, guildInfo })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis);
      } else {
        const err = await res.json();
        setAiError(err.error || 'AI analysis failed');
      }
    } catch (error) {
      setAiError('Failed to connect to AI service');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!lineChartRef.current || !stats?.dailyData) return;
    if (lineChartInstance.current) lineChartInstance.current.destroy();

    const labels = stats.dailyData.map((point) => {
      const date = new Date(`${point.date}T00:00:00`);
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    });

    lineChartInstance.current = new Chart(lineChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mod Events',
          data: stats.dailyData.map(point => point.count),
          borderColor: '#ff66b2',
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, 'rgba(255, 102, 178, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 102, 178, 0.0)');
            return gradient;
          },
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff66b2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10, 10, 12, 0.95)',
            titleColor: '#ff66b2',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 102, 178, 0.3)',
            borderWidth: 1,
            padding: 14,
            displayColors: false,
            cornerRadius: 10,
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => `${item.raw} moderation event${item.raw !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
            ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1 }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
    };
  }, [stats]);

  useEffect(() => {
    if (!doughnutChartRef.current || !stats?.actionBreakdown) return;
    if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();

    const actions = Object.keys(stats.actionBreakdown);
    if (!actions.length) return;

    doughnutChartInstance.current = new Chart(doughnutChartRef.current, {
      type: 'doughnut',
      data: {
        labels: actions,
        datasets: [{
          data: actions.map(action => stats.actionBreakdown[action]),
          backgroundColor: actions.map(action => ACTION_COLORS[action]?.color || '#64748b'),
          borderColor: 'rgba(10, 10, 12, 0.8)',
          borderWidth: 3,
          hoverBorderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { size: 12, family: 'Poppins' },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 10, 12, 0.95)',
            titleColor: '#ff66b2',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 102, 178, 0.3)',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 10,
            callbacks: {
              label: (item) => ` ${item.label}: ${item.raw} case${item.raw !== 1 ? 's' : ''}`
            }
          }
        }
      }
    });

    return () => {
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, [stats]);

  const formatUptime = (seconds) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#00C851';
    if (score >= 50) return '#ffbb33';
    return '#ff4444';
  };

  const renderAiText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (!line.trim()) return <br key={index} />;
      return <p key={index} className="ai-line" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="loading-spinner" />
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="overview-loading">
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#ffbb33', marginBottom: '12px' }} />
        <p>Unable to load server stats. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="ov-container">
      <div className="ov-stats-grid">
        {[
          ['fa-gavel', 'Total Cases', stats.totalCases, 'rgba(255, 102, 178, 0.12)', '#ff66b2'],
          ['fa-bolt', 'Active (24h)', stats.last24h, 'rgba(255, 187, 51, 0.12)', '#ffbb33'],
          ['fa-triangle-exclamation', 'Warnings', stats.totalWarnings, 'rgba(255, 136, 0, 0.12)', '#ff8800'],
          ['fa-heart-pulse', 'Health Score', `${stats.healthScore}%`, `${getHealthColor(stats.healthScore)}1a`, getHealthColor(stats.healthScore)],
          ['fa-users', 'Members', guildInfo?.memberCount ?? '-', 'rgba(51, 181, 229, 0.12)', '#33b5e5'],
          ['fa-hashtag', 'Channels', guildInfo?.channelCount ?? '-', 'rgba(170, 102, 204, 0.12)', '#aa66cc'],
          ['fa-layer-group', 'Protection Layers', stats.activeProtectionLayers ?? 0, 'rgba(16, 185, 129, 0.12)', '#10b981']
        ].map(([icon, label, value, background, color]) => (
          <div key={label} className="ov-stat-card glass-panel">
            <div className="ov-stat-icon" style={{ background, color }}>
              <i className={`fa-solid ${icon}`} />
            </div>
            <div className="ov-stat-info">
              <span className="ov-stat-label">{label}</span>
              <span className="ov-stat-value" style={label === 'Health Score' ? { color } : undefined}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ov-charts-row">
        <div className="ov-chart-card glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Moderation Activity</h3>
              <p className="ov-subtitle">Last 7 days trend</p>
            </div>
            <div className="ov-chart-badge">
              <i className="fa-solid fa-arrow-trend-up" />
              <span>7d</span>
            </div>
          </div>
          <div className="ov-chart-canvas-wrap">
            <canvas ref={lineChartRef} />
          </div>
        </div>

        <div className="ov-chart-card ov-chart-doughnut glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Action Breakdown</h3>
              <p className="ov-subtitle">Distribution by type</p>
            </div>
          </div>
          <div className="ov-doughnut-wrap">
            {Object.keys(stats.actionBreakdown || {}).length ? (
              <canvas ref={doughnutChartRef} />
            ) : (
              <div className="ov-no-data">
                <i className="fa-solid fa-chart-pie" />
                <p>No moderation data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ov-bottom-row">
        <div className="ov-activity-card glass-panel">
          <div className="ov-chart-header">
            <h3>Recent Actions</h3>
            <span className="ov-activity-count">{stats.recentActivity.length} latest</span>
          </div>
          <div className="ov-activity-list">
            {stats.recentActivity.length ? stats.recentActivity.map((entry) => (
              <div key={entry._id} className="ov-activity-item">
                <div
                  className="ov-activity-badge"
                  style={{
                    background: ACTION_COLORS[entry.action]?.bg || 'rgba(255,255,255,0.05)',
                    color: ACTION_COLORS[entry.action]?.color || '#94a3b8'
                  }}
                >
                  {entry.action === 'BAN' && <i className="fa-solid fa-hammer" />}
                  {entry.action === 'WARN' && <i className="fa-solid fa-triangle-exclamation" />}
                  {entry.action === 'MUTE' && <i className="fa-solid fa-volume-xmark" />}
                  {entry.action === 'KICK' && <i className="fa-solid fa-right-from-bracket" />}
                  {!['BAN', 'WARN', 'MUTE', 'KICK'].includes(entry.action) && <i className="fa-solid fa-shield" />}
                </div>
                <div className="ov-activity-info">
                  <div className="ov-activity-top">
                    <span className="ov-activity-action">{entry.action}</span>
                    <span className="ov-activity-target">{entry.targetTag}</span>
                  </div>
                  <span className="ov-activity-time">
                    {new Date(entry.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )) : (
              <div className="ov-no-data">
                <i className="fa-solid fa-check-circle" />
                <p>No recent moderation activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="ov-ai-card glass-panel">
          <div className="ov-ai-header">
            <div className="ov-ai-title-row">
              <div className="ov-ai-icon-wrap">
                <i className="fa-solid fa-wand-magic-sparkles" />
              </div>
              <div>
                <h3>AI Server Insights</h3>
                <p className="ov-subtitle">Powered by Groq AI</p>
              </div>
            </div>
            <button className="ov-ai-btn" onClick={fetchAiAnalysis} disabled={aiLoading}>
              {aiLoading ? (
                <>
                  <div className="ov-ai-btn-spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate" />
                  Refresh AI Stats
                </>
              )}
            </button>
          </div>

          <div className="ov-ai-body">
            {aiLoading && (
              <div className="ov-ai-loading">
                <div className="ov-ai-pulse" />
                <div className="ov-ai-pulse" style={{ animationDelay: '0.2s', width: '80%' }} />
                <div className="ov-ai-pulse" style={{ animationDelay: '0.4s', width: '60%' }} />
                <div className="ov-ai-pulse" style={{ animationDelay: '0.6s', width: '90%' }} />
              </div>
            )}
            {aiError && (
              <div className="ov-ai-error">
                <i className="fa-solid fa-circle-exclamation" />
                <span>{aiError}</span>
              </div>
            )}
            {aiAnalysis && !aiLoading && <div className="ov-ai-result">{renderAiText(aiAnalysis)}</div>}
            {!aiAnalysis && !aiLoading && !aiError && (
              <div className="ov-ai-placeholder">
                <i className="fa-solid fa-sparkles" />
                <p>Click <strong>Refresh AI Stats</strong> to generate an intelligent analysis of your server's health, trends, and recommendations.</p>
              </div>
            )}
          </div>

          {guildInfo && (
            <div className="ov-ai-footer">
              <div className="ov-ai-footer-item">
                <i className="fa-solid fa-clock" />
                <span>Uptime: {formatUptime(guildInfo.botUptime)}</span>
              </div>
              <div className="ov-ai-footer-item">
                <i className="fa-solid fa-crown" />
                <span>Boost Lvl {guildInfo.boostLevel} ({guildInfo.boostCount})</span>
              </div>
              <div className="ov-ai-footer-item">
                <i className="fa-solid fa-tags" />
                <span>{guildInfo.roleCount} Roles</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="ov-charts-row">
        <div className="ov-chart-card glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Most Targeted Users</h3>
              <p className="ov-subtitle">Case history trends across members</p>
            </div>
          </div>
          <div className="ov-activity-list">
            {stats.topTargets?.length ? stats.topTargets.map((target) => (
              <div key={target.userId} className="ov-activity-item">
                <div className="ov-activity-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                  <i className="fa-solid fa-user-shield" />
                </div>
                <div className="ov-activity-info">
                  <div className="ov-activity-top">
                    <span className="ov-activity-action">{target.targetTag}</span>
                  </div>
                  <span className="ov-activity-time">{target.count} logged case{target.count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )) : (
              <div className="ov-no-data">
                <i className="fa-solid fa-user-group" />
                <p>No target trends yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="ov-chart-card glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Moderator Activity</h3>
              <p className="ov-subtitle">Who is carrying the moderation workload</p>
            </div>
          </div>
          <div className="ov-activity-list">
            {stats.topModerators?.length ? stats.topModerators.map((moderator) => (
              <div key={moderator.moderatorId} className="ov-activity-item">
                <div className="ov-activity-badge" style={{ background: 'rgba(59, 130, 246, 0.14)', color: '#60a5fa' }}>
                  <i className="fa-solid fa-user-gear" />
                </div>
                <div className="ov-activity-info">
                  <div className="ov-activity-top">
                    <span className="ov-activity-action">{moderator.moderatorTag}</span>
                  </div>
                  <span className="ov-activity-time">{moderator.count} action{moderator.count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )) : (
              <div className="ov-no-data">
                <i className="fa-solid fa-user-check" />
                <p>No moderator activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats.configCoverage && (
        <div className="ov-chart-card glass-panel">
          <div className="ov-chart-header">
            <div>
              <h3>Protection Coverage</h3>
              <p className="ov-subtitle">How much of Zenith's moderation stack is currently configured</p>
            </div>
          </div>
          <div className="ov-ai-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <div className="ov-ai-footer-item">
              <i className="fa-solid fa-bolt" />
              <span>Static Filters: {stats.configCoverage.staticEnabled}/{stats.configCoverage.staticTotal}</span>
            </div>
            <div className="ov-ai-footer-item">
              <i className="fa-solid fa-brain" />
              <span>AI Filters: {stats.configCoverage.aiEnabled}/{stats.configCoverage.aiTotal}</span>
            </div>
            <div className="ov-ai-footer-item">
              <i className="fa-solid fa-ban" />
              <span>Blocked Words: {stats.configCoverage.wordsCount}</span>
            </div>
            <div className="ov-ai-footer-item">
              <i className="fa-solid fa-link" />
              <span>Trusted Domains: {stats.configCoverage.whitelistedDomains}</span>
            </div>
            <div className="ov-ai-footer-item">
              <i className="fa-solid fa-wand-sparkles" />
              <span>Auto Actions Enabled: {stats.configCoverage.automationsEnabled}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

