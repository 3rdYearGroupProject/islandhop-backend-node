const GuideSyncService = require('../services/GuideSyncService');

const guideSyncService = new GuideSyncService();

// Initialize guide sync service
const initializeGuideSync = async () => {
  try {
    const initialized = await guideSyncService.initialize();
    if (initialized) {
      guideSyncService.startMonitoring();
      console.log('✅ Guide Sync Service initialized and started successfully');
    } else {
      console.log('⚠️ Guide Sync Service initialization failed, but service will continue');
    }
    return initialized;
  } catch (error) {
    console.error('❌ Guide Sync Service initialization error:', error.message);
    return false;
  }
};

// Get guide sync status
const getGuideSyncStatus = async (req, res) => {
  try {
    const status = await guideSyncService.getStatus();
    const payments = await guideSyncService.getTotalGuidePayments();
    
    res.json({
      success: true,
      guideSyncStatus: status,
      guidePaymentsSummary: payments,
      message: 'Guide sync service status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting guide sync status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get guide sync status',
      details: error.message
    });
  }
};

// Manual guide sync trigger
const triggerManualGuideSync = async (req, res) => {
  try {
    const result = await guideSyncService.manualSync();
    
    res.json({
      success: true,
      result: result,
      message: 'Manual guide sync triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering manual guide sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger manual guide sync',
      details: error.message
    });
  }
};

// Full guide sync (sync all paid tours)
const triggerFullGuideSync = async (req, res) => {
  try {
    const result = await guideSyncService.syncAllPaidTours();
    
    res.json({
      success: true,
      result: result,
      message: 'Full guide sync completed'
    });
  } catch (error) {
    console.error('Error triggering full guide sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger full guide sync',
      details: error.message
    });
  }
};

// Get all guide payments from payment-service
const getAllGuidePayments = async (req, res) => {
  try {
    const payments = await guideSyncService.getTotalGuidePayments();
    
    if (!payments) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve guide payments'
      });
    }
    
    res.json({
      success: true,
      data: payments,
      message: 'Guide payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting guide payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get guide payments',
      details: error.message
    });
  }
};

// Verify synced tours in Guide_info collection
const verifyGuideSyncResults = async (req, res) => {
  try {
    const result = await guideSyncService.getGuideInfoSyncedTours();
    
    res.json({
      success: true,
      data: result,
      message: 'Guide_info synced tours retrieved successfully'
    });
  } catch (error) {
    console.error('Error verifying guide sync results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify guide sync results',
      details: error.message
    });
  }
};

module.exports = {
  initializeGuideSync,
  getGuideSyncStatus,
  triggerManualGuideSync,
  triggerFullGuideSync,
  getAllGuidePayments,
  verifyGuideSyncResults
};