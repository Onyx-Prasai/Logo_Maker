/**
 * Vercel Serverless Function: POST /api/generate
 * Generates logo configs for a given brand name.
 */
const { generateLogoConfig } = require('./_lib/logoConfig');

module.exports = async function handler(req, res) {
    // CORS headers for browser requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, count = 9, filters = {} } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'A logo name is required.' });
        }

        const trimmed = name.trim().slice(0, 50);
        const logos = Array.from(
            { length: Math.min(Math.max(1, parseInt(count, 10) || 9), 12) },
            () => generateLogoConfig(trimmed, filters)
        );

        return res.status(200).json({ logos, name: trimmed });
    } catch (err) {
        console.error('[/api/generate]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
