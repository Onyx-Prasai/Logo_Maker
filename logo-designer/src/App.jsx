import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';
import FilterPanel from './FilterPanel';
import LogoCard from './LogoCard';
import { renderToDataURL } from './LogoCanvas';
import './index.css';

// ─── Shimmer card ─────────────────────────────────────────────
function ShimmerCard() {
  return (
    <div className="shimmer-card">
      <div className="shimmer-box" style={{ width: '100%', aspectRatio: '1' }} />
      <div style={{ padding: '10px 13px', borderTop: '1px solid var(--border)', display: 'flex', gap: 5 }}>
        {[60, 48, 68].map((w, i) => (
          <div key={i} className="shimmer-box" style={{ width: w, height: 16, borderRadius: 99 }} />
        ))}
      </div>
    </div>
  );
}

const DEFAULT_FILTERS = {
  palette: 'random', shape: 'random', font: 'random',
  effect: 'random', layout: 'random', pattern: 'random',
};

// ─── Download helpers ─────────────────────────────────────────
function downloadLogoAsPNG(config, showToast) {
  const url = renderToDataURL(config, 800);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.name.replace(/\s+/g, '-').toLowerCase()}-logo.png`;
  a.click();
  showToast(`Saved "${config.name}" as PNG`, '⬇️');
}

function downloadLogoAsSVG(config, showToast) {
  const { name: n, palette, letterSpacing } = config;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="fill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:0.9" />
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="600" height="600" fill="${palette.bg}" rx="24"/>
  <circle cx="300" cy="300" r="200" fill="url(#fill)" stroke="${palette.primary}" stroke-width="3" filter="url(#glow)" opacity="0.3"/>
  <circle cx="300" cy="300" r="145" fill="none" stroke="${palette.accent}" stroke-width="1.5" opacity="0.4"/>
  <text x="300" y="320" text-anchor="middle" dominant-baseline="middle"
    font-family="Inter, sans-serif" font-weight="800"
    font-size="${Math.min(64, 560 / Math.max(n.length, 1))}px"
    letter-spacing="${letterSpacing || 2}"
    fill="${palette.primary}" filter="url(#glow)">${n.toUpperCase()}</text>
  <text x="300" y="380" text-anchor="middle"
    font-family="Inter, sans-serif" font-size="20px"
    fill="${palette.secondary}" opacity="0.7">BRAND</text>
</svg>`;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  saveAs(blob, `${n.replace(/\s+/g, '-').toLowerCase()}-logo.svg`);
  showToast(`Saved "${n}" as SVG`, '⬇️');
}

// ─── Main App ─────────────────────────────────────────────────
export default function App() {
  const [name, setName] = useState('');
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [count, setCount] = useState(9);
  const [use3D, setUse3D] = useState(false);
  const [compact, setCompact] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const inputRef = useRef(null);

  const showToast = useCallback((msg, icon = '✓') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const generate = useCallback(async (activeFilters) => {
    const activeF = activeFilters || filters;
    if (!name.trim()) {
      inputRef.current?.focus();
      showToast('Please enter a brand name first', '!');
      return;
    }
    setLoading(true); setSelected(null); setLogos([]);
    try {
      const { data } = await axios.post('/api/generate', {
        name: name.trim(),
        count,
        filters: {
          paletteType: activeF.palette,
          shapeStyle: activeF.shape,
          fontStyle: activeF.font,
          effect: activeF.effect,
          layoutMode: activeF.layout,
          pattern: activeF.pattern,
        },
      });
      setLogos(data.logos || []);
      setHasGenerated(true);
    } catch (err) {
      console.error(err);
      showToast('Could not reach API — check your connection.', '✕');
    } finally {
      setLoading(false);
    }
  }, [name, count, filters, showToast]);

  // Apply Filters button — updates filters and regenerates if logos already exist
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    if (hasGenerated && name.trim()) generate(newFilters);
  }, [hasGenerated, name, generate]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') generate(); };

  const dlPNG = useCallback((cfg) => downloadLogoAsPNG(cfg || selected, showToast), [selected, showToast]);
  const dlSVG = useCallback((cfg) => downloadLogoAsSVG(cfg || selected, showToast), [selected, showToast]);

  return (
    <div className="app">
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="navbar" role="navigation">
        <div className="navbar-logo">
          {/* Simple geometric logo mark */}
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <polygon points="16,4 28,12 28,24 16,28 4,24 4,12" fill="none" stroke="#C62828" strokeWidth="2" />
            <polygon points="16,9 23,14 23,22 16,25 9,22 9,14" fill="#C62828" opacity="0.15" />
            <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="800" fill="#C62828" fontFamily="Inter">L</text>
          </svg>
          Logo Maker
        </div>
        <span className="navbar-tagline">Computer Graphics Project</span>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-heading">
        <h1 id="hero-heading">
          Design Your<br /><span>Perfect Logo</span>
        </h1>
        <hr className="zen-rule" aria-hidden />
        <p style={{ marginTop: 16 }}>
          Enter a brand name, pick your filters, and generate multiple
          logo designs powered by real computer graphics algorithms.
        </p>

        {/* Input */}
        <div className="input-area" style={{ marginTop: 28 }}>
          <div className="input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Brand name e.g. Nexus, Summit, Nova…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="name-input"
              id="logo-name-input"
              maxLength={50}
              aria-label="Enter brand name"
              autoFocus
            />
          </div>
          <button
            className="btn-generate"
            onClick={() => generate()}
            disabled={loading}
            id="btn-generate"
          >
            {loading
              ? <><span className="spinner" />Generating…</>
              : 'Generate Logos'
            }
          </button>
        </div>
      </section>

      {/* ─── Main Content ────────────────────────────────────── */}
      <main className="content" role="main">
        {/* Filters Sidebar — now with onApply callback */}
        <FilterPanel
          filters={filters}
          onApply={handleApplyFilters}
          count={count}
          onCountChange={setCount}
          use3D={use3D}
          onToggle3D={() => setUse3D(v => !v)}
        />

        {/* Logo area */}
        <section className="logos-area" aria-label="Generated logos">
          {(loading || logos.length > 0) && (
            <div className="logos-toolbar">
              <div className="toolbar-left">
                <span className="toolbar-title">
                  {loading ? 'Generating logos…' : `${logos.length} designs for "${name}"`}
                </span>
                {!loading && logos.length > 0 && (
                  <span className="toolbar-count">
                    {selected ? '1 selected' : 'Click to select · 🔍 to preview'}
                  </span>
                )}
              </div>
              <div className="toolbar-right">
                <button
                  className={`view-btn${!compact ? ' active' : ''}`}
                  onClick={() => setCompact(false)} aria-label="Large grid" id="btn-view-large"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="2" width="9" height="9" rx="1" /><rect x="13" y="2" width="9" height="9" rx="1" />
                    <rect x="2" y="13" width="9" height="9" rx="1" /><rect x="13" y="13" width="9" height="9" rx="1" />
                  </svg>
                </button>
                <button
                  className={`view-btn${compact ? ' active' : ''}`}
                  onClick={() => setCompact(true)} aria-label="Small grid" id="btn-view-small"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
                    <rect x="16" y="2" width="5" height="5" rx="1" />
                    <rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" />
                    <rect x="16" y="9" width="5" height="5" rx="1" />
                    <rect x="2" y="16" width="5" height="5" rx="1" /><rect x="9" y="16" width="5" height="5" rx="1" />
                    <rect x="16" y="16" width="5" height="5" rx="1" />
                  </svg>
                </button>
                {!loading && logos.length > 0 && (
                  <button className="view-btn" onClick={() => generate()} id="btn-regenerate" title="Regenerate same filters">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && logos.length === 0 && !hasGenerated && (
            <div className="empty-state" aria-live="polite">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                <polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2" />
                <line x1="12" y1="22" x2="12" y2="12" />
                <line x1="22" y1="7" x2="12" y2="12" />
                <line x1="2" y1="7" x2="12" y2="12" />
              </svg>
              <h2>Your canvas is empty</h2>
              <p>Type a brand name above and press <strong>Generate Logos</strong> to begin.</p>
            </div>
          )}

          {!loading && logos.length === 0 && hasGenerated && (
            <div className="empty-state" aria-live="polite">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2>Could not generate</h2>
              <p>Make sure the backend server is running on port 5001.</p>
            </div>
          )}

          {/* Logo grid */}
          <div
            className={`logo-grid${compact ? ' grid-sm' : ''}`}
            aria-label="Logo designs"
          >
            {loading
              ? Array.from({ length: count }).map((_, i) => <ShimmerCard key={i} />)
              : logos.map((logo, idx) => (
                <div
                  key={logo.id}
                  className="card-appear"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <LogoCard
                    config={logo}
                    selected={selected?.id === logo.id}
                    onSelect={setSelected}
                    use3D={use3D}
                    onDownloadPNG={dlPNG}
                    onDownloadSVG={dlSVG}
                  />
                </div>
              ))
            }
          </div>
        </section>
      </main>

      {/* ─── Action bar (when logo is selected) ─────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="action-bar"
            role="toolbar"
            aria-label="Download selected logo"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 36 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <span className="action-bar-name">
              <strong>{selected.name}</strong> selected
            </span>
            <div className="btn-download-formats">
              <button className="btn-fmt" onClick={() => dlSVG()} id="btn-dl-svg">SVG</button>
              <button className="btn-fmt" onClick={() => dlPNG()} id="btn-dl-png">PNG</button>
            </div>
            <button className="btn-download" onClick={() => dlPNG()} id="btn-download-main">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
            <button
              className="btn-deselect"
              onClick={() => setSelected(null)}
              id="btn-deselect"
              aria-label="Deselect"
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Toast notification ──────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status" aria-live="polite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <span className="toast-icon">{toast.icon}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
