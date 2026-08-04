import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GitBranch, Clock, Zap, Eye, RefreshCw, Boxes, ChevronUp, ChevronDown } from 'lucide-react';
import './Landing.css';

const CORE_SAMPLE = [
  { depth: '00.0m', type: 'CREATED', tone: 'cyan', note: 'Initial implementation committed.' },
  { depth: '01.4m', type: 'BUG FIX', tone: 'copper', note: 'Off-by-one error corrected in loop bound.' },
  { depth: '02.9m', type: 'REFACTOR', tone: 'amber', note: 'Reduced overhead 85% through caching logic.' },
  { depth: '04.1m', type: 'CURRENT', tone: 'bright', note: 'Stable — no open regressions.' },
];

const STEPS = [
  { ref: 'REF 01', title: 'Connect GitHub', body: 'Authenticate with OAuth — no credentials stored.' },
  { ref: 'REF 02', title: 'Select repository', body: 'Choose any repo your account can access.' },
  { ref: 'REF 03', title: 'Pick a function', body: 'Browse real files and functions — no guessing.' },
  { ref: 'REF 04', title: 'Read the lineage', body: 'Full history, annotated and explained by AI.' },
];

const FEATURES = [
  { icon: GitBranch, code: 'SPEC-01', title: 'Git History', body: 'Traverse every commit that touched your function.' },
  { icon: Clock, code: 'SPEC-02', title: 'Evolution Timeline', body: 'A measured cross-section of how code changed.' },
  { icon: Zap, code: 'SPEC-03', title: 'AI Insights', body: 'Understand why changes were made, not just what.' },
  { icon: RefreshCw, code: 'SPEC-04', title: 'Refactor Detection', body: 'Identify renames, splits, architectural shifts.' },
  { icon: Eye, code: 'SPEC-05', title: 'Side-by-side Diffs', body: 'Compare versions instantly with full context.' },
  { icon: Boxes, code: 'SPEC-06', title: 'GitHub Integration', body: 'Works with any repository you can access.' },
];

const SHEETS = [
  { id: 'title', no: '01', name: 'TITLE' },
  { id: 'specimen', no: '02', name: 'SPECIMEN' },
  { id: 'procedure', no: '03', name: 'PROCEDURE' },
  { id: 'spec', no: '04', name: 'SPECIFICATION' },
  { id: 'signoff', no: '05', name: 'SIGN-OFF' },
];

const DEMO_VERSIONS = [
  { tag: 'v0', lines: [[' ', 'function score(user) {'], ['+', '  return user.points'], [' ', '}']] },
  { tag: 'v1', lines: [[' ', 'function score(user) {'], ['-', '  return user.points'], ['+', '  return user.points * user.mult'], [' ', '}']] },
  { tag: 'v2', lines: [[' ', 'function score(user) {'], [' ', '  return user.points * user.mult'], ['+', '  // memoized — see cache.js'], [' ', '}']] },
];

// Real commit history for extract_function() in this project's own backend
// (CodeGenealogist/genealogy.py) — pulled from `git log`, not fabricated.
const LIVE_DEMO = {
  file: 'genealogy.py',
  fn: 'extract_function()',
  commits: [
    { hash: 'f1faafc', date: '2026-06-03', message: 'Add backend files for deployment' },
    { hash: '672ccda', date: '2026-06-04', message: 'Simplify function extraction regex' },
    { hash: '0eb6537', date: '2026-08-02', message: 'Unify extraction with function picker' },
  ],
  base: [
    'def extract_function(self, code, func_name):',
    '    patterns = [',
    '        rf"def\\s+{func_name}\\s*\\(..."',
    '    ]',
  ],
  diffs: [
    [
      [' ', 'def extract_function(self, code, func_name):'],
      [' ', '    patterns = ['],
      ['-', '        rf"const\\s+{func_name}..."'],
      ['+', '        # Python: def function_name'],
      ['+', '        rf"def\\s+{func_name}\\s*\\(..."'],
      ['+', '        # JavaScript: function declaration'],
      ['+', '        rf"(?:export\\s+)?function..."'],
      [' ', '    ]'],
    ],
    [
      ['-', 'def extract_function(self, code, func_name):'],
      ['+', "def extract_function(self, code, func_name, file_path=''):"],
      ['-', '    patterns = [...]'],
      ['+', '    language = self._language_for(file_path)'],
      ['+', '    for pattern, _kind in self.PATTERNS[lang]:'],
      ['+', '        for match in re.finditer(pattern, code):'],
    ],
  ],
  insights: [
    'Consolidated regex patterns — clearer JS/Python matching',
    'Unified with list_functions() — one shared pattern source',
  ],
};

const LIVE_DEMO_PHASE_MS = [900, 1300, 1900, 1300, 1900, 2700];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function LineageMark({ size = 26 }) {
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

function SheetLabel({ no, name, active }) {
  return (
    <div className={`sheet-label ${active ? 'is-active' : ''}`}>
      <span className="sheet-no">SHEET {no}</span>
      <span className="sheet-name">{name}</span>
      <span className="sheet-of">OF 05</span>
      <span className="sheet-label-rule" aria-hidden="true" />
    </div>
  );
}

function FunctionEvolutionDemo({ isActive, reducedMotion }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || !isActive) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % DEMO_VERSIONS.length);
    }, 3200);
    return () => clearInterval(id);
  }, [isActive, reducedMotion]);

  const shownIndex = reducedMotion ? DEMO_VERSIONS.length - 1 : index;
  const version = DEMO_VERSIONS[shownIndex];

  return (
    <div className="demo-panel" aria-hidden="true">
      <div className="demo-panel-head">
        <span>FIG. 02 — LIVE DIFF</span>
        <span className="demo-tag">{version.tag}</span>
      </div>
      <pre className="demo-code" key={shownIndex}>
        {version.lines.map(([marker, code], i) => (
          <div key={i} className={`demo-line demo-line--${marker === '+' ? 'add' : marker === '-' ? 'del' : 'ctx'}`}>
            <span className="demo-marker">{marker}</span>{code}
          </div>
        ))}
      </pre>
    </div>
  );
}

function LiveAnalysisDemo({ reducedMotion }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = setTimeout(() => {
      setPhase((p) => (p + 1) % LIVE_DEMO_PHASE_MS.length);
    }, LIVE_DEMO_PHASE_MS[phase]);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion]);

  const activePhase = reducedMotion ? 5 : phase;
  const visibleCommits = activePhase === 0 ? 1 : activePhase < 3 ? 2 : 3;
  const codeLines = activePhase === 0
    ? LIVE_DEMO.base.map((line) => [' ', line])
    : activePhase < 3 ? LIVE_DEMO.diffs[0] : LIVE_DEMO.diffs[1];
  const codeKey = activePhase === 0 ? 'base' : activePhase < 3 ? 'diff0' : 'diff1';
  const activeInsight = activePhase === 2 ? LIVE_DEMO.insights[0] : activePhase >= 4 ? LIVE_DEMO.insights[1] : null;

  return (
    <div className="live-demo" aria-hidden="true">
      <div className="live-demo-head">
        <span className="live-demo-label">FIG. 01 — LIVE ANALYSIS</span>
        <span className="live-demo-target">{LIVE_DEMO.fn} <span className="live-demo-file">· {LIVE_DEMO.file}</span></span>
      </div>

      <div className="live-demo-timeline">
        {LIVE_DEMO.commits.map((c, i) => (
          <React.Fragment key={c.hash}>
            <div className={`live-demo-node ${i < visibleCommits ? 'is-visible' : ''}`}>
              <span className="live-demo-dot" />
              <span className="live-demo-hash">{c.hash}</span>
            </div>
            {i < LIVE_DEMO.commits.length - 1 && (
              <span className={`live-demo-connector ${i < visibleCommits - 1 ? 'is-drawn' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="live-demo-code">
        <pre key={codeKey}>
          {codeLines.map(([marker, text], i) => (
            <div key={i} className={`live-demo-line live-demo-line--${marker === '+' ? 'add' : marker === '-' ? 'remove' : 'same'}`}>
              <span className="live-demo-marker">{marker === '+' ? '+' : marker === '-' ? '−' : ''}</span>
              <span>{text}</span>
            </div>
          ))}
        </pre>
      </div>

      <div className={`live-demo-insight ${activeInsight ? 'is-visible' : ''}`}>
        <span className="live-demo-insight-leader" aria-hidden="true" />
        <span className="live-demo-insight-body">
          <span className="live-demo-insight-tag">AI INSIGHT</span>
          <span className="live-demo-insight-text">{activeInsight}</span>
        </span>
      </div>
    </div>
  );
}

function TransitionDiff({ badge }) {
  if (!badge) return null;
  return (
    <div className={`diff-badge ${badge.dir > 0 ? 'add' : 'del'}`} aria-hidden="true">
      {badge.dir > 0 ? '+' : '−'} SHEET {badge.no}
    </div>
  );
}

export default function Landing({ onLogin }) {
  const [active, setActive] = useState('title');
  const [badge, setBadge] = useState(null);
  const sheetRefs = useRef({});
  const prevActiveRef = useRef('title');
  const badgeTimeoutRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setActive(entry.target.dataset.sheet);
          }
        });
      },
      { threshold: [0.5] }
    );
    Object.values(sheetRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prevIndex = SHEETS.findIndex((s) => s.id === prevActiveRef.current);
    const nextIndex = SHEETS.findIndex((s) => s.id === active);
    if (prevIndex !== nextIndex && prevIndex !== -1 && !reducedMotion) {
      clearTimeout(badgeTimeoutRef.current);
      setBadge({ dir: nextIndex - prevIndex, no: SHEETS[nextIndex].no });
      badgeTimeoutRef.current = setTimeout(() => setBadge(null), 1000);
    }
    prevActiveRef.current = active;
    return () => clearTimeout(badgeTimeoutRef.current);
  }, [active, reducedMotion]);

  const goTo = useCallback((id) => {
    sheetRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeIndex = SHEETS.findIndex((s) => s.id === active);

  const goRelative = (delta) => {
    const next = SHEETS[activeIndex + delta];
    if (next) goTo(next.id);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goRelative(1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goRelative(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const setSheetRef = (id) => (el) => {
    sheetRefs.current[id] = el;
  };

  const contentClass = (id) => `sheet-content ${active === id ? 'is-active' : ''}`;

  return (
    <div className="landing">
      <div className="reg-mark reg-mark--tl" aria-hidden="true" />
      <div className="reg-mark reg-mark--tr" aria-hidden="true" />
      <div className="reg-mark reg-mark--bl" aria-hidden="true" />
      <div className="reg-mark reg-mark--br" aria-hidden="true" />

      <header className="landing-header">
        <div className="header-content">
          <button className="brand" onClick={() => goTo('title')} aria-label="Back to top">
            <span className="brand-mark"><LineageMark /></span>
            <span className="brand-text">Code<br />Genealogist</span>
          </button>

          <nav className="sheet-index">
            {SHEETS.map((s) => (
              <button
                key={s.id}
                className={`sheet-index-item ${active === s.id ? 'active' : ''}`}
                onClick={() => goTo(s.id)}
                title={s.name}
              >
                {s.no}
              </button>
            ))}
          </nav>

          <button className="btn btn-primary nav-cta" onClick={onLogin}>Start Analyzing</button>
        </div>
      </header>

      <div className="sheets">
        {/* SHEET 01 — TITLE */}
        <section className="sheet" data-sheet="title" ref={setSheetRef('title')}>
          <SheetLabel no="01" name="TITLE" active={active === 'title'} />
          <div className={contentClass('title')}>
            <div className="title-sheet">
              <div className="title-copy">
                <span className="eyebrow">FIG. 01 — FUNCTION LINEAGE</span>
                <h1 className="hero-headline">Understand why<br />your code evolved</h1>
                <p className="hero-description">
                  Trace every decision behind your functions. See the full story of how code
                  changed across commits, measured and annotated with AI-powered insight.
                </p>
                <div className="cta-section">
                  <button className="btn btn-primary" onClick={onLogin}>Explore Code History</button>
                  <p className="cta-supporting">Securely connect GitHub. Public and private repositories.</p>
                </div>
                <FunctionEvolutionDemo isActive={active === 'title'} reducedMotion={reducedMotion} />
              </div>

              <div className="title-diagram">
                <LiveAnalysisDemo reducedMotion={reducedMotion} />
              </div>
            </div>
          </div>
        </section>

        {/* SHEET 02 — SPECIMEN */}
        <section className="sheet" data-sheet="specimen" ref={setSheetRef('specimen')}>
          <SheetLabel no="02" name="SPECIMEN" active={active === 'specimen'} />
          <div className={contentClass('specimen')}>
            <div className="specimen-sheet">
              <p className="sheet-intro">Every function has a history. Here's how we read it.</p>
              <div className="core-sample core-sample--large">
                <div className="core-sample-head">
                  <span className="core-sample-label">CORE SAMPLE</span>
                  <span className="core-sample-fn">calculateUserScore()</span>
                </div>
                <div className="core-sample-body">
                  <div className="depth-rule">
                    {CORE_SAMPLE.map((s) => (
                      <span key={s.depth} className="depth-tick">{s.depth}</span>
                    ))}
                  </div>
                  <div className="strata">
                    {CORE_SAMPLE.map((s, i) => (
                      <div
                        key={s.type}
                        className={`stratum tone-${s.tone}`}
                        style={{ '--stagger-delay': `${0.15 + i * 0.2}s` }}
                      >
                        <div className="stratum-band" />
                        <div className="stratum-callout">
                          <div className="stratum-leader" />
                          <div className="stratum-text">
                            <span className="stratum-type">{s.type}</span>
                            <p>{s.note}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SHEET 03 — PROCEDURE */}
        <section className="sheet" data-sheet="procedure" ref={setSheetRef('procedure')}>
          <SheetLabel no="03" name="PROCEDURE" active={active === 'procedure'} />
          <div className={contentClass('procedure')}>
            <div className="procedure-sheet">
              <div className="section-header">
                <h2>Get started in seconds</h2>
                <p>Four steps to your function's full lineage</p>
              </div>
              <div className="schematic">
                <div className="schematic-line" aria-hidden="true" />
                {STEPS.map((step, i) => (
                  <div className="schematic-step" key={step.ref} style={{ transitionDelay: `${0.1 + i * 0.12}s` }}>
                    <span className="step-tag">{step.ref}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SHEET 04 — SPECIFICATION */}
        <section className="sheet" data-sheet="spec" ref={setSheetRef('spec')}>
          <SheetLabel no="04" name="SPECIFICATION" active={active === 'spec'} />
          <div className={contentClass('spec')}>
            <div className="spec-sheet">
              <div className="section-header">
                <h2>Powerful analysis built in</h2>
                <p>Everything you need to understand code evolution</p>
              </div>
              <div className="features-grid">
                {FEATURES.map((f, i) => (
                  <div className="spec-card" key={f.code} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
                    <span className="spec-bracket spec-bracket--tl" />
                    <span className="spec-bracket spec-bracket--br" />
                    <div className="spec-icon"><f.icon size={18} /></div>
                    <span className="spec-code">{f.code}</span>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SHEET 05 — SIGN-OFF */}
        <section className="sheet" data-sheet="signoff" ref={setSheetRef('signoff')}>
          <SheetLabel no="05" name="SIGN-OFF" active={active === 'signoff'} />
          <div className={contentClass('signoff')}>
            <div className="signoff-sheet">
              <div className="stamp">READY FOR ANALYSIS</div>
              <h2>Ready to explore your code's story?</h2>
              <p>Start analyzing your repositories today. No credit card required.</p>
              <button className="btn btn-primary btn-large" onClick={onLogin}>Start Analyzing</button>

              <div className="title-block">
                <span><strong>DWG</strong> CODE-GENEALOGIST</span>
                <span><strong>REV</strong> 1.0</span>
                <span><strong>SCALE</strong> 1:1</span>
                <span><strong>DRAWN</strong> A. SINGH</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <TransitionDiff badge={badge} />

      <div className="page-controls">
        <button className="page-nav-btn" onClick={() => goRelative(-1)} disabled={activeIndex <= 0} aria-label="Previous sheet">
          <ChevronUp size={15} />
        </button>
        <span className="page-count">{String(activeIndex + 1).padStart(2, '0')} / 05</span>
        <button className="page-nav-btn" onClick={() => goRelative(1)} disabled={activeIndex >= SHEETS.length - 1} aria-label="Next sheet">
          <ChevronDown size={15} />
        </button>
      </div>
    </div>
  );
}
