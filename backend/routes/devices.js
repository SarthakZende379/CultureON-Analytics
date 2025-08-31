const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');
const Alert = require('../models/Alert');

// Get all devices status
router.get('/', async (req, res) => {
  try {
    // In production, this would query from a devices table
    // For demo, returning static device configuration
    const devices = [
      { id: 'CO-STD-001', name: 'CultureON Standard - CO-STD-001', type: 'Standard', status: 'online' },
      { id: 'CO-STD-002', name: 'CultureON Standard - CO-STD-002', type: 'Standard', status: 'online' },
      { id: 'CO-PREM-001', name: 'CultureON Premium - CO-PREM-001', type: 'Premium', status: 'online' },
      { id: 'CO-PREM-002', name: 'CultureON Premium - CO-PREM-002', type: 'Premium', status: 'online' },
      { id: 'CO-RES-001', name: 'CultureON Research - CO-RES-001', type: 'Research', status: 'online' },
      { id: 'CO-RES-002', name: 'CultureON Research - CO-RES-002', type: 'Research', status: 'online' }
    ];

    // Get latest reading for each device
    const devicesWithData = await Promise.all(
      devices.map(async (device) => {
        const readings = await SensorReading.findByDevice(device.id, 1);
        const alerts = await Alert.findByDevice(device.id, 5);
        return {
          ...device,
          latestReading: readings[0] || null,
          recentAlerts: alerts
        };
      })
    );

    res.json({
      success: true,
      devices: devicesWithData
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices'
    });
  }
});

// Get specific device details
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100 } = req.query;

    const readings = await SensorReading.findByDevice(deviceId, parseInt(limit));
    const alerts = await Alert.findByDevice(deviceId, 20);
    const aggregates = await SensorReading.getAggregates(deviceId, 'hour');

    res.json({
      success: true,
      device: {
        id: deviceId,
        readings,
        alerts,
        aggregates
      }
    });
  } catch (error) {
    console.error('Error fetching device details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device details'
    });
  }
});

// Get device readings
router.get('/:deviceId/readings', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 100, startTime, endTime } = req.query;

    let readings;
    if (startTime && endTime) {
      readings = await SensorReading.findByTimeRange(startTime, endTime, deviceId);
    } else {
      readings = await SensorReading.findByDevice(deviceId, parseInt(limit));
    }

    res.json({
      success: true,
      deviceId,
      count: readings.length,
      readings
    });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch readings'
    });
  }
});

// Get device alerts
router.get('/:deviceId/alerts', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const alerts = await Alert.findByDevice(deviceId, parseInt(limit));

    res.json({
      success: true,
      deviceId,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const result = await Alert.acknowledge(alertId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert'
    });
  }
});

// Export device data as CSV
router.get('/:deviceId/export', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { startTime, endTime } = req.query;

    const csv = await SensorReading.exportToCSV(deviceId, startTime, endTime);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}_data_export.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

module.exports = router;