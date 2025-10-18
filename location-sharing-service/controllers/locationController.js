// ...existing code...

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

const Location = require('../models/Location');

const fetchProfile = require('../utils/fetchProfile');

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
    const existing = await Location.findOne({
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

    if (existing) {
      // Update the existing location
      existing.latitude = latitude;
      existing.longitude = longitude;
      existing.timestamp = new Date();
      Object.assign(existing, profileFields);
      await existing.save();
      return res.status(200).json({ message: 'Location updated for today.', data: existing });
    } else {
      // Create new location entry
      const location = new Location({ tripId, userId, latitude, longitude, ...profileFields });
      await location.save();
      return res.status(201).json({ message: 'Location shared and saved.', data: location });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save location.' });
  }
};
