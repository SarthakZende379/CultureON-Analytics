class Device {
  constructor(id, type, baseValues) {
    this.id = id;
    this.name = `CultureON ${type} - ${id}`;
    this.type = type;
    this.status = 'online';
    this.baseValues = baseValues;
    this.readingHistory = [];
    this.maxHistorySize = 100;
    this.createdAt = new Date().toISOString();
    this.lastUpdated = new Date().toISOString();
    this.recovering = false;
    this.recoverySteps = 0;
  }

  static getBaseValues(type) {
    const baseConfigs = {
      'Standard': {
        temp: 37.0,
        co2: 5.0,
        humidity: 85,
        battery: 100,
        precision: { temp: 0.3, co2: 0.2, humidity: 3 },
        maxBattery: 8
      },
      'Premium': {
        temp: 37.0,
        co2: 5.0,
        humidity: 85,
        battery: 100,
        precision: { temp: 0.1, co2: 0.1, humidity: 2 },
        maxBattery: 12
      },
      'Research': {
        temp: 37.0,
        co2: 5.0,
        humidity: 85,
        oxygen: 20,
        battery: 100,
        precision: { temp: 0.05, co2: 0.05, humidity: 1, oxygen: 0.5 },
        maxBattery: 24
      }
    };
    
    return baseConfigs[type] || baseConfigs['Standard'];
  }

  addReading(reading) {
    this.readingHistory.push(reading);
    
    // Maintain history size limit
    if (this.readingHistory.length > this.maxHistorySize) {
      this.readingHistory.shift();
    }
    
    this.lastUpdated = new Date().toISOString();
  }

  getLatestReading() {
    if (this.readingHistory.length === 0) {
      // Return default values if no readings yet
      return {
        temperature: this.baseValues.temp,
        co2: this.baseValues.co2,
        humidity: this.baseValues.humidity,
        oxygen: this.type === 'Research' ? this.baseValues.oxygen : undefined,
        battery: this.baseValues.battery,
        timestamp: this.lastUpdated
      };
    }
    return this.readingHistory[this.readingHistory.length - 1];
  }

  getRecentHistory(count = 20) {
    return this.readingHistory.slice(-count);
  }

  getStatistics() {
    if (this.readingHistory.length === 0) {
      return null;
    }

    const stats = {
      temperature: { min: Infinity, max: -Infinity, avg: 0, stdDev: 0 },
      co2: { min: Infinity, max: -Infinity, avg: 0, stdDev: 0 },
      humidity: { min: Infinity, max: -Infinity, avg: 0, stdDev: 0 },
      battery: { min: Infinity, max: -Infinity, avg: 0, stdDev: 0 }
    };

    if (this.type === 'Research') {
      stats.oxygen = { min: Infinity, max: -Infinity, avg: 0, stdDev: 0 };
    }

    // Calculate min, max, and sum
    const sums = {};
    Object.keys(stats).forEach(key => {
      sums[key] = 0;
    });

    this.readingHistory.forEach(reading => {
      Object.keys(stats).forEach(key => {
        if (reading[key] !== undefined) {
          stats[key].min = Math.min(stats[key].min, reading[key]);
          stats[key].max = Math.max(stats[key].max, reading[key]);
          sums[key] += reading[key];
        }
      });
    });

    // Calculate averages
    Object.keys(stats).forEach(key => {
      stats[key].avg = sums[key] / this.readingHistory.length;
    });

    // Calculate standard deviation
    Object.keys(stats).forEach(key => {
      let sumSquaredDiff = 0;
      this.readingHistory.forEach(reading => {
        if (reading[key] !== undefined) {
          sumSquaredDiff += Math.pow(reading[key] - stats[key].avg, 2);
        }
      });
      stats[key].stdDev = Math.sqrt(sumSquaredDiff / this.readingHistory.length);
    });

    return stats;
  }

  getUptime() {
    const created = new Date(this.createdAt);
    const now = new Date();
    const uptimeMs = now - created;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, totalMs: uptimeMs };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      currentReadings: this.getLatestReading(),
      statistics: this.getStatistics(),
      uptime: this.getUptime(),
      createdAt: this.createdAt,
      lastUpdated: this.lastUpdated
    };
  }
}

module.exports = Device;