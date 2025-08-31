const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/cultureon.db');
const db = new sqlite3.Database(dbPath);

class SensorReading {
  static create(data) {
    return new Promise((resolve, reject) => {
      const {
        deviceId,
        temperature,
        co2,
        humidity,
        oxygen,
        battery,
        timestamp
      } = data;

      const sql = `
        INSERT INTO sensor_readings 
        (device_id, temperature, co2, humidity, oxygen, battery, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [deviceId, temperature, co2, humidity, oxygen || null, battery, timestamp || new Date().toISOString()],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...data });
          }
        }
      );
    });
  }

  static findByDevice(deviceId, limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM sensor_readings 
        WHERE device_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      db.all(sql, [deviceId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.reverse()); // Return in chronological order
        }
      });
    });
  }

  static findRecent(limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM sensor_readings 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static findByTimeRange(startTime, endTime, deviceId = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM sensor_readings 
        WHERE timestamp >= ? AND timestamp <= ?
      `;
      const params = [startTime, endTime];

      if (deviceId) {
        sql += ' AND device_id = ?';
        params.push(deviceId);
      }

      sql += ' ORDER BY timestamp ASC';

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static getAggregates(deviceId, interval = 'hour') {
    return new Promise((resolve, reject) => {
      // SQLite datetime functions for different intervals
      const intervalFormats = {
        'minute': '%Y-%m-%d %H:%M',
        'hour': '%Y-%m-%d %H',
        'day': '%Y-%m-%d',
        'week': '%Y-%W',
        'month': '%Y-%m'
      };

      const format = intervalFormats[interval] || intervalFormats['hour'];

      const sql = `
        SELECT 
          strftime('${format}', timestamp) as period,
          AVG(temperature) as avg_temperature,
          MIN(temperature) as min_temperature,
          MAX(temperature) as max_temperature,
          AVG(co2) as avg_co2,
          MIN(co2) as min_co2,
          MAX(co2) as max_co2,
          AVG(humidity) as avg_humidity,
          MIN(humidity) as min_humidity,
          MAX(humidity) as max_humidity,
          AVG(oxygen) as avg_oxygen,
          MIN(oxygen) as min_oxygen,
          MAX(oxygen) as max_oxygen,
          AVG(battery) as avg_battery,
          COUNT(*) as reading_count
        FROM sensor_readings
        WHERE device_id = ?
        GROUP BY period
        ORDER BY period DESC
        LIMIT 100
      `;

      db.all(sql, [deviceId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static deleteOld(daysToKeep = 7) {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const sql = `
        DELETE FROM sensor_readings 
        WHERE timestamp < ?
      `;

      db.run(sql, [cutoffDate.toISOString()], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }

  static exportToCSV(deviceId = null, startTime = null, endTime = null) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM sensor_readings WHERE 1=1';
      const params = [];

      if (deviceId) {
        sql += ' AND device_id = ?';
        params.push(deviceId);
      }

      if (startTime) {
        sql += ' AND timestamp >= ?';
        params.push(startTime);
      }

      if (endTime) {
        sql += ' AND timestamp <= ?';
        params.push(endTime);
      }

      sql += ' ORDER BY timestamp ASC';

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Convert to CSV format
          if (rows.length === 0) {
            resolve('');
            return;
          }

          const headers = Object.keys(rows[0]).join(',');
          const csvRows = rows.map(row => 
            Object.values(row).map(val => 
              val === null ? '' : val
            ).join(',')
          );

          const csv = [headers, ...csvRows].join('\n');
          resolve(csv);
        }
      });
    });
  }
}

module.exports = SensorReading;