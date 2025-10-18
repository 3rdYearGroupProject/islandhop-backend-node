const Location = require('../models/Location');
const fetchProfile = require('../utils/fetchProfile');

exports.checkLocationShared = async (req, res) => {
  const { tripId, userId, date } = req.query;
  
  console.log(`[checkLocationShared] Query params - tripId: ${tripId}, userId: ${userId}, date: ${date}`);
  
  if (!tripId || !userId) {
    return res.status(400).json({ error: 'Missing required query parameters: tripId, userId.' });
  }

  // Determine date range
  let startOfDay, endOfDay;
  if (date) {
    // Use provided date (YYYY-MM-DD)
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
  } else {
    // Default to today
    startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
  }

  console.log(`[checkLocationShared] Date range - start: ${startOfDay.toISOString()}, end: ${endOfDay.toISOString()}`);

  try {
    const location = await Location.findOne({
      tripId,
      userId,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });
    
    console.log(`[checkLocationShared] Found location: ${location ? 'YES' : 'NO'}`);
    
    if (location) {
      return res.status(200).json({ shared: true, data: location });
    } else {
      return res.status(200).json({ shared: false, data: null });
    }
  } catch (err) {
    console.error(`[checkLocationShared] Error:`, err);
    res.status(500).json({ error: 'Failed to check location.' });
  }
};

exports.getUsersAtLocation = async (req, res) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Missing latitude or longitude.' });
  }

  // Get today's date range
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Find all users who shared the same location today, including profile fields
    const users = await Location.find({
      latitude: Number(latitude),
      longitude: Number(longitude),
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }, 'userId tripId timestamp email firstName lastName dob nationality languages profilePic profileCompletion');
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

exports.shareLocation = async (req, res) => {
  const { tripId, userId, latitude, longitude, email } = req.body;
  if (!tripId || !userId || !latitude || !longitude || !email) {
    return res.status(400).json({ error: 'Missing required fields (tripId, userId, latitude, longitude, email).' });
  }

  // Get today's date range
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Fetch user profile from Java service
    const profile = await fetchProfile(email);

    // Find if a location already exists for this user/trip/today
    const existingToday = await Location.findOne({
      tripId,
      userId,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const profileFields = profile ? {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      dob: profile.dob,
      nationality: profile.nationality,
      languages: profile.languages,
      profilePic: profile.profilePic,
      profileCompletion: profile.profileCompletion
    } : {};

    const now = new Date();
    console.log(`[shareLocation] Current server time: ${now.toISOString()}`);

    if (existingToday) {
      // Update the existing location for today
      console.log(`[shareLocation] Updating existing location from today`);
      existingToday.latitude = latitude;
      existingToday.longitude = longitude;
      existingToday.timestamp = now;
      Object.assign(existingToday, profileFields);
      await existingToday.save();
      return res.status(200).json({ message: 'Location updated for today.', data: existingToday });
    } else {
      // Check if there's an old location to update or create new
      const anyExisting = await Location.findOne({ tripId, userId }).sort({ timestamp: -1 });
      
      if (anyExisting && anyExisting.timestamp < startOfDay) {
        // Update old location with today's timestamp
        console.log(`[shareLocation] Updating old location to today`);
        anyExisting.latitude = latitude;
        anyExisting.longitude = longitude;
        anyExisting.timestamp = now;
        Object.assign(anyExisting, profileFields);
        await anyExisting.save();
        return res.status(200).json({ message: 'Location updated for today.', data: anyExisting });
      } else {
        // Create new location entry
        console.log(`[shareLocation] Creating new location`);
        const location = new Location({ tripId, userId, latitude, longitude, timestamp: now, ...profileFields });
        await location.save();
        return res.status(201).json({ message: 'Location shared and saved.', data: location });
      }
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save location.' });
  }
};
