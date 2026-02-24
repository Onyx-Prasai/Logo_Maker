/**
 * Shared logo generation logic for Vercel Serverless Functions.
 * Extracted from logo-designer/server/index.js
 */

const { randomUUID } = require('crypto');

const COLOR_PALETTES = {
    vibrant: [
        { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#FFE66D', bg: '#1A1A2E' },
        { primary: '#FF9A3C', secondary: '#FF6392', accent: '#B5FFE1', bg: '#16213E' },
        { primary: '#7B2FBE', secondary: '#EA60DA', accent: '#C0FDFB', bg: '#0F0E17' },
        { primary: '#FD3A69', secondary: '#FECD1A', accent: '#FF884B', bg: '#1A1A2E' },
    ],
    neon: [
        { primary: '#39FF14', secondary: '#FF073A', accent: '#00FFFF', bg: '#0D0D0D' },
        { primary: '#FF00FF', secondary: '#00FFFF', accent: '#FFFF00', bg: '#050505' },
        { primary: '#BF00FF', secondary: '#00FF41', accent: '#FF9900', bg: '#0a0a0a' },
        { primary: '#FF6600', secondary: '#00FFCC', accent: '#FF0099', bg: '#111111' },
    ],
    pastel: [
        { primary: '#FFB3BA', secondary: '#FFDFBA', accent: '#FFFFBA', bg: '#FFF5F5' },
        { primary: '#BAFFC9', secondary: '#BAE1FF', accent: '#FFB3DE', bg: '#F0FFF4' },
        { primary: '#C9B1FF', secondary: '#B1E8FF', accent: '#FFB1C1', bg: '#F5F0FF' },
        { primary: '#FFC8DD', secondary: '#BDE0FE', accent: '#A2D2FF', bg: '#FEFCE8' },
    ],
    monochrome: [
        { primary: '#FFFFFF', secondary: '#AAAAAA', accent: '#555555', bg: '#0A0A0A' },
        { primary: '#F5F5F5', secondary: '#CCCCCC', accent: '#888888', bg: '#111111' },
        { primary: '#111111', secondary: '#444444', accent: '#777777', bg: '#F5F5F5' },
        { primary: '#222222', secondary: '#666666', accent: '#BBBBBB', bg: '#FFFFFF' },
    ],
    golden: [
        { primary: '#FFD700', secondary: '#FFA500', accent: '#FF8C00', bg: '#1C1408' },
        { primary: '#F5C518', secondary: '#E8A400', accent: '#D4901A', bg: '#0F0A00' },
        { primary: '#FFD700', secondary: '#C0A000', accent: '#FFEC8B', bg: '#18140A' },
        { primary: '#DAA520', secondary: '#B8860B', accent: '#FFD700', bg: '#1A1200' },
    ],
    ocean: [
        { primary: '#00B4D8', secondary: '#0077B6', accent: '#90E0EF', bg: '#03045E' },
        { primary: '#48CAE4', secondary: '#023E8A', accent: '#ADE8F4', bg: '#03045E' },
        { primary: '#06D6A0', secondary: '#0496FF', accent: '#FFBC42', bg: '#0A1628' },
        { primary: '#4CC9F0', secondary: '#4361EE', accent: '#7400B8', bg: '#03045E' },
    ],
    fire: [
        { primary: '#FF4500', secondary: '#FF7519', accent: '#FFD700', bg: '#1A0500' },
        { primary: '#FF6D00', secondary: '#FF9500', accent: '#FFBE0B', bg: '#150300' },
        { primary: '#D62828', secondary: '#F77F00', accent: '#FCBF49', bg: '#1A0000' },
        { primary: '#E63946', secondary: '#457B9D', accent: '#F1FAEE', bg: '#1D3557' },
    ],
    galaxy: [
        { primary: '#7B2FBE', secondary: '#2176FF', accent: '#FF6B6B', bg: '#050510' },
        { primary: '#6A0572', secondary: '#AB83A1', accent: '#F9A620', bg: '#080016' },
        { primary: '#240046', secondary: '#7B2FBE', accent: '#FF6B9D', bg: '#03000D' },
        { primary: '#560BAD', secondary: '#480CA8', accent: '#B5179E', bg: '#03071E' },
    ],
};

const SHAPE_STYLES = ['hexagon', 'circle', 'diamond', 'shield', 'star', 'badge', 'infinity', 'arch'];
const FONT_STYLES = ['serif', 'sans', 'mono', 'display', 'cursive', 'geometric', 'rounded', 'sharp'];
const EFFECTS = ['glow', 'shadow', 'gradient', 'outline', 'emboss', 'neon', 'metallic', 'glass'];
const LAYOUT_MODES = ['centered', 'stacked', 'horizontal', 'diagonal', 'circular', 'split', 'badge', 'monogram'];
const PATTERNS = ['none', 'dots', 'lines', 'grid', 'waves', 'hexagons', 'triangles', 'circuits'];

function generateLogoConfig(name, options = {}) {
    const {
        paletteType = 'random',
        shapeStyle = 'random',
        fontStyle = 'random',
        effect = 'random',
        layoutMode = 'random',
        pattern = 'random',
    } = options;

    const pickPalette = () => {
        const keys = Object.keys(COLOR_PALETTES);
        const key = paletteType === 'random' ? keys[Math.floor(Math.random() * keys.length)] : (paletteType in COLOR_PALETTES ? paletteType : keys[0]);
        const arr = COLOR_PALETTES[key];
        return { ...arr[Math.floor(Math.random() * arr.length)], paletteName: key };
    };

    const pick = (arr, val) => val === 'random' || !arr.includes(val)
        ? arr[Math.floor(Math.random() * arr.length)]
        : val;

    const rotation = Math.random() * 360;
    const scale = 0.7 + Math.random() * 0.6;
    const shapeSize = 120 + Math.random() * 80;
    const fontSize = 24 + Math.random() * 24;
    const letterSpacing = Math.random() * 8 - 2;
    const borderRadius = Math.random() * 50;
    const strokeWidth = 1 + Math.random() * 4;
    const glowIntensity = 5 + Math.random() * 20;
    const innerRotation = Math.random() * 30 - 15;
    const decorCount = 3 + Math.floor(Math.random() * 8);
    const palette = pickPalette();
    const selectedShape = pick(SHAPE_STYLES, shapeStyle);
    const selectedFont = pick(FONT_STYLES, fontStyle);
    const selectedEffect = pick(EFFECTS, effect);
    const selectedLayout = pick(LAYOUT_MODES, layoutMode);
    const selectedPattern = pick(PATTERNS, pattern);

    const bezierCurves = Array.from({ length: 2 }, () => ({
        cx1: Math.random() * 200 - 100,
        cy1: Math.random() * 200 - 100,
        cx2: Math.random() * 200 - 100,
        cy2: Math.random() * 200 - 100,
    }));

    const hslShift = Math.floor(Math.random() * 360);

    const initials = name.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3) || name[0]?.toUpperCase() || 'L';

    return {
        id: randomUUID(),
        name,
        initials,
        palette,
        shape: selectedShape,
        fontStyle: selectedFont,
        effect: selectedEffect,
        layout: selectedLayout,
        pattern: selectedPattern,
        rotation,
        scale,
        shapeSize,
        fontSize,
        letterSpacing,
        borderRadius,
        strokeWidth,
        glowIntensity,
        innerRotation,
        decorCount,
        bezierCurves,
        hslShift,
        timestamp: Date.now(),
    };
}

module.exports = {
    COLOR_PALETTES,
    SHAPE_STYLES,
    FONT_STYLES,
    EFFECTS,
    LAYOUT_MODES,
    PATTERNS,
    generateLogoConfig,
};
