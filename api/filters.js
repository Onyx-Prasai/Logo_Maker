/**
 * Vercel Serverless Function: GET /api/filters
 * Returns all filter options for the logo designer.
 */
const {
    COLOR_PALETTES,
    SHAPE_STYLES,
    FONT_STYLES,
    EFFECTS,
    LAYOUT_MODES,
    PATTERNS,
} = require('./_lib/logoConfig');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(200).json({
        palettes: Object.keys(COLOR_PALETTES),
        shapes: SHAPE_STYLES,
        fonts: FONT_STYLES,
        effects: EFFECTS,
        layouts: LAYOUT_MODES,
        patterns: PATTERNS,
    });
};
