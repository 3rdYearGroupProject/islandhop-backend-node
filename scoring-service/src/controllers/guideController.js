const { getUnavailableEmails } = require('../services/scheduleService');
const { getAllGuides, getTopGuide } = require('../services/guideService');

// POST /api/request-guide
// Input: { tripDays: ["2025-09-02", ...] }
exports.requestGuide = async (req, res, next) => {
  try {
    const { tripDays } = req.body;
    if (!tripDays || !Array.isArray(tripDays)) {
      return res.status(400).json({ error: 'tripDays (array) is required' });
    }
    // Get unavailable guides
    const unavailable = await getUnavailableEmails('guide', tripDays);
    // Get all guides
    const allGuides = await getAllGuides();
    // Filter available
    const filtered = allGuides.filter(g => !unavailable.includes(g.email));
    if (!filtered.length) return res.status(404).json({ error: 'No available guides' });
    // Get top guide
    const top = await getTopGuide(filtered.map(g => g.email));
    if (!top) return res.status(404).json({ error: 'No available guides' });
    res.json({ email: top.email });
  } catch (err) {
    next(err);
  }
};
