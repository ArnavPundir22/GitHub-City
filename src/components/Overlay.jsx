import React, { useState } from 'react';
import { Search, Users, GitCommit, Star, GitFork, Code, MapPin, ArrowRight } from 'lucide-react';
import { getLangColor, LANGUAGE_COLORS } from '../utils/github';

// ── Mini 52-week commit sparkline ─────────────────────────────────────────────
function CommitSparkline({ weeklyCommits, peak }) {
  const w = 80, h = 20;
  const barW = w / weeklyCommits.length;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {weeklyCommits.map((c, i) => {
        const ratio = peak > 0 ? c / peak : 0;
        const barH  = Math.max(ratio * h, c > 0 ? 2 : 0);
        const color = c === 0 ? '#1a2030'
          : ratio < 0.3 ? '#ffd27f'
          : ratio < 0.6 ? '#ffb347'
          : ratio < 0.9 ? '#fff176'
          : '#ffffff';
        return (
          <rect
            key={i}
            x={i * barW}
            y={h - barH}
            width={Math.max(barW - 0.5, 1)}
            height={barH}
            fill={color}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

// ── Repo card in the sidebar ──────────────────────────────────────────────────
function RepoCard({ repo, isHovered, onMouseEnter, onMouseLeave }) {
  const langColor = getLangColor(repo.language);
  return (
    <div
      className={`repo-card ${isHovered ? 'repo-card--hovered' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ '--lang-color': langColor }}
    >
      <div className="repo-card-top">
        <span className="repo-card-name">{repo.name}</span>
        {repo.language && (
          <span className="repo-lang-badge" style={{ background: langColor + '22', color: langColor, border: `1px solid ${langColor}44` }}>
            {repo.language}
          </span>
        )}
      </div>
      {repo.description && (
        <p className="repo-desc">{repo.description.slice(0, 70)}{repo.description.length > 70 ? '…' : ''}</p>
      )}
      <div className="repo-card-stats">
        <span className="repo-stat"><Star size={10} />{repo.stars}</span>
        <span className="repo-stat"><GitFork size={10} />{repo.forks}</span>
        <span className="repo-stat commit-stat"><GitCommit size={10} />{repo.totalCommits}w</span>
      </div>
      <CommitSparkline weeklyCommits={repo.weeklyCommits} peak={repo.peakWeek} />
    </div>
  );
}

// ── Main Overlay ──────────────────────────────────────────────────────────────
export default function Overlay({ cityData, isLoading, onSearch, hoveredRepo, onHoverRepo }) {
  const [input, setInput] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSearch(input.trim());
      setInput('');
      setIsMobileDrawerOpen(false);
    }
  };

  const user = cityData?.user;
  const repos = cityData?.repos || [];

  return (
    <div id="ui-layer">

      {/* ── Search bar (top-center) ── */}
      <div className="search-bar glass-panel fade-in">
        <div className="search-bar-title">
          <span className="city-icon">🏙️</span>
          <h1>GitHub City</h1>
        </div>
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="glass-input"
            placeholder="Enter GitHub username…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="glass-button" disabled={isLoading || !input.trim()}>
            {isLoading
              ? <><div className="loading-spinner" /><span>Loading…</span></>
              : <><Search size={16} /><span>Explore City</span></>
            }
          </button>
        </form>
        {!cityData && !isLoading && (
          <p className="search-hint">Each building = one repo · Height = popularity · Windows = commits</p>
        )}
      </div>

      {/* ── Mobile drawer toggle ── */}
      {cityData && (
        <button 
          className="mobile-drawer-toggle fade-in" 
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        >
          {isMobileDrawerOpen ? '↓ Hide Profile & Repos' : '↑ View Profile & Repos'}
        </button>
      )}

      {/* ── Left panel: User profile + repo list ── */}
      {cityData && (
        <div className={`side-panel glass-panel fade-in ${isMobileDrawerOpen ? 'is-open' : ''}`}>

          {/* Profile */}
          <div className="profile-section">
            <img src={user.avatar_url} alt={user.login} className="profile-avatar" />
            <div className="profile-info">
              <span className="profile-name">{user.name}</span>
              <span className="profile-login">@{user.login}</span>
              {user.bio && <p className="profile-bio">{user.bio.slice(0, 80)}{user.bio.length > 80 ? '…' : ''}</p>}
              {user.location && (
                <span className="profile-location"><MapPin size={11} />{user.location}</span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="profile-stats">
            <div className="pstat">
              <span className="pstat-val">{user.public_repos}</span>
              <span className="pstat-lbl">Repos</span>
            </div>
            <div className="pstat">
              <span className="pstat-val">{user.followers}</span>
              <span className="pstat-lbl">Followers</span>
            </div>
            <div className="pstat">
              <span className="pstat-val">{repos.reduce((s, r) => s + r.totalCommits, 0)}</span>
              <span className="pstat-lbl">Commits</span>
            </div>
          </div>

          {/* Legend */}
          <div className="win-legend">
            <span className="legend-title">Window = Commits</span>
            <div className="legend-row">
              {[
                { color: '#050810', label: 'None' },
                { color: '#ffd27f', label: 'Low',  glow: '#ffd27f' },
                { color: '#ffb347', label: 'Mid',  glow: '#ffb347' },
                { color: '#fff176', label: 'High', glow: '#fff176' },
                { color: '#ffffff', label: 'Peak', glow: '#ffffff' },
              ].map(({ color, label, glow }) => (
                <div key={label} className="legend-item">
                  <div className="legend-dot" style={{
                    background: color,
                    boxShadow: glow ? `0 0 5px ${glow}88` : 'none',
                  }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="section-divider" />

          {/* Repo list */}
          <div className="repo-list-header">
            <Code size={14} />
            <span>{repos.length} Repositories</span>
          </div>
          <div className="repo-list">
            {repos.map((repo) => (
              <RepoCard
                key={repo.name}
                repo={repo}
                isHovered={hoveredRepo === repo.name}
                onMouseEnter={() => onHoverRepo(repo.name)}
                onMouseLeave={() => onHoverRepo(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Hovered repo tooltip ── */}
      {hoveredRepo && cityData && (() => {
        const r = repos.find((x) => x.name === hoveredRepo);
        if (!r) return null;
        const lc = getLangColor(r.language);
        return (
          <div className="building-tooltip glass-panel fade-in" style={{ '--lang-color': lc }}>
            <div className="tooltip-header">
              <span className="tooltip-name">{r.name}</span>
              {r.language && <span className="tooltip-lang" style={{ color: lc }}>{r.language}</span>}
            </div>
            {r.description && <p className="tooltip-desc">{r.description}</p>}
            <div className="tooltip-stats">
              <span><Star size={12} /> {r.stars} stars</span>
              <span><GitFork size={12} /> {r.forks} forks</span>
              <span><GitCommit size={12} /> {r.totalCommits} commits (52w)</span>
            </div>
            <CommitSparkline weeklyCommits={r.weeklyCommits} peak={r.peakWeek} />
          </div>
        );
      })()}
    </div>
  );
}
