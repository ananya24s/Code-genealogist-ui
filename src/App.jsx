import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, Zap, Eye, RefreshCw, Boxes, ChevronRight, Search, Copy, Check } from 'lucide-react';
import logoHorizontal from './assets/logo-horizontal.jpeg';
import logoIcon from './assets/logo-icon.jpeg';
import './App.css';
import Landing from './Landing';
import RepoExplorer from './RepoExplorer';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const CALLBACK_URL = import.meta.env.VITE_GITHUB_CALLBACK_URL;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    if (similarity >= 90) return '#10b981';
    if (similarity >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getSimilarityLabel = (similarity) => {
    if (similarity >= 90) return 'Minor change';
    if (similarity >= 70) return 'Moderate change';
    return 'Major change';
  };

  const getChangeTypeColor = (type) => {
    switch(type) {
      case 'Feature Addition': return '#10b981';
      case 'Bug Fix': return '#ef4444';
      case 'Refactor': return '#f59e0b';
      case 'Performance Optimization': return '#6366f1';
      case 'Security Improvement': return '#ec4899';
      default: return '#80858b';
    }
  };

  // AUTH FUNCTIONS
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setIsLoggedIn(true);
      fetchUser(token);
      fetchRepos(token);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !localStorage.getItem('github_token')) {
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
      localStorage.setItem('github_token', data.access_token);
      setIsLoggedIn(true);
      fetchUser(data.access_token);
      fetchRepos(data.access_token);
    } catch (err) {
      setError('Login failed');
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
      setStep('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isLoggedIn) {
    return <Landing onLogin={handleLogin} />;
  }

  // REPOS VIEW
  if (step === 'repos') {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <img src={logoHorizontal} alt="Code Genealogist" className="app-logo" />
          </div>
          <div className="header-right">
            <div className="user-profile">
              <img src={user?.avatar_url} alt={user?.login} className="avatar" />
              <span className="username">{user?.login}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="app-main">
          <div className="repos-container">
            <div className="repos-header">
              <h1>Repositories</h1>
              <p className="repos-subtitle">Select a repository to start analyzing functions</p>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {filteredRepos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No repositories found</h3>
                <p>{searchQuery ? 'Try adjusting your search' : 'Loading repositories...'}</p>
              </div>
            ) : (
              <div className="repos-grid">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    className="repo-card"
                    onClick={() => handleSelectRepo(repo)}
                  >
                    <div className="repo-card-header">
                      <GitBranch size={18} className="repo-icon" />
                      <h3>{repo.name}</h3>
                    </div>
                    <p className="repo-description">
                      {repo.description || 'No description provided'}
                    </p>
                    <div className="repo-footer">
                      <span className="repo-language">{repo.language || 'Unknown'}</span>
                      <span className="repo-stars">⭐ {repo.stargazers_count}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // EXPLORE VIEW
  if (step === 'explore') {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <img src={logoHorizontal} alt="Code Genealogist" className="app-logo" />
          </div>
          <div className="header-right">
            <div className="user-profile">
              <img src={user?.avatar_url} alt={user?.login} className="avatar" />
              <span className="username">{user?.login}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="app-main">
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
        </main>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <img src={logoIcon} alt="Loading" className="loading-icon" />
              <div className="loading-text">
                <p>Analyzing repository...</p>
                <p className="loading-subtext">Classifying changes & generating insights...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RESULTS VIEW
  const currentVersion = genealogy?.versions[activeVersion];
  const nextVersion = activeVersion < genealogy?.versions.length - 1 ? genealogy.versions[activeVersion + 1] : null;
  const changeInfo = genealogy?.changes[activeVersion];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <img src={logoHorizontal} alt="Code Genealogist" className="app-logo" />
        </div>
        <div className="header-right">
          <div className="user-profile">
            <img src={user?.avatar_url} alt={user?.login} className="avatar" />
            <span className="username">{user?.login}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="app-main">
        <div className="results-container">
          <div className="results-header">
            <button className="back-link" onClick={() => setStep('repos')}>
              <ChevronRight size={18} style={{transform: 'rotate(180deg)'}} />
              Back to Repositories
            </button>
            <div>
              <h1>{currentVersion?.name || functionName}</h1>
              <p className="results-subtitle">{selectedRepo?.name}</p>
            </div>
          </div>

          {genealogy?.evolution_summary && (
            <div className="evolution-card">
              <h3>Evolution Summary</h3>
              <p>{genealogy.evolution_summary}</p>
            </div>
          )}

          {genealogy?.analytics && (
            <div className="analytics-card">
              <h3>Repository Analytics</h3>
              <div className="analytics-grid">
                <div className="stat">
                  <span className="stat-value">{genealogy.analytics.total_versions}</span>
                  <span className="stat-label">Total Versions</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{genealogy.analytics.type_breakdown['Feature Addition'] || 0}</span>
                  <span className="stat-label">Features</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{genealogy.analytics.type_breakdown['Bug Fix'] || 0}</span>
                  <span className="stat-label">Bug Fixes</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{genealogy.analytics.type_breakdown['Refactor'] || 0}</span>
                  <span className="stat-label">Refactors</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{genealogy.analytics.type_breakdown['Performance Optimization'] || 0}</span>
                  <span className="stat-label">Optimizations</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{(genealogy.analytics.avg_confidence * 100).toFixed(0)}%</span>
                  <span className="stat-label">Avg Confidence</span>
                </div>
              </div>
            </div>
          )}

          <div className="results-grid">
            {/* TIMELINE SIDEBAR WITH MILESTONES */}
            <aside className="timeline-sidebar">
              <h3>Function History</h3>
              <div className="versions-list">
                {genealogy?.versions.map((v, i) => {
                  const milestone = getMilestoneForVersion(i);
                  const isMilestone = !!milestone;
                  
                  return (
                    <div 
                      key={i} 
                      className={`version-group ${isMilestone ? 'is-milestone' : ''}`}
                    >
                      <button
                        className={`version-btn ${activeVersion === i ? 'active' : ''} ${isMilestone ? 'milestone-btn' : ''}`}
                        onClick={() => setActiveVersion(i)}
                        title={isMilestone ? `${milestone.type} (${(milestone.confidence * 100).toFixed(0)}% confident)` : ''}
                      >
                        <span className="version-label">v{i}</span>
                        
                        {isMilestone && (
                          <span className="milestone-icon" title={milestone.type}>
                            {getMilestoneIcon(milestone.type)}
                          </span>
                        )}
                        
                        {i < genealogy.changes.length && genealogy.changes[i]?.type && (
                          <span 
                            className="type-badge"
                            style={{backgroundColor: getChangeTypeColor(genealogy.changes[i].type)}}
                            title={genealogy.changes[i].type}
                          >
                            {genealogy.changes[i].type.substring(0, 3)}
                          </span>
                        )}
                      </button>
                      
                      {i < genealogy.changes.length && (
                        <div
                          className="change-badge"
                          style={{backgroundColor: getSimilarityColor(genealogy.changes[i].similarity)}}
                          title={getSimilarityLabel(genealogy.changes[i].similarity)}
                        >
                          {genealogy.changes[i].similarity.toFixed(0)}%
                        </div>
                      )}
                      
                      {isMilestone && (
                        <div className="milestone-badge" title={milestone.message}>
                          <span className="milestone-type">{milestone.type}</span>
                          <span className="milestone-confidence">{(milestone.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* MAIN RESULTS CONTENT */}
            <div className="results-main">
              <div className="version-card">
                <div className="version-card-header">
                  <div>
                    <h2>Version {activeVersion}</h2>
                    <div className="version-meta">
                      <span className="meta-item">
                        <strong>Author:</strong> {currentVersion?.author}
                      </span>
                      <span className="meta-item">
                        <strong>Date:</strong> {new Date(currentVersion?.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="commit-message">
                  {currentVersion?.message}
                </div>
              </div>

              <div className="code-card">
                <div className="code-header">
                  <h3>Code</h3>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(currentVersion?.code, 'current')}
                  >
                    {copiedCode === 'current' ? (
                      <>
                        <Check size={16} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="code-viewer">
                  <pre><code>{currentVersion?.code}</code></pre>
                </div>
              </div>

              {changeInfo && (
                <div className="change-card">
                  <div className="change-header">
                    <div>
                      <h3>Evolution to Next Version</h3>
                      {changeInfo.type && (
                        <span className="change-type" style={{color: getChangeTypeColor(changeInfo.type)}}>
                          {changeInfo.type}
                        </span>
                      )}
                    </div>
                    <div
                      className="change-indicator"
                      style={{backgroundColor: getSimilarityColor(changeInfo.similarity)}}
                    >
                      <span className="change-percent">{changeInfo.similarity.toFixed(0)}%</span>
                      <span className="change-label">{getSimilarityLabel(changeInfo.similarity)}</span>
                    </div>
                  </div>

                  {changeInfo?.explanation && (
                    <div className="ai-card">
                      <div className="ai-header">
                        <Zap size={18} />
                        <span>AI Analysis</span>
                        {changeInfo.explanation.confidence && (
                          <span className="confidence-indicator">
                            {(changeInfo.explanation.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      
                      {changeInfo.explanation.what_changed && (
                        <div className="ai-section">
                          <h4>What Changed</h4>
                          <p>{changeInfo.explanation.what_changed}</p>
                        </div>
                      )}
                      
                      {changeInfo.explanation.why_changed && (
                        <div className="ai-section">
                          <h4>Why It Changed</h4>
                          <p>{changeInfo.explanation.why_changed}</p>
                        </div>
                      )}
                      
                      {changeInfo.explanation.impact && (
                        <div className="ai-section">
                          <h4>Impact</h4>
                          <p>{changeInfo.explanation.impact}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {nextVersion && (
                    <div className="next-version-card">
                      <h4>Next Version Preview</h4>
                      <p className="next-message">{nextVersion.message}</p>
                      <p className="next-author">by {nextVersion.author}</p>
                    </div>
                  )}

                  <button
                    className="comparison-toggle"
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    {showComparison ? 'Hide Comparison' : 'View Side-by-Side Comparison'}
                    <ChevronRight size={16} style={{transform: showComparison ? 'rotate(90deg)' : 'rotate(0deg)'}} />
                  </button>

                  {showComparison && nextVersion && (
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
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <img src={logoIcon} alt="Loading" className="loading-icon" />
            <div className="loading-text">
              <p>Analyzing repository...</p>
              <p className="loading-subtext">Classifying changes & generating insights...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}