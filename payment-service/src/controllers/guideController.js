const Guide = require('../models/guide');
const path = require('path');

const guideController = {
  // POST /guide - Create a new guide entry
  createGuide: async (req, res) => {
    try {
      const { tripId, guideEmail, cost } = req.body;

      // Validation
      if (!tripId || !guideEmail || cost === undefined || cost === null) {
        return res.status(400).json({
          success: false,
          error: 'tripId, guideEmail, and cost are required'
        });
      }

      if (typeof cost !== 'number' || cost < 0) {
        return res.status(400).json({
          success: false,
          error: 'cost must be a non-negative number'
        });
      }

      // Check if guide entry already exists for this tripId
      const existingGuide = await Guide.findOne({ tripId });
      if (existingGuide) {
        return res.status(409).json({
          success: false,
          error: 'Guide entry already exists for this tripId'
        });
      }

      // Create new guide entry
      const guide = new Guide({
        tripId,
        guideEmail: guideEmail.toLowerCase().trim(),
        cost,
        paid: 0
      });

      await guide.save();

      res.status(201).json({
        success: true,
        message: 'Guide entry created successfully',
        data: guide
      });
    } catch (error) {
      console.error('Error creating guide entry:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Guide entry already exists for this tripId'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create guide entry',
        message: error.message
      });
    }
  },

  // PUT /guide/pay/:tripId - Update guide payment status with evidence
  payGuide: async (req, res) => {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({
          success: false,
          error: 'tripId is required'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Evidence file is required'
        });
      }

      // Find guide entry
      const guide = await Guide.findOne({ tripId });
      if (!guide) {
        return res.status(404).json({
          success: false,
          error: 'Guide entry not found for this tripId'
        });
      }

      // Update guide payment status and evidence
      const evidenceUrl = `/uploads/${req.file.filename}`;
      guide.paid = 1;
      guide.evidence = evidenceUrl;
      await guide.save();

      res.status(200).json({
        success: true,
        message: 'Guide payment updated successfully',
        data: guide
      });
    } catch (error) {
      console.error('Error updating guide payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update guide payment',
        message: error.message
      });
    }
  },

  // GET /guide/:tripId - Get guide details by tripId
  getGuideByTripId: async (req, res) => {
    try {
      const { tripId } = req.params;

      const guide = await Guide.findOne({ tripId });
      if (!guide) {
        return res.status(404).json({
          success: false,
          error: 'Guide entry not found for this tripId'
        });
      }

      res.status(200).json({
        success: true,
        data: guide
      });
    } catch (error) {
      console.error('Error getting guide:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve guide',
        message: error.message
      });
    }
  },

  // GET /guide - Get all guides
  getAllGuides: async (req, res) => {
    try {
      const { paid } = req.query;
      let filter = {};
      
      if (paid !== undefined) {
        filter.paid = parseInt(paid);
      }

      const guides = await Guide.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: guides.length,
        data: guides
      });
    } catch (error) {
      console.error('Error getting guides:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve guides',
        message: error.message
      });
    }
  }
};

module.exports = guideController;
