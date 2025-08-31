const EventEmitter = require('events');
const Device = require('../models/Device');
const SensorReading = require('../models/SensorReading');

class DataGenerator extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.devices = this.initializeDevices();
    this.interval = null;
    this.batteryDegradationRate = 0.001; // Battery degrades 0.1% per cycle
    this.anomalyProbability = 0.05; // 5% chance of anomaly
    this.offlineProbability = 0.001; // 0.1% chance of going offline
  }

  initializeDevices() {
    return [
      new Device('CO-STD-001', 'Standard', { temp: 37.0, co2: 5.0, humidity: 85, battery: 100, precision: { temp: 0.3, co2: 0.2, humidity: 3 }, maxBattery: 8 }),
      new Device('CO-STD-002', 'Standard', { temp: 37.0, co2: 5.0, humidity: 85, battery: 100, precision: { temp: 0.3, co2: 0.2, humidity: 3 }, maxBattery: 8 }),
      new Device('CO-PREM-001', 'Premium', { temp: 37.0, co2: 5.0, humidity: 85, battery: 100, precision: { temp: 0.1, co2: 0.1, humidity: 2 }, maxBattery: 12 }),
      new Device('CO-PREM-002', 'Premium', { temp: 37.0, co2: 5.0, humidity: 85, battery: 100, precision: { temp: 0.1, co2: 0.1, humidity: 2 }, maxBattery: 12 }),
      new Device('CO-RES-001', 'Research', { temp: 37.0, co2: 5.0, humidity: 85, oxygen: 20, battery: 100, precision: { temp: 0.05, co2: 0.05, humidity: 1, oxygen: 0.5 }, maxBattery: 24 }),
      new Device('CO-RES-002', 'Research', { temp: 37.0, co2: 5.0, humidity: 85, oxygen: 20, battery: 100, precision: { temp: 0.05, co2: 0.05, humidity: 1, oxygen: 0.5 }, maxBattery: 24 })
    ];
  }

  // Gaussian random number generator (Box-Muller transform)
  gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }

  generateSensorData(device) {
    const baseValues = device.baseValues;
    const precision = baseValues.precision;
    
    // Check if device should go offline
    if (device.status === 'online' && Math.random() < this.offlineProbability) {
      device.status = 'offline';
      this.io.emit('device-status', { deviceId: device.id, status: 'offline' });
      return null;
    }
    
    // Check if offline device should come back online
    if (device.status === 'offline' && Math.random() < 0.1) {
      device.status = 'online';
      this.io.emit('device-status', { deviceId: device.id, status: 'online' });
    }
    
    if (device.status === 'offline') {
      return null;
    }

    // Generate sensor readings with Gaussian noise
    let data = {
      deviceId: device.id,
      temperature: this.gaussianRandom(baseValues.temp, precision.temp / 3),
      co2: this.gaussianRandom(baseValues.co2, precision.co2 / 3),
      humidity: this.gaussianRandom(baseValues.humidity, precision.humidity / 3),
      battery: Math.max(0, baseValues.battery - (this.batteryDegradationRate * baseValues.maxBattery)),
      timestamp: new Date().toISOString()
    };

    // Add oxygen for research-grade devices
    if (device.type === 'Research') {
      data.oxygen = this.gaussianRandom(baseValues.oxygen, precision.oxygen / 3);
    }

    // Inject anomalies
    if (Math.random() < this.anomalyProbability) {
      const anomalyType = Math.random();
      if (anomalyType < 0.5) {
        // Temperature spike
        data.temperature += this.gaussianRandom(2, 0.5);
        data.anomaly = 'temperature_spike';
      } else if (anomalyType < 0.8) {
        // CO2 drift
        data.co2 += this.gaussianRandom(1, 0.3);
        data.anomaly = 'co2_drift';
      } else {
        // Humidity fluctuation
        data.humidity += this.gaussianRandom(5, 2);
        data.anomaly = 'humidity_fluctuation';
      }
    }

    // Update battery level
    baseValues.battery = data.battery;

    // Ensure values stay within realistic bounds
    data.temperature = Math.max(35, Math.min(40, data.temperature));
    data.co2 = Math.max(3, Math.min(7, data.co2));
    data.humidity = Math.max(70, Math.min(95, data.humidity));
    if (data.oxygen !== undefined) {
      data.oxygen = Math.max(18, Math.min(22, data.oxygen));
    }

    // Store in history
    device.addReading(data);

    return data;
  }

  simulateDoorOpening(deviceId) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device || device.status === 'offline') {
      return null;
    }

    // Create temperature spike
    const spikeData = {
      deviceId: device.id,
      temperature: device.baseValues.temp + this.gaussianRandom(3, 0.5),
      co2: device.baseValues.co2 + this.gaussianRandom(0.5, 0.1),
      humidity: device.baseValues.humidity - this.gaussianRandom(5, 1),
      battery: device.baseValues.battery,
      timestamp: new Date().toISOString(),
      anomaly: 'door_opened'
    };

    if (device.type === 'Research') {
      spikeData.oxygen = device.baseValues.oxygen + this.gaussianRandom(0.3, 0.1);
    }

    // Emit the anomaly data
    this.io.emit('sensor-data', spikeData);
    device.addReading(spikeData);

    // Gradually recover to normal over next few readings
    device.recovering = true;
    device.recoverySteps = 5;

    return spikeData;
  }

  startGeneration() {
    console.log('Starting data generation...');
    
    // Generate data every 5 seconds
    this.interval = setInterval(() => {
      const allReadings = [];
      
      this.devices.forEach(device => {
        // Handle recovery from anomaly
        if (device.recovering) {
          device.recoverySteps--;
          if (device.recoverySteps <= 0) {
            device.recovering = false;
          }
        }

        const data = this.generateSensorData(device);
        if (data) {
          allReadings.push(data);
          
          // Save to database
          SensorReading.create(data).catch(err => {
            console.error('Error saving sensor reading:', err);
          });
        }
      });

      // Emit all readings at once
      if (allReadings.length > 0) {
        this.io.emit('sensor-data-batch', allReadings);
      }
    }, 5000);
  }

  stopGeneration() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('Data generation stopped');
    }
  }

  getCurrentState() {
    return {
      devices: this.devices.map(device => ({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        currentReadings: device.getLatestReading(),
        recentHistory: device.getRecentHistory(20)
      }))
    };
  }

  handleDeviceCommand(command) {
    const { deviceId, action, params } = command;
    const device = this.devices.find(d => d.id === deviceId);
    
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    switch (action) {
      case 'reset_battery':
        device.baseValues.battery = 100;
        return { success: true, message: 'Battery reset' };
      
      case 'toggle_status':
        device.status = device.status === 'online' ? 'offline' : 'online';
        this.io.emit('device-status', { deviceId, status: device.status });
        return { success: true, message: `Device ${device.status}` };
      
      case 'calibrate':
        // Reset to baseline values
        device.baseValues = { ...device.constructor.getBaseValues(device.type) };
        return { success: true, message: 'Device calibrated' };
      
      default:
        return { success: false, message: 'Unknown command' };
    }
  }
}

module.exports = DataGenerator;