const { getUnavailableEmails } = require('../services/scheduleService');
const { getAllGuides, getTopGuide } = require('../services/guideService');

// POST /api/request-guide
// Input: { tripDays: ["2025-09-02", ...] }
exports.requestGuide = async (req, res, next) => {
  try {
    console.log('[GUIDE CONTROLLER] Request received:', req.body);
    const { tripDays } = req.body;
    
    console.log('[GUIDE CONTROLLER] Validating input - tripDays:', tripDays);
    if (!tripDays || !Array.isArray(tripDays)) {
      console.log('[GUIDE CONTROLLER] Validation failed - invalid tripDays');
      return res.status(400).json({ error: 'tripDays (array) is required' });
    }
    
    console.log('[GUIDE CONTROLLER] Getting unavailable guides for dates:', tripDays);
    // Get unavailable guides
    const unavailable = await getUnavailableEmails('guide', tripDays);
    console.log('[GUIDE CONTROLLER] Unavailable guides:', unavailable);
    
    console.log('[GUIDE CONTROLLER] Fetching all guides from database');
    // Get all guides
    const allGuides = await getAllGuides();
    console.log('[GUIDE CONTROLLER] Total guides found:', allGuides.length);
    
    console.log('[GUIDE CONTROLLER] Filtering guides by availability');
    // Filter available
    const filtered = allGuides.filter(g => !unavailable.includes(g.email));
    console.log('[GUIDE CONTROLLER] Available guides after filtering:', filtered.length);
    
    if (!filtered.length) {
      console.log('[GUIDE CONTROLLER] No available guides found');
      return res.status(404).json({ error: 'No available guides' });
    }
    
    console.log('[GUIDE CONTROLLER] Finding top guide from available guides');
    // Get top guide
    const top = await getTopGuide(filtered.map(g => g.email));
    
    if (!top) {
      console.log('[GUIDE CONTROLLER] No top guide found');
      return res.status(404).json({ error: 'No available guides' });
    }
    
    console.log('[GUIDE CONTROLLER] Top guide selected:', top.email);
    res.json({ email: top.email });
  } catch (err) {
    console.log('[GUIDE CONTROLLER] Error occurred:', err.message);
    next(err);
  }
};
