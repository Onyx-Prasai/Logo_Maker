import { useState, useEffect } from 'react';

const PALETTE_OPTS = ['random', 'vibrant', 'neon', 'pastel', 'monochrome', 'golden', 'ocean', 'fire', 'galaxy'];
const SHAPE_OPTS = ['random', 'hexagon', 'circle', 'diamond', 'shield', 'star', 'badge', 'infinity', 'arch'];
const FONT_OPTS = ['random', 'serif', 'sans', 'mono', 'display', 'cursive', 'geometric', 'rounded', 'sharp'];
const EFFECT_OPTS = ['random', 'glow', 'shadow', 'gradient', 'outline', 'emboss', 'neon', 'metallic', 'glass'];
const LAYOUT_OPTS = ['random', 'centered', 'stacked', 'horizontal', 'diagonal', 'circular', 'split', 'badge', 'monogram'];
const PATTERN_OPTS = ['random', 'none', 'dots', 'lines', 'grid', 'waves', 'hexagons', 'triangles', 'circuits'];

function Chip({ value, active, onClick }) {
    return (
        <button
            className={`chip${active ? ' active' : ''}`}
            onClick={() => onClick(value)}
            id={`chip-${value}`}
        >
            {value}
        </button>
    );
}

export default function FilterPanel({ filters, onApply, count, onCountChange, use3D, onToggle3D }) {
    // Local draft — only pushed to parent when Apply is clicked
    const [draft, setDraft] = useState(filters);

    // Sync when parent resets
    useEffect(() => { setDraft(filters); }, [filters]);

    const set = (key, val) => setDraft(prev => ({ ...prev, [key]: val }));
    const reset = () => setDraft({ palette: 'random', shape: 'random', font: 'random', effect: 'random', layout: 'random', pattern: 'random' });

    const isDirty = JSON.stringify(draft) !== JSON.stringify(filters);

    return (
        <aside className="filters-sidebar">
            <div className="filters-panel">
                {/* Header */}
                <div className="filters-header">
                    <h3>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Filters
                    </h3>
                    <button className="btn-reset" onClick={reset} id="btn-reset-filters">Reset</button>
                </div>

                {/* Scrollable filter body */}
                <div className="filter-scroll">
                    {/* Count */}
                    <div className="filter-group">
                        <span className="filter-label">Logo count</span>
                        <input
                            type="range" min="3" max="12" value={count}
                            onChange={e => onCountChange(parseInt(e.target.value))}
                            className="count-slider" id="count-slider"
                        />
                        <span className="count-label">{count} logos</span>
                    </div>

                    {/* 3D toggle */}
                    <div className="filter-group">
                        <span className="filter-label">RenderMode</span>
                        <div className="toggle-row" onClick={onToggle3D} id="toggle-3d-mode">
                            <span>{use3D ? '3D Interactive' : '2D Flat'}</span>
                            <div className={`toggle${use3D ? ' on' : ''}`} />
                        </div>
                    </div>

                    {/* Palette */}
                    <div className="filter-group">
                        <span className="filter-label">Colour Palette</span>
                        <div className="filter-chips">
                            {PALETTE_OPTS.map(v => (
                                <Chip key={v} value={v} active={draft.palette === v} onClick={val => set('palette', val)} />
                            ))}
                        </div>
                    </div>

                    {/* Shape */}
                    <div className="filter-group">
                        <span className="filter-label">Shape</span>
                        <div className="filter-chips">
                            {SHAPE_OPTS.map(v => (
                                <Chip key={v} value={v} active={draft.shape === v} onClick={val => set('shape', val)} />
                            ))}
                        </div>
                    </div>

                    {/* Effect */}
                    <div className="filter-group">
                        <span className="filter-label">Effect</span>
                        <div className="filter-chips">
                            {EFFECT_OPTS.map(v => (
                                <Chip key={v} value={v} active={draft.effect === v} onClick={val => set('effect', val)} />
                            ))}
                        </div>
                    </div>

                    {/* Layout */}
                    <div className="filter-group">
                        <span className="filter-label">Text Layout</span>
                        <div className="filter-chips">
                            {LAYOUT_OPTS.map(v => (
                                <Chip key={v} value={v} active={draft.layout === v} onClick={val => set('layout', val)} />
                            ))}
                        </div>
                    </div>

                    {/* Font */}
                    <div className="filter-group">
                        <span className="filter-label">Font Style</span>
                        <div className="filter-chips">
                            {FONT_OPTS.map(v => (
                                <Chip key={v} value={v} active={draft.font === v} onClick={val => set('font', val)} />
                            ))}
                        </div>
                    </div>

                    {/* Pattern */}
                    <div className="filter-group">
                        <span className="filter-label">Background Pattern</span>
                        <div className="filter-chips">
                            {PATTERN_OPTS.map(v => (
                                <Chip key={v} value={v} active={draft.pattern === v} onClick={val => set('pattern', val)} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Apply footer */}
                <div className="apply-footer">
                    <button
                        className="btn-apply"
                        onClick={() => onApply(draft)}
                        id="btn-apply-filters"
                    >
                        {isDirty ? 'Apply Filters →' : 'Filters Applied'}
                    </button>
                </div>
            </div>
        </aside>
    );
}
