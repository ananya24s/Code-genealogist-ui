import React from 'react';
import { GitBranch, Clock, Zap, Eye, RefreshCw, Boxes } from 'lucide-react';
import './Landing_PROFESSIONAL.css';

export default function Landing({ onLogin }) {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📜</span>
            <span className="logo-text">Code Genealogist</span>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Viewport Height */}
      <section className="landing-hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-headline">
              Understand why<br />your code evolved
            </h1>
            
            <p className="hero-description">
              Trace every decision behind your functions. See the full story of how code changed across commits with AI-powered insights.
            </p>

            <div className="cta-section">
              <button className="cta-button primary" onClick={onLogin}>
                Start Analyzing
              </button>
              <span className="cta-subtext">Works with any GitHub repository</span>
            </div>
          </div>

          {/* Demo Card - Compact, Focused */}
          <div className="demo-card">
            <div className="demo-label">Real example</div>
            <div className="demo-function">calculateUserScore()</div>
            
            <div className="demo-timeline">
              <div className="timeline-item">
                <div className="timeline-marker created"></div>
                <div>Created</div>
              </div>
              <div className="timeline-connector"></div>
              <div className="timeline-item">
                <div className="timeline-marker fixed"></div>
                <div>Bug Fix</div>
              </div>
              <div className="timeline-connector"></div>
              <div className="timeline-item">
                <div className="timeline-marker refactor"></div>
                <div>Refactor</div>
              </div>
              <div className="timeline-connector"></div>
              <div className="timeline-item">
                <div className="timeline-marker current"></div>
                <div>Current</div>
              </div>
            </div>

            <div className="demo-insight">
              <div className="insight-header">
                <span>AI Insight</span>
                <span className="confidence-badge">95%</span>
              </div>
              <p>Refactored for performance. Reduced overhead by 85% through caching logic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <h2>Powerful analysis built in</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <GitBranch size={24} />
            </div>
            <h3>Git History</h3>
            <p>Traverse every commit that touched your function</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Clock size={24} />
            </div>
            <h3>Evolution Timeline</h3>
            <p>Visual history of how code changed over time</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={24} />
            </div>
            <h3>AI Insights</h3>
            <p>Understand why changes were made</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <RefreshCw size={24} />
            </div>
            <h3>Refactor Detection</h3>
            <p>Spot renames, splits, and architectural shifts</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Eye size={24} />
            </div>
            <h3>Side-by-side Diffs</h3>
            <p>Compare versions instantly with context</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Boxes size={24} />
            </div>
            <h3>GitHub Integration</h3>
            <p>Works with any public or private repo</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>Get started in seconds</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Connect</h3>
            <p>GitHub OAuth login</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Select</h3>
            <p>Pick your repository</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Analyze</h3>
            <p>Enter function details</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Explore</h3>
            <p>See full history</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Understand your code better</h2>
        <button className="cta-button primary large" onClick={onLogin}>
          Start Analyzing
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Built for developers who care about code quality.</p>
      </footer>
    </div>
  );
}