import React from 'react';
import { GitBranch, Clock, Zap, Eye, RefreshCw, Boxes, ChevronRight } from 'lucide-react';
import logoHorizontal from './assets/logo-horizontal.jpeg';
import './Landing.css';

export default function Landing({ onLogin }) {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="header-content">
          <img src={logoHorizontal} alt="Code Genealogist" className="navbar-logo" />
          <nav className="nav-menu">
            <button 
              className="nav-link"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button 
              className="nav-link"
              onClick={() => scrollToSection('how-it-works')}
            >
              How It Works
            </button>
            <button 
              className="nav-cta"
              onClick={onLogin}
            >
              Start Analyzing
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
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
                Explore Code History
              </button>
              <p className="cta-supporting">
                Securely connect your GitHub account. Works with public and private repositories.
              </p>
            </div>
          </div>

          {/* Demo Card */}
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

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2>Get started in seconds</h2>
            <p>Four simple steps to understand your code's evolution</p>
          </div>

          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <h3>Connect GitHub</h3>
              <p>Securely authenticate with your GitHub account using OAuth.</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={20} />
            </div>

            <div className="workflow-step">
              <div className="step-number">2</div>
              <h3>Select Repository</h3>
              <p>Choose any repository from your GitHub account to analyze.</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={20} />
            </div>

            <div className="workflow-step">
              <div className="step-number">3</div>
              <h3>Choose Function</h3>
              <p>Enter the file path and function name you want to understand.</p>
            </div>

            <div className="step-connector">
              <ChevronRight size={20} />
            </div>

            <div className="workflow-step">
              <div className="step-number">4</div>
              <h3>Explore Evolution</h3>
              <p>View the complete history with AI-generated insights and explanations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2>Powerful analysis built in</h2>
            <p>Everything you need to understand code evolution</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <GitBranch size={24} />
              </div>
              <h3>Git History</h3>
              <p>Traverse every commit that touched your function with complete context.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Clock size={24} />
              </div>
              <h3>Evolution Timeline</h3>
              <p>Visual timeline showing exactly how code changed across time.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={24} />
              </div>
              <h3>AI Insights</h3>
              <p>Understand why changes were made with AI-powered explanations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <RefreshCw size={24} />
              </div>
              <h3>Refactor Detection</h3>
              <p>Automatically identify renames, splits, and architectural shifts.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Eye size={24} />
              </div>
              <h3>Side-by-side Diffs</h3>
              <p>Compare versions instantly with syntax highlighting and context.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Boxes size={24} />
              </div>
              <h3>GitHub Integration</h3>
              <p>Works seamlessly with any public or private GitHub repository.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="section-container">
          <h2>Ready to explore your code's story?</h2>
          <p>Start analyzing your repositories today. No credit card required.</p>
          <button className="cta-button primary large" onClick={onLogin}>
            Start Analyzing
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="section-container">
          <p>Built for developers who care about code quality and understanding.</p>
        </div>
      </footer>
    </div>
  );
}