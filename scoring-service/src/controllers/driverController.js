const { getUnavailableEmails } = require('../services/scheduleService');
const { getAllDrivers, getTopDriver } = require('../services/driverService');

// POST /api/request-driver
// Input: { tripDays: ["2025-09-02", ...], vehicleType: "van" }
exports.requestDriver = async (req, res, next) => {
  try {
    const { tripDays, vehicleType } = req.body;
    if (!tripDays || !Array.isArray(tripDays) || !vehicleType) {
      return res.status(400).json({ error: 'tripDays (array) and vehicleType are required' });
    }
    // Get unavailable drivers
    const unavailable = await getUnavailableEmails('driver', tripDays);
    // Get all drivers
    const allDrivers = await getAllDrivers();
    // Filter by vehicleType if needed (assume field exists)
    const filtered = allDrivers.filter(d => !unavailable.includes(d.email) && (!d.vehicle_type || d.vehicle_type === vehicleType));
    if (!filtered.length) return res.status(404).json({ error: 'No available drivers' });
    // Get top driver
    const top = await getTopDriver(filtered.map(d => d.email));
    if (!top) return res.status(404).json({ error: 'No available drivers' });
    res.json({ email: top.email });
  } catch (err) {
    next(err);
  }
};
