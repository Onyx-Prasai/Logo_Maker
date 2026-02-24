import { Component, memo, Suspense, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import LogoCanvas from './LogoCanvas';
import Logo3D from './Logo3D';

// Error boundary for 3D preview fallback (avoids Context Lost crash)
class Preview3DErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return <LogoCanvas config={this.props.config} size={500} />;
        }
        return this.props.children;
    }
}

// ─── Full-screen Zoom Preview Modal ────────────────────────────
function PreviewModal({ config, onClose, onDownloadPNG, onDownloadSVG, use3D }) {
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [handleEscape]);

    const modalContent = (
        <div
            className="preview-modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${config.name} logo`}
        >
            {/* Close button — top-right, never overlaps logo */}
            <button
                className="preview-modal-close"
                onClick={onClose}
                aria-label="Close preview"
            >
                ✕
            </button>

            {/* Logo area — takes center, nothing overlaps */}
            <div className="preview-modal-canvas">
                {use3D ? (
                    <Preview3DErrorBoundary config={config} key="3d">
                        <Suspense fallback={<div className="preview-loading">Loading 3D…</div>}>
                            <Logo3D config={config} compact={false} />
                        </Suspense>
                    </Preview3DErrorBoundary>
                ) : (
                    <LogoCanvas
                        config={config}
                        key="2d"
                        size={typeof window !== 'undefined' ? Math.min(700, Math.min(window.innerWidth, window.innerHeight) - 120) : 600}
                    />
                )}
            </div>

            {/* Footer — below logo, no overlap */}
            <div className="preview-modal-footer">
                <span className="preview-modal-title">"{config.name}" {use3D && '· 3D'}</span>
                <div className="preview-modal-actions">
                    <button className="btn-fmt" onClick={onDownloadSVG}>SVG</button>
                    <button className="btn-fmt" onClick={onDownloadPNG}>PNG</button>
                    <button className="btn-download" onClick={onDownloadPNG}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

// ─── Logo Card ────────────────────────────────────────────────
function LogoCard({ config, selected, onSelect, use3D, onDownloadPNG, onDownloadSVG }) {
    const [showPreview, setShowPreview] = useState(false);
    if (!config) return null;
    const { shape, effect, layout, id } = config;

    const handleCardClick = () => {
        onSelect(config);
    };

    const handleZoom = (e) => {
        e.stopPropagation();
        setShowPreview(true);
    };

    return (
        <>
            <div
                className={`logo-card${selected ? ' selected' : ''}`}
                onClick={handleCardClick}
                id={`logo-card-${id}`}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleCardClick()}
                aria-label={`${config.name} logo – ${shape} ${effect}`}
            >
                {/* Canvas area — always 2D in grid to prevent WebGL Context Lost (too many canvases).
                   3D only in full-screen preview when you click 🔍 */}
                <div className="card-canvas-wrapper" onClick={handleZoom}>
                    <LogoCanvas config={config} />
                    <span className="zoom-hint">🔍 Preview</span>
                    {selected && <div className="selected-badge">✓</div>}
                </div>

                {/* Info row */}
                <div className="card-info" onClick={e => e.stopPropagation()}>
                    <div className="card-tags">
                        <span className="card-tag">{shape}</span>
                        <span className="card-tag">{effect}</span>
                        <span className="card-tag">{layout}</span>
                    </div>
                    <button
                        className="card-select-btn"
                        onClick={e => { e.stopPropagation(); onSelect(config); }}
                        id={`select-btn-${id}`}
                    >
                        {selected ? '✓ Selected' : 'Select'}
                    </button>
                </div>
            </div>

            {/* Zoom Preview Modal */}
            {showPreview && (
                <PreviewModal
                    config={config}
                    use3D={use3D}
                    onClose={() => setShowPreview(false)}
                    onDownloadPNG={() => { onDownloadPNG?.(config); setShowPreview(false); }}
                    onDownloadSVG={() => { onDownloadSVG?.(config); setShowPreview(false); }}
                />
            )}
        </>
    );
}

export default memo(LogoCard);
