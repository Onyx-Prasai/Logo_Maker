import { memo, Suspense, useState } from 'react';
import LogoCanvas, { renderToDataURL } from './LogoCanvas';
import Logo3D from './Logo3D';

// ─── Zoom Preview Modal ───────────────────────────────────────
function PreviewModal({ config, onClose, onDownloadPNG, onDownloadSVG }) {
    return (
        <div
            className="modal-overlay"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${config.name} logo`}
        >
            <div className="modal-box">
                <div className="modal-header">
                    <h3>Preview — "{config.name}"</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close preview">✕</button>
                </div>

                {/* Large canvas preview */}
                <div className="modal-canvas-area">
                    <LogoCanvas config={config} size={420} />
                </div>

                {/* Tags */}
                <div className="modal-info">
                    {[config.shape, config.effect, config.layout, config.palette?.paletteName, config.fontStyle].map((t, i) => (
                        <span key={i} className="card-tag">{t}</span>
                    ))}
                </div>

                {/* Actions */}
                <div className="modal-footer">
                    <button className="btn-fmt" onClick={onDownloadSVG} id="modal-btn-svg">Export SVG</button>
                    <button className="btn-fmt" onClick={onDownloadPNG} id="modal-btn-png">Export PNG</button>
                    <button className="btn-download" onClick={onDownloadPNG} id="modal-btn-download">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PNG
                    </button>
                </div>
            </div>
        </div>
    );
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
                {/* Canvas area */}
                <div className="card-canvas-wrapper" onClick={handleZoom}>
                    {use3D ? (
                        <Suspense fallback={<LogoCanvas config={config} />}>
                            <Logo3D config={config} />
                        </Suspense>
                    ) : (
                        <LogoCanvas config={config} />
                    )}
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
                    onClose={() => setShowPreview(false)}
                    onDownloadPNG={() => { onDownloadPNG?.(config); setShowPreview(false); }}
                    onDownloadSVG={() => { onDownloadSVG?.(config); setShowPreview(false); }}
                />
            )}
        </>
    );
}

export default memo(LogoCard);
