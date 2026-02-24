/**
 * Vercel Serverless Function: GET /api/palettes
 * Returns available color palette types.
 */
const { COLOR_PALETTES } = require('./_lib/logoConfig');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const info = Object.entries(COLOR_PALETTES).map(([key, arr]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        preview: arr[0],
    }));

    return res.status(200).json(info);
};
