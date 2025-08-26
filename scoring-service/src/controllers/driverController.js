const { getUnavailableEmails } = require('../services/scheduleService');
const { getAllDrivers, getTopDriver } = require('../services/driverService');

// POST /api/request-driver
// Input: { tripDays: ["2025-09-02", ...], vehicleType: "van" }
exports.requestDriver = async (req, res, next) => {
  try {
    console.log('[DRIVER CONTROLLER] Request received:', req.body);
    const { tripDays, vehicleType } = req.body;
    
    console.log('[DRIVER CONTROLLER] Validating input - tripDays:', tripDays, 'vehicleType:', vehicleType);
    if (!tripDays || !Array.isArray(tripDays) || !vehicleType) {
      console.log('[DRIVER CONTROLLER] Validation failed - invalid input');
      return res.status(400).json({ error: 'tripDays (array) and vehicleType are required' });
    }
    
    console.log('[DRIVER CONTROLLER] Getting unavailable drivers for dates:', tripDays);
    // Get unavailable drivers
    const unavailable = await getUnavailableEmails('driver', tripDays);
    console.log('[DRIVER CONTROLLER] Unavailable drivers:', unavailable);
    
    console.log('[DRIVER CONTROLLER] Fetching all drivers from database');
    // Get all drivers
    const allDrivers = await getAllDrivers();
    console.log('[DRIVER CONTROLLER] Total drivers found:', allDrivers.length);
    
    console.log('[DRIVER CONTROLLER] Filtering drivers by availability and vehicle type');
    // Filter by vehicleType if needed (assume field exists)
    const filtered = allDrivers.filter(d => !unavailable.includes(d.email) && (!d.vehicle_type || d.vehicle_type === vehicleType));
    console.log('[DRIVER CONTROLLER] Available drivers after filtering:', filtered.length);
    
    if (!filtered.length) {
      console.log('[DRIVER CONTROLLER] No available drivers found');
      return res.status(404).json({ error: 'No available drivers' });
    }
    
    console.log('[DRIVER CONTROLLER] Finding top driver from available drivers');
    // Get top driver
    const top = await getTopDriver(filtered.map(d => d.email));
    
    if (!top) {
      console.log('[DRIVER CONTROLLER] No top driver found');
      return res.status(404).json({ error: 'No available drivers' });
    }
    
    console.log('[DRIVER CONTROLLER] Top driver selected:', top.email);
    res.json({ email: top.email });
  } catch (err) {
    console.log('[DRIVER CONTROLLER] Error occurred:', err.message);
    next(err);
  }
};
