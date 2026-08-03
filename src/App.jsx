import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Star, Zap, ChevronRight, Search, Copy, Check } from 'lucide-react';
import './App.css';
import Landing from './Landing';
import RepoExplorer from './RepoExplorer';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const CALLBACK_URL = import.meta.env.VITE_GITHUB_CALLBACK_URL;

const ANALYSIS_STAGES = [
  { label: 'Repository Cloning', detail: 'Fetching the repository and commit history from GitHub' },
  { label: 'Commit History Extraction', detail: 'Walking every commit that touched this file' },
  { label: 'Function Reconstruction', detail: 'Extracting this function from each historical version' },
  { label: 'AI Change Classification', detail: 'Classifying what changed between versions, and why' },
  { label: 'Timeline Generation', detail: 'Building the evolution summary and analytics' },
  { label: 'Finalizing Results', detail: 'Assembling the results view' },
];
// Cumulative ms at which each stage becomes active — a believable estimate, not a
// real progress feed (the backend returns one response at the end, no streaming).
const STAGE_SCHEDULE_MS = [0, 1300, 2800, 4600, 7000, 8800];
const COLD_START_HINT_MS = 15000;

function LineageMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <circle cx="12" cy="6" r="2" />
      <path d="M6 16v-2a2 2 0 0 1 2-2h2" />
      <path d="M18 16v-2a2 2 0 0 0-2-2h-2" />
      <path d="M12 8v2" />
    </svg>
  );
}

function AppShell({ user, onLogout, children }) {
  return (
    <div className="app-container">
      <div className="reg-mark reg-mark--tl" aria-hidden="true" />
      <div className="reg-mark reg-mark--tr" aria-hidden="true" />
      <div className="reg-mark reg-mark--bl" aria-hidden="true" />
      <div className="reg-mark reg-mark--br" aria-hidden="true" />

      <header className="app-header">
        <div className="header-brand">
          <span className="header-brand-mark"><LineageMark /></span>
          <span className="header-brand-text">Code<br />Genealogist</span>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <img src={user?.avatar_url} alt={user?.login} className="avatar" />
            <span className="username">{user?.login}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}

function AuthenticatingScreen({ error, onRetry }) {
  return (
    <div className="auth-loading">
      <div className="reg-mark reg-mark--tl" aria-hidden="true" />
      <div className="reg-mark reg-mark--tr" aria-hidden="true" />
      <div className="reg-mark reg-mark--bl" aria-hidden="true" />
      <div className="reg-mark reg-mark--br" aria-hidden="true" />
      <div className="auth-loading-panel">
        <span className="auth-loading-mark"><LineageMark size={32} /></span>
        {error ? (
          <>
            <p className="auth-loading-title auth-loading-title--error">Authentication failed</p>
            <p className="auth-loading-sub">{error}</p>
            <button className="auth-retry-btn" onClick={onRetry}>Try again</button>
          </>
        ) : (
          <>
            <p className="auth-loading-title">Connecting to GitHub…</p>
            <p className="auth-loading-sub">This can take a few seconds on a cold start.</p>
            <div className="scanning-bar" aria-hidden="true"><span className="scanning-bar-fill" /></div>
          </>
        )}
      </div>
    </div>
  );
}

function AnalysisLoadingScreen({ stage, elapsedMs, repoName, functionName }) {
  const showColdStartHint = elapsedMs > COLD_START_HINT_MS && stage === ANALYSIS_STAGES.length - 1;

  return (
    <div className="loading-overlay">
      <div className="analysis-panel">
        <div className="analysis-panel-head">
          <span className="analysis-panel-label">ANALYSIS PIPELINE</span>
          <span className="analysis-panel-target">
            {repoName ? `${repoName} · ${functionName}` : functionName}
          </span>
        </div>

        <ul className="analysis-stage-list">
          {ANALYSIS_STAGES.map((s, i) => {
            const status = i < stage ? 'done' : i === stage ? 'active' : 'pending';
            return (
              <li key={s.label} className={`analysis-stage analysis-stage--${status}`}>
                <span className="analysis-stage-marker" aria-hidden="true">
                  {status === 'done' ? '✓' : status === 'active' ? '' : ''}
                </span>
                <span className="analysis-stage-body">
                  <span className="analysis-stage-label">{s.label}</span>
                  {status === 'active' && <span className="analysis-stage-detail">{s.detail}</span>}
                </span>
              </li>
            );
          })}
        </ul>

        {showColdStartHint && (
          <p className="analysis-cold-hint">
            Taking longer than usual — the analysis engine may be waking up from idle.
            This can take up to a minute on the first request.
          </p>
        )}
      </div>
    </div>
  );
}

// Standard LCS-based unified line diff — real diff, not a set-difference approximation.
function computeLineDiff(oldCode = '', newCode = '') {
  const a = oldCode.split('\n');
  const b = newCode.split('\n');
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'remove', text: a[i] });
      i++;
    } else {
      result.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < m) { result.push({ type: 'remove', text: a[i] }); i++; }
  while (j < n) { result.push({ type: 'add', text: b[j] }); j++; }
  return result;
}

function DiffView({ oldCode, oldLabel, newCode, newLabel }) {
  const diff = useMemo(() => computeLineDiff(oldCode, newCode), [oldCode, newCode]);
  const added = diff.filter((l) => l.type === 'add').length;
  const removed = diff.filter((l) => l.type === 'remove').length;

  return (
    <div className="diff-view">
      <div className="diff-view-head">
        <span className="diff-view-versions">
          <span className="diff-tag diff-tag--old">{oldLabel}</span>
          <ChevronRight size={13} />
          <span className="diff-tag diff-tag--new">{newLabel}</span>
        </span>
        <span className="diff-view-stats">
          {added > 0 && <span className="diff-stat diff-stat--add">+{added}</span>}
          {removed > 0 && <span className="diff-stat diff-stat--remove">-{removed}</span>}
          {added === 0 && removed === 0 && <span className="diff-stat">No line changes</span>}
        </span>
      </div>
      <pre className="diff-code">
        {diff.map((line, idx) => (
          <div key={idx} className={`diff-line diff-line--${line.type}`}>
            <span className="diff-marker">{line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ''}</span>
            <span className="diff-text">{line.text || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [filePath, setFilePath] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [genealogy, setGenealogy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const currentStageRef = useRef(0);
  const [error, setError] = useState('');
  const [activeVersion, setActiveVersion] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [step, setStep] = useState('repos');
  const [copiedCode, setCopiedCode] = useState(null);

  // HELPER FUNCTIONS
  const getMilestoneForVersion = (versionId) => {
    if (!genealogy?.analytics?.milestones) return null;
    return genealogy.analytics.milestones.find(m => m.version === versionId);
  };

  const getMilestoneIcon = (type) => {
    switch(type) {
      case 'Feature Addition': return '⭐';
      case 'Refactor': return '🔄';
      case 'Performance Optimization': return '⚡';
      default: return '•';
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 90) return '#5eead4';
    if (similarity >= 70) return '#e8a33d';
    return '#e2584f';
  };

  const getSimilarityLabel = (similarity) => {
    if (similarity >= 90) return 'Minor change';
    if (similarity >= 70) return 'Moderate change';
    return 'Major change';
  };

  const getChangeTypeColor = (type) => {
    switch(type) {
      case 'Feature Addition': return '#99f6e4';
      case 'Bug Fix': return '#e2584f';
      case 'Refactor': return '#e8a33d';
      case 'Performance Optimization': return '#5eead4';
      case 'Security Improvement': return '#d97757';
      default: return '#85a0a8';
    }
  };

  // AUTH FUNCTIONS
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setIsLoggedIn(true);
      fetchUser(token);
      fetchRepos(token);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setAuthenticating(true);
      exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredRepos(
        repos.filter(repo =>
          repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    } else {
      setFilteredRepos(repos);
    }
  }, [searchQuery, repos]);

  const exchangeCodeForToken = async (code) => {
    try {
      const response = await fetch('https://codegenealogist.onrender.com/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await response.json();
      if (!response.ok || !data.access_token) {
        throw new Error(data.detail || 'GitHub login failed. Please try again.');
      }
      localStorage.setItem('github_token', data.access_token);
      setIsLoggedIn(true);
      setAuthenticating(false);
      fetchUser(data.access_token);
      fetchRepos(data.access_token);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please try again.');
      setAuthenticating(false);
    }
  };

  const fetchUser = async (token) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` }
      });
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch user');
    }
  };

  const fetchRepos = async (token) => {
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: { Authorization: `token ${token}` }
      });
      if (!response.ok) {
        localStorage.removeItem('github_token');
        setIsLoggedIn(false);
        return;
      }
      const data = await response.json();
      setRepos(Array.isArray(data) ? data : []);
      setFilteredRepos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch repos');
      setRepos([]);
    }
  };

  const handleLogin = () => {
    if (authenticating) return;
    setAuthenticating(true);
    setAuthError('');
    const scope = 'repo';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=${scope}`;
    window.location.href = authUrl;
  };

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setRepoUrl(repo.clone_url);
    setStep('explore');
  };

  const handleFunctionSelected = ({ filePath: selectedFilePath, functionName: selectedFunctionName }) => {
    setFilePath(selectedFilePath);
    setFunctionName(selectedFunctionName);
    handleAnalyze(selectedFilePath, selectedFunctionName);
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    setIsLoggedIn(false);
    setUser(null);
    setRepos([]);
    setGenealogy(null);
    setStep('repos');
  };

  const handleAnalyze = async (overrideFilePath, overrideFunctionName) => {
    const targetFilePath = overrideFilePath ?? filePath;
    const targetFunctionName = overrideFunctionName ?? functionName;

    if (!repoUrl || !targetFilePath || !targetFunctionName) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    setOverlayVisible(true);
    setAnalysisStage(0);
    setAnalysisElapsed(0);
    currentStageRef.current = 0;
    const startedAt = Date.now();

    const stageTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setAnalysisElapsed(elapsed);
      let idx = 0;
      for (let i = STAGE_SCHEDULE_MS.length - 1; i >= 0; i--) {
        if (elapsed >= STAGE_SCHEDULE_MS[i]) { idx = i; break; }
      }
      currentStageRef.current = idx;
      setAnalysisStage(idx);
    }, 250);

    try {
      const response = await fetch('https://codegenealogist.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_url: repoUrl,
          file_path: targetFilePath,
          function_name: targetFunctionName
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Analysis failed');
      }
      const data = await response.json();
      setGenealogy(data);
      setActiveVersion(0);
      setShowComparison(false);
      setStep('results');
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(stageTimer);
      setLoading(false);

      // Real work just finished — cascade any un-shown stages to completion quickly
      // rather than either jump-cutting mid-stage or faking a slower finish.
      let idx = currentStageRef.current;
      const cascade = setInterval(() => {
        idx += 1;
        setAnalysisStage(Math.min(idx, ANALYSIS_STAGES.length));
        if (idx >= ANALYSIS_STAGES.length) {
          clearInterval(cascade);
          setTimeout(() => setOverlayVisible(false), 450);
        }
      }, 140);
    }
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isLoggedIn) {
    if (authenticating || authError) {
      return <AuthenticatingScreen error={authError} onRetry={handleLogin} />;
    }
    return <Landing onLogin={handleLogin} />;
  }

  // REPOS VIEW
  if (step === 'repos') {
    const languageCount = new Set(repos.map((r) => r.language).filter(Boolean)).size;

    return (
      <AppShell user={user} onLogout={handleLogout}>
        <div className="repos-page">
          <div className="page-label">
            <span className="page-label-no">INDEX</span>
            <span className="page-label-name">REPOSITORY REGISTRY</span>
            <span className="page-label-count">{repos.length || '—'} FOUND</span>
            <span className="page-label-rule" aria-hidden="true" />
          </div>

          <div className="repos-intro">
            <h1>Select a specimen to begin</h1>
            <p>Choose a repository — we'll trace every function's history from there.</p>
          </div>

          <div className="repos-toolbar">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            {repos.length > 0 && (
              <div className="repos-meta">
                <span>{repos.length} repositories</span>
                <span className="meta-dot" aria-hidden="true" />
                <span>{languageCount} languages</span>
              </div>
            )}
          </div>

          {filteredRepos.length === 0 ? (
            <div className="empty-state">
              <h3>{searchQuery ? 'No matches' : 'Loading repositories…'}</h3>
              <p>{searchQuery ? 'Try adjusting your search query.' : 'Fetching your GitHub repositories.'}</p>
            </div>
          ) : (
            <div className="repos-grid">
              {filteredRepos.map((repo, i) => (
                <button
                  key={repo.id}
                  className="repo-card"
                  onClick={() => handleSelectRepo(repo)}
                >
                  <span className="repo-card-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="repo-card-bracket repo-card-bracket--tl" />
                  <span className="repo-card-bracket repo-card-bracket--br" />
                  <div className="repo-card-body">
                    <h3>{repo.name}</h3>
                    <p>{repo.description || 'No description provided'}</p>
                  </div>
                  <div className="repo-card-footer">
                    <span className="repo-language">{repo.language || 'Unknown'}</span>
                    <span className="repo-stars"><Star size={12} /> {repo.stargazers_count}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  // EXPLORE VIEW
  if (step === 'explore') {
    return (
      <AppShell user={user} onLogout={handleLogout}>
        <button className="back-link" onClick={() => setStep('repos')} style={{margin: '24px 0 0 40px'}}>
          <ChevronRight size={18} style={{transform: 'rotate(180deg)'}} />
          Back to Repositories
        </button>

        {error && (
          <div className="error-message" style={{margin: '16px 40px 0 40px'}}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <RepoExplorer
          repo={selectedRepo}
          token={localStorage.getItem('github_token')}
          onFunctionSelected={handleFunctionSelected}
        />

        {overlayVisible && (
          <AnalysisLoadingScreen
            stage={analysisStage}
            elapsedMs={analysisElapsed}
            repoName={selectedRepo?.name}
            functionName={functionName}
          />
        )}
      </AppShell>
    );
  }

  // RESULTS VIEW
  const currentVersion = genealogy?.versions[activeVersion];
  const nextVersion = activeVersion < genealogy?.versions.length - 1 ? genealogy.versions[activeVersion + 1] : null;
  const changeInfo = genealogy?.changes[activeVersion];

  return (
    <AppShell user={user} onLogout={handleLogout}>
        <div className="results-page">
          <div className="results-trail">
            <button className="back-link results-back" onClick={() => setStep('repos')}>
              <ChevronRight size={16} style={{transform: 'rotate(180deg)'}} />
              Repositories
            </button>
            <span className="trail-arrow" aria-hidden="true">/</span>
            <span className="trail-segment">
              <span className="trail-label">REPO</span>
              <span className="trail-value">{selectedRepo?.name}</span>
            </span>
            <ChevronRight size={13} className="trail-arrow" aria-hidden="true" />
            <span className="trail-segment">
              <span className="trail-label">FUNCTION</span>
              <span className="trail-value">{genealogy?.function || functionName}</span>
            </span>
            <span className="trail-rule" aria-hidden="true" />
          </div>

          <div className="results-hero">
            <h1>{genealogy?.function || functionName}<span className="results-hero-paren">()</span></h1>
            {genealogy?.evolution_summary && (
              <p className="results-summary">{genealogy.evolution_summary}</p>
            )}
            {genealogy?.analytics && (
              <div className="results-stat-strip">
                <span><strong>{genealogy.analytics.total_versions}</strong> versions</span>
                <span className="meta-dot" aria-hidden="true" />
                <span><strong>{genealogy.analytics.total_changes}</strong> changes</span>
                <span className="meta-dot" aria-hidden="true" />
                <span><strong>{(genealogy.analytics.avg_confidence * 100).toFixed(0)}%</strong> avg confidence</span>
                {genealogy.analytics.milestones?.length > 0 && (
                  <>
                    <span className="meta-dot" aria-hidden="true" />
                    <span><strong>{genealogy.analytics.milestones.length}</strong> milestones</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="results-body">
            {/* CORE SAMPLE TIMELINE */}
            <aside className="core-timeline">
              <div className="core-timeline-head">
                <span>CORE SAMPLE</span>
                <span className="core-timeline-count">{genealogy?.versions.length} LAYERS</span>
              </div>
              <div className="core-timeline-list">
                {genealogy?.versions.map((v, i) => {
                  const milestone = getMilestoneForVersion(i);
                  const incomingChange = i > 0 ? genealogy.changes[i - 1] : null;
                  const isActive = activeVersion === i;
                  const dotColor = incomingChange ? getChangeTypeColor(incomingChange.type) : 'var(--bp-cyan)';

                  return (
                    <button
                      key={i}
                      className={`core-stratum ${isActive ? 'is-active' : ''}`}
                      onClick={() => { setActiveVersion(i); setShowComparison(false); }}
                    >
                      <span className="core-stratum-rail">
                        <span className="core-stratum-dot" style={{ background: dotColor }} />
                        {i < genealogy.versions.length - 1 && <span className="core-stratum-line" />}
                      </span>
                      <span className="core-stratum-content">
                        <span className="core-stratum-top">
                          <span className="core-stratum-version">v{i}</span>
                          {milestone && (
                            <span className="core-stratum-flag" title={`${milestone.type} — ${(milestone.confidence * 100).toFixed(0)}% confident`}>
                              {getMilestoneIcon(milestone.type)}
                            </span>
                          )}
                          {incomingChange && (
                            <span className="core-stratum-type" style={{ color: dotColor }}>
                              {incomingChange.type}
                            </span>
                          )}
                        </span>
                        <span className="core-stratum-message">{v.message}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="results-main">
              <div className="version-strip">
                <div className="version-strip-main">
                  <span className="version-strip-tag">v{activeVersion}</span>
                  <span className="version-strip-message">{currentVersion?.message}</span>
                  <button
                    className="version-strip-copy"
                    onClick={() => copyToClipboard(currentVersion?.code, 'current')}
                    title="Copy code"
                  >
                    {copiedCode === 'current' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="version-strip-meta">
                  <span>{currentVersion?.author}</span>
                  <span className="meta-dot" aria-hidden="true" />
                  <span>{new Date(currentVersion?.date).toLocaleDateString()}</span>
                  <span className="meta-dot" aria-hidden="true" />
                  <span className="version-strip-hash">{currentVersion?.hash}</span>
                </div>
              </div>

              {changeInfo ? (
                <>
                  <div className="diff-toolbar">
                    <div className="diff-toolbar-info">
                      {changeInfo.type && (
                        <span
                          className="diff-type-badge"
                          style={{ color: getChangeTypeColor(changeInfo.type), borderColor: getChangeTypeColor(changeInfo.type) }}
                        >
                          {changeInfo.type}
                        </span>
                      )}
                      <span className="diff-similarity" style={{ color: getSimilarityColor(changeInfo.similarity) }}>
                        {changeInfo.similarity.toFixed(0)}% similar · {getSimilarityLabel(changeInfo.similarity)}
                      </span>
                    </div>
                    <button className="view-toggle" onClick={() => setShowComparison(!showComparison)}>
                      {showComparison ? 'Unified diff' : 'Side-by-side'}
                    </button>
                  </div>

                  {showComparison ? (
                    <div className="comparison-grid">
                      <div className="comparison-col">
                        <h4>v{activeVersion}</h4>
                        <div className="code-viewer">
                          <pre><code>{currentVersion?.code}</code></pre>
                        </div>
                      </div>
                      <div className="comparison-col">
                        <h4>v{activeVersion + 1}</h4>
                        <div className="code-viewer">
                          <pre><code>{nextVersion?.code}</code></pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <DiffView
                      oldCode={currentVersion?.code || ''}
                      oldLabel={`v${activeVersion}`}
                      newCode={nextVersion?.code || ''}
                      newLabel={`v${activeVersion + 1}`}
                    />
                  )}

                  {changeInfo.explanation && (
                    <div className="insight-panel">
                      <div className="insight-head">
                        <Zap size={15} />
                        <span>AI ANALYSIS</span>
                        {changeInfo.explanation.confidence && (
                          <span className="insight-confidence">
                            {(changeInfo.explanation.confidence * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>

                      {changeInfo.explanation.what_changed && (
                        <div className="insight-row">
                          <span className="insight-label">WHAT</span>
                          <p>{changeInfo.explanation.what_changed}</p>
                        </div>
                      )}

                      {changeInfo.explanation.why_changed && (
                        <div className="insight-row">
                          <span className="insight-label">WHY</span>
                          <p>{changeInfo.explanation.why_changed}</p>
                        </div>
                      )}

                      {changeInfo.explanation.impact && (
                        <div className="insight-row">
                          <span className="insight-label">IMPACT</span>
                          <p>{changeInfo.explanation.impact}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="code-viewer code-viewer--standalone">
                    <pre><code>{currentVersion?.code}</code></pre>
                  </div>
                  <p className="results-current-note">This is the current version — no further changes recorded.</p>
                </>
              )}
            </div>
          </div>
        </div>

      {overlayVisible && (
        <AnalysisLoadingScreen
          stage={analysisStage}
          elapsedMs={analysisElapsed}
          repoName={selectedRepo?.name}
          functionName={functionName}
        />
      )}
    </AppShell>
  );
}