/**
 * LogoCanvas.jsx
 * 
 * 2D Canvas-based logo renderer.
 * 
 * Computer Graphics Concepts Used:
 *  • Geometric Transformations  — rotate(), scale(), translate() (CTM manipulation)
 *  • Bezier Curves              — bezierCurveTo() for decorative arcs and shapes
 *  • Color Theory (HSL/RGB)     — HSL color space blending, complementary color offsets
 *  • Rasterization              — Canvas 2D API pixel-by-pixel rasterization
 *  • Clipping                   — clip() path for masking shapes
 *  • Polygon Construction       — regular polygon vertex computation via trigonometry
 *  • Gradient Shading           — linear & radial gradient fill pipelines
 *  • Stroke & Fill Pipeline     — separate stroke/fill pass for outlined shapes
 *  • Pattern / Texture Mapping  — procedural pattern overlay on canvas
 *  • Glow / Bloom Effect        — shadowBlur as GPU bloom approximation
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// ─── Font map ─────────────────────────────────────────────────
const FONT_MAP = {
    serif: 'Georgia, "Times New Roman", serif',
    sans: '"Inter", "Helvetica Neue", sans-serif',
    mono: '"JetBrains Mono", "Courier New", monospace',
    display: '"Space Grotesk", "Arial Black", sans-serif',
    cursive: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    geometric: '"Futura", "Century Gothic", "Apple Gothic", sans-serif',
    rounded: '"Nunito", "Varela Round", sans-serif',
    sharp: '"Oswald", "Arial Narrow", sans-serif',
};

// ─── Helpers ─────────────────────────────────────────────────
/** CG: Regular polygon path — vertex positions via trigonometry */
function polygonPath(ctx, cx, cy, r, sides, rotation = 0) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + rotation;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath();
}

/** CG: Star polygon — alternating inner / outer radii */
function starPath(ctx, cx, cy, outerR, innerR, points, rotation = 0) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI * i) / points - Math.PI / 2 + rotation;
        const r = i % 2 === 0 ? outerR : innerR;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.closePath();
}

/** CG: HSL shift — rotate hue in HSL colour space */
function shiftHue(hex, shift) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    let h, s;
    if (max === min) { h = s = 0; } else {
        const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; default: h = (r - g) / d + 4; }
        h /= 6;
    }
    h = (h + shift / 360) % 1; if (h < 0) h += 1;
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const ro = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const go = Math.round(hue2rgb(p, q, h) * 255);
    const bo = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return `#${ro.toString(16).padStart(2, '0')}${go.toString(16).padStart(2, '0')}${bo.toString(16).padStart(2, '0')}`;
}

// ─── Shape path builders ──────────────────────────────────────
function buildShape(ctx, shape, cx, cy, r) {
    switch (shape) {
        case 'circle':
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); break;
        case 'hexagon':
            polygonPath(ctx, cx, cy, r, 6, Math.PI / 6); break;
        case 'diamond':
            polygonPath(ctx, cx, cy, r, 4, 0); break;
        case 'shield':
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx + r, cy - r * 0.4);
            ctx.lineTo(cx + r, cy + r * 0.2);
            ctx.bezierCurveTo(cx + r, cy + r * 0.8, cx, cy + r, cx, cy + r);        // CG: Bezier curve
            ctx.bezierCurveTo(cx, cy + r, cx - r, cy + r * 0.8, cx - r, cy + r * 0.2);
            ctx.lineTo(cx - r, cy - r * 0.4);
            ctx.closePath(); break;
        case 'star':
            starPath(ctx, cx, cy, r, r * 0.45, 5); break;
        case 'badge':
            polygonPath(ctx, cx, cy, r, 8, Math.PI / 8); break;
        case 'infinity': {
            // CG: Bezier curve for lemniscate-ish shape
            const w = r * 0.6;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.bezierCurveTo(cx - w, cy - r, cx - r * 1.6, cy - r, cx - r * 1.6, cy);
            ctx.bezierCurveTo(cx - r * 1.6, cy + r, cx - w, cy + r, cx, cy);
            ctx.bezierCurveTo(cx + w, cy - r, cx + r * 1.6, cy - r, cx + r * 1.6, cy);
            ctx.bezierCurveTo(cx + r * 1.6, cy + r, cx + w, cy + r, cx, cy);
            ctx.closePath(); break;
        }
        case 'arch':
            ctx.beginPath();
            ctx.arc(cx, cy, r, Math.PI, 0);
            ctx.lineTo(cx + r, cy + r * 0.6);
            ctx.bezierCurveTo(cx + r * 0.5, cy + r * 1.1, cx - r * 0.5, cy + r * 1.1, cx - r, cy + r * 0.6); // CG: Bezier
            ctx.closePath(); break;
        default:
            polygonPath(ctx, cx, cy, r, 6, 0);
    }
}

// ─── Pattern overlay ──────────────────────────────────────────
function drawPattern(ctx, size, pattern, color) {
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    const s = 20;
    switch (pattern) {
        case 'dots':
            for (let x = 0; x < size; x += s)
                for (let y = 0; y < size; y += s) {
                    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
                }
            break;
        case 'lines':
            for (let i = 0; i < size * 2; i += s) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(0, i); ctx.stroke();
            }
            break;
        case 'grid':
            for (let x = 0; x < size; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke(); }
            for (let y = 0; y < size; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
            break;
        case 'triangles':
            for (let x = 0; x < size; x += s)
                for (let y = 0; y < size; y += s) {
                    ctx.beginPath(); ctx.moveTo(x, y + s); ctx.lineTo(x + s / 2, y); ctx.lineTo(x + s, y + s); ctx.closePath(); ctx.stroke();
                }
            break;
        case 'hexagons':
            for (let row = 0; row < size / s + 1; row++)
                for (let col = 0; col < size / s + 1; col++) {
                    const ox = col * s * 1.7 + (row % 2) * s * 0.85;
                    const oy = row * s * 1.5;
                    polygonPath(ctx, ox, oy, s * 0.5, 6, Math.PI / 6);
                    ctx.stroke();
                }
            break;
        case 'waves':
            for (let y = 0; y < size; y += s) {
                ctx.beginPath(); ctx.moveTo(0, y);
                for (let x = 0; x < size; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.08) * 5);
                ctx.stroke();
            }
            break;
        case 'circuits':
            for (let i = 0; i < 10; i++) {
                const x = Math.random() * size, y = Math.random() * size;
                ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + 40, y + 40); ctx.stroke();
            }
            break;
        default: break;
    }
    ctx.globalAlpha = 1;
}

// ─── Decorative rings / arcs ──────────────────────────────────
function drawDecors(ctx, config, cx, cy, r) {
    const { palette, decorCount, bezierCurves, effect } = config;
    // CG: Rotation transformation applied per segment
    for (let i = 0; i < decorCount; i++) {
        const angle = (Math.PI * 2 * i) / decorCount;
        const dx = cx + (r * 0.85) * Math.cos(angle);
        const dy = cy + (r * 0.85) * Math.sin(angle);
        const dotR = 2 + (i % 3);
        ctx.beginPath();
        ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.secondary;
        ctx.shadowBlur = effect === 'glow' || effect === 'neon' ? 10 : 0;
        ctx.shadowColor = palette.accent;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // CG: Bezier decorative arcs
    bezierCurves.forEach((bc, i) => {
        const alpha = 0.2 - i * 0.05;
        if (alpha <= 0) return;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.5);
        ctx.bezierCurveTo(cx + bc.cx1, cy + bc.cy1, cx + bc.cx2, cy + bc.cy2, cx, cy + r * 0.5);
        ctx.strokeStyle = i === 0 ? palette.primary : palette.secondary;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
}

// ─── Text renderer ────────────────────────────────────────────
function drawText(ctx, config, cx, cy, r, size) {
    const { name, initials, palette, fontStyle, layout, effect, letterSpacing, fontSize } = config;
    const font = FONT_MAP[fontStyle] || FONT_MAP.sans;
    const safeFontSize = Math.max(10, Math.min(fontSize, size * 0.22));

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // CG: Text glow / bloom
    if (effect === 'glow' || effect === 'neon') {
        ctx.shadowBlur = 20; ctx.shadowColor = palette.primary;
    } else if (effect === 'shadow') {
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    }

    // CG: Gradient text fill (linear gradient — fill pipeline)
    if (effect === 'gradient' || effect === 'metallic') {
        const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
        grad.addColorStop(0, palette.primary);
        grad.addColorStop(0.5, palette.accent);
        grad.addColorStop(1, palette.secondary);
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = palette.primary;
    }

    switch (layout) {
        case 'monogram': {
            ctx.font = `800 ${safeFontSize * 2.2}px ${font}`;
            ctx.letterSpacing = `${letterSpacing}px`;
            ctx.fillText(initials, cx, cy);
            break;
        }
        case 'stacked': {
            const parts = name.split(' ');
            const lh = safeFontSize * 1.4;
            const top = cy - (parts.length - 1) * lh / 2;
            parts.forEach((p, i) => {
                ctx.font = `700 ${safeFontSize}px ${font}`;
                ctx.fillText(p.toUpperCase(), cx, top + i * lh);
            });
            break;
        }
        case 'circular': {
            // CG: Transformation — rotate canvas to place each character on arc
            const text = name.toUpperCase();
            const arcR = r * 0.7;
            const arcLen = Math.PI; // top semicircle
            const step = arcLen / (text.length - 1 || 1);
            const start = -Math.PI / 2 - arcLen / 2;
            ctx.font = `700 ${Math.max(8, safeFontSize * 0.75)}px ${font}`;
            for (let i = 0; i < text.length; i++) {
                const angle = start + i * step;
                ctx.save();
                ctx.translate(cx + arcR * Math.cos(angle), cy + arcR * Math.sin(angle));
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillText(text[i], 0, 0);
                ctx.restore();
            }
            break;
        }
        case 'diagonal': {
            // CG: Affine transformation — rotate text
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(-0.25);
            ctx.font = `700 ${safeFontSize}px ${font}`;
            ctx.fillText(name.toUpperCase(), 0, 0);
            ctx.restore();
            break;
        }
        case 'split': {
            const mid = Math.ceil(name.length / 2);
            ctx.font = `800 ${safeFontSize}px ${font}`;
            ctx.fillStyle = palette.primary;
            ctx.fillText(name.slice(0, mid).toUpperCase(), cx, cy - safeFontSize * 0.4);
            ctx.fillStyle = palette.secondary;
            ctx.fillText(name.slice(mid).toUpperCase(), cx, cy + safeFontSize * 1.1);
            break;
        }
        case 'badge':
        case 'horizontal':
        case 'centered':
        default: {
            ctx.font = `800 ${safeFontSize}px ${font}`;
            ctx.letterSpacing = `${letterSpacing}px`;
            ctx.fillText(name.toUpperCase(), cx, cy);
            // small tagline
            ctx.font = `400 ${Math.max(6, safeFontSize * 0.45)}px ${font}`;
            ctx.fillStyle = palette.secondary;
            ctx.globalAlpha = 0.7;
            ctx.fillText('BRAND', cx, cy + safeFontSize * 1.1);
            ctx.globalAlpha = 1;
            break;
        }
    }

    // CG: Text outline stroke pipeline
    if (effect === 'outline' || effect === 'emboss') {
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = palette.secondary;
        ctx.lineWidth = 1.5;
        ctx.font = `800 ${safeFontSize}px ${font}`;
        ctx.strokeText(name.toUpperCase(), cx, cy);
    }

    ctx.restore();
}

// ─── Main draw function ───────────────────────────────────────
// logicalSize = the CSS pixel size (before DPR scaling)
function drawLogo(canvas, config, logicalSize) {
    if (!canvas) return;
    const { palette, shape, effect, pattern, glowIntensity, strokeWidth, borderRadius } = config;
    const size = logicalSize;   // use logical size for all drawing coordinates
    const ctx = canvas.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.34;

    ctx.clearRect(0, 0, size, size);

    // ── Background ──────────────────────────────────────────────
    // CG: Radial gradient for vignette-style background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.75);
    bgGrad.addColorStop(0, shiftHue(palette.bg, 20));
    bgGrad.addColorStop(1, palette.bg);
    ctx.fillStyle = bgGrad;
    // Rounded-rect background (CG: geometric primitive)
    ctx.roundRect(0, 0, size, size, borderRadius);
    ctx.fill();

    // ── Pattern overlay ───────────────────────────────────────── (CG: procedural texture)
    drawPattern(ctx, size, pattern, palette.primary);

    // ── Outer glow ring ───────────────────────────────────────── (CG: bloom approximation)
    if (effect === 'glow' || effect === 'neon' || effect === 'glass') {
        ctx.save();
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = palette.primary;
        buildShape(ctx, shape, cx, cy, r * 1.05);
        ctx.strokeStyle = `${palette.primary}44`;
        ctx.lineWidth = strokeWidth * 2;
        ctx.stroke();
        ctx.restore();
    }

    // ── Main shape ────────────────────────────────────────────── (CG: polygon / Bezier fill)
    buildShape(ctx, shape, cx, cy, r);
    ctx.save();

    // CG: Linear/radial gradient fill depending on effect mode
    let fill;
    if (effect === 'gradient' || effect === 'glass' || effect === 'metallic') {
        fill = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        fill.addColorStop(0, `${palette.primary}CC`);
        fill.addColorStop(0.5, `${palette.secondary}99`);
        fill.addColorStop(1, `${palette.accent}CC`);
    } else {
        fill = `${palette.primary}22`;
    }
    ctx.fillStyle = fill;
    ctx.shadowBlur = effect === 'shadow' ? 20 : 0;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fill();

    // CG: Stroke pipeline
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = strokeWidth;
    if (effect === 'neon') {
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = palette.primary;
    }
    ctx.stroke();
    ctx.restore();

    // ── Inner shape (accent) ──────────────────────────────────── (CG: nested geometric transform)
    buildShape(ctx, shape, cx, cy, r * 0.72);
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = strokeWidth * 0.5;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.restore();

    // ── Decorative dots & bezier arcs ────────────────────────────
    drawDecors(ctx, config, cx, cy, r);

    // ── Text ─────────────────────────────────────────────────────
    drawText(ctx, config, cx, cy, r, size);
}

// ─── React Component ──────────────────────────────────────────
// Measures the container ONCE on mount (useLayoutEffect — synchronous,
// before browser paint). Never re-observes to avoid the DOM feedback
// loop that caused the jumping / glitch.
export default function LogoCanvas({ config, size: sizeProp, className = '' }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    // measured once; undefined until layout runs
    const [measuredSize, setMeasuredSize] = useState(sizeProp || null);

    // Measure the wrapper element once, synchronously before paint
    useLayoutEffect(() => {
        if (sizeProp) { setMeasuredSize(sizeProp); return; }
        if (wrapperRef.current) {
            const w = wrapperRef.current.getBoundingClientRect().width;
            setMeasuredSize(w > 0 ? Math.round(w) : 280);
        }
        // Only run once on mount (empty dep is intentional here)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-draw whenever config or resolved size changes
    useEffect(() => {
        if (!config || !measuredSize) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const logical = measuredSize;
        // CG: Transformation matrix — scale for HiDPI / Retina displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(logical * dpr);
        canvas.height = Math.round(logical * dpr);
        canvas.style.width = `${logical}px`;
        canvas.style.height = `${logical}px`;

        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset CTM
        ctx.scale(dpr, dpr);                 // CG: apply DPR scale transformation

        drawLogo(canvas, config, logical);   // explicit logical size — no DPR confusion
    }, [config, measuredSize]);

    return (
        <div
            ref={wrapperRef}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <canvas
                ref={canvasRef}
                className={className}
                title={config?.name}
                style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
            />
        </div>
    );
}

/** Exported utility to draw onto an off-screen canvas and return a data URL */
export function renderToDataURL(config, size = 600) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawLogo(canvas, config, size);      // pass logical size
    return canvas.toDataURL('image/png');
}
