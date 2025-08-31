const Alert = require('../models/Alert');

class AlertService {
  constructor(io) {
    this.io = io;
    this.alertQueue = [];
    this.alertThresholds = {
      temperature: { min: 36.5, max: 37.5, critical: { min: 36, max: 38 } },
      co2: { min: 4.8, max: 5.2, critical: { min: 4.5, max: 5.5 } },
      humidity: { min: 82, max: 88, critical: { min: 80, max: 90 } },
      oxygen: { min: 19.5, max: 20.5, critical: { min: 19, max: 21 } },
      battery: { min: 20, critical: 10 }
    };
  }

  checkThresholds(sensorData) {
    const alerts = [];
    const { deviceId, temperature, co2, humidity, oxygen, battery } = sensorData;

    // Temperature checks
    if (temperature) {
      if (temperature < this.alertThresholds.temperature.critical.min || 
          temperature > this.alertThresholds.temperature.critical.max) {
        alerts.push({
          deviceId,
          type: 'TEMPERATURE_CRITICAL',
          message: `Critical temperature: ${temperature.toFixed(2)}°C on ${deviceId}`,
          severity: 'CRITICAL',
          value: temperature,
          threshold: this.alertThresholds.temperature.critical
        });
      } else if (temperature < this.alertThresholds.temperature.min || 
                 temperature > this.alertThresholds.temperature.max) {
        alerts.push({
          deviceId,
          type: 'TEMPERATURE_WARNING',
          message: `Temperature out of range: ${temperature.toFixed(2)}°C on ${deviceId}`,
          severity: 'WARNING',
          value: temperature,
          threshold: this.alertThresholds.temperature
        });
      }
    }

    // CO2 checks
    if (co2) {
      if (co2 < this.alertThresholds.co2.critical.min || 
          co2 > this.alertThresholds.co2.critical.max) {
        alerts.push({
          deviceId,
          type: 'CO2_CRITICAL',
          message: `Critical CO2 level: ${co2.toFixed(2)}% on ${deviceId}`,
          severity: 'CRITICAL',
          value: co2,
          threshold: this.alertThresholds.co2.critical
        });
      } else if (co2 < this.alertThresholds.co2.min || 
                 co2 > this.alertThresholds.co2.max) {
        alerts.push({
          deviceId,
          type: 'CO2_WARNING',
          message: `CO2 out of range: ${co2.toFixed(2)}% on ${deviceId}`,
          severity: 'WARNING',
          value: co2,
          threshold: this.alertThresholds.co2
        });
      }
    }

    // Humidity checks
    if (humidity) {
      if (humidity < this.alertThresholds.humidity.critical.min || 
          humidity > this.alertThresholds.humidity.critical.max) {
        alerts.push({
          deviceId,
          type: 'HUMIDITY_CRITICAL',
          message: `Critical humidity: ${humidity.toFixed(1)}% on ${deviceId}`,
          severity: 'CRITICAL',
          value: humidity,
          threshold: this.alertThresholds.humidity.critical
        });
      } else if (humidity < this.alertThresholds.humidity.min || 
                 humidity > this.alertThresholds.humidity.max) {
        alerts.push({
          deviceId,
          type: 'HUMIDITY_WARNING',
          message: `Humidity out of range: ${humidity.toFixed(1)}% on ${deviceId}`,
          severity: 'WARNING',
          value: humidity,
          threshold: this.alertThresholds.humidity
        });
      }
    }

    // Oxygen checks (for research devices)
    if (oxygen) {
      if (oxygen < this.alertThresholds.oxygen.critical.min || 
          oxygen > this.alertThresholds.oxygen.critical.max) {
        alerts.push({
          deviceId,
          type: 'OXYGEN_CRITICAL',
          message: `Critical oxygen level: ${oxygen.toFixed(1)}% on ${deviceId}`,
          severity: 'CRITICAL',
          value: oxygen,
          threshold: this.alertThresholds.oxygen.critical
        });
      } else if (oxygen < this.alertThresholds.oxygen.min || 
                 oxygen > this.alertThresholds.oxygen.max) {
        alerts.push({
          deviceId,
          type: 'OXYGEN_WARNING',
          message: `Oxygen out of range: ${oxygen.toFixed(1)}% on ${deviceId}`,
          severity: 'WARNING',
          value: oxygen,
          threshold: this.alertThresholds.oxygen
        });
      }
    }

    // Battery checks
    if (battery !== undefined) {
      if (battery < this.alertThresholds.battery.critical) {
        alerts.push({
          deviceId,
          type: 'BATTERY_CRITICAL',
          message: `Critical battery level: ${battery.toFixed(1)}% on ${deviceId}`,
          severity: 'CRITICAL',
          value: battery,
          threshold: { critical: this.alertThresholds.battery.critical }
        });
      } else if (battery < this.alertThresholds.battery.min) {
        alerts.push({
          deviceId,
          type: 'BATTERY_LOW',
          message: `Low battery: ${battery.toFixed(1)}% on ${deviceId}`,
          severity: 'WARNING',
          value: battery,
          threshold: { min: this.alertThresholds.battery.min }
        });
      }
    }

    return alerts;
  }

  triggerAlert(alertData) {
    const alert = {
      ...alertData,
      timestamp: new Date().toISOString(),
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Add to queue
    this.alertQueue.push(alert);
    
    // Keep only last 100 alerts in memory
    if (this.alertQueue.length > 100) {
      this.alertQueue.shift();
    }

    // Emit to all connected clients
    this.io.emit('alert-triggered', alert);

    // Save to database
    Alert.create(alert).catch(err => {
      console.error('Error saving alert:', err);
    });

    // Log critical alerts
    if (alert.severity === 'CRITICAL') {
      console.error(`CRITICAL ALERT: ${alert.message}`);
      // In production, this would trigger additional notifications
      // (email, SMS, Slack, etc.)
    }

    return alert;
  }

  processReading(sensorData) {
    const alerts = this.checkThresholds(sensorData);
    alerts.forEach(alert => this.triggerAlert(alert));
    return alerts;
  }

  getRecentAlerts(limit = 20) {
    return this.alertQueue.slice(-limit);
  }

  getAlertsByDevice(deviceId, limit = 10) {
    return this.alertQueue
      .filter(alert => alert.deviceId === deviceId)
      .slice(-limit);
  }

  getAlertStatistics() {
    const stats = {
      total: this.alertQueue.length,
      critical: 0,
      warning: 0,
      info: 0,
      byType: {},
      byDevice: {}
    };

    this.alertQueue.forEach(alert => {
      // Count by severity
      if (alert.severity === 'CRITICAL') stats.critical++;
      else if (alert.severity === 'WARNING') stats.warning++;
      else stats.info++;

      // Count by type
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;

      // Count by device
      stats.byDevice[alert.deviceId] = (stats.byDevice[alert.deviceId] || 0) + 1;
    });

    return stats;
  }

  clearAlerts(deviceId = null) {
    if (deviceId) {
      this.alertQueue = this.alertQueue.filter(alert => alert.deviceId !== deviceId);
    } else {
      this.alertQueue = [];
    }
    
    this.io.emit('alerts-cleared', { deviceId });
  }

  updateThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    this.io.emit('thresholds-updated', this.alertThresholds);
  }
}

module.exports = AlertService;