const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/cultureon.db');
const db = new sqlite3.Database(dbPath);

class Alert {
  static create(data) {
    return new Promise((resolve, reject) => {
      const {
        deviceId,
        type,
        message,
        severity,
        value,
        threshold,
        timestamp
      } = data;

      const sql = `
        INSERT INTO alerts 
        (device_id, type, message, severity, value, threshold, timestamp, acknowledged)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `;

      db.run(
        sql,
        [
          deviceId,
          type,
          message,
          severity,
          value,
          JSON.stringify(threshold || {}),
          timestamp || new Date().toISOString()
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...data, acknowledged: false });
          }
        }
      );
    });
  }

  static findByDevice(deviceId, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM alerts 
        WHERE device_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      db.all(sql, [deviceId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse threshold JSON
          resolve(rows.map(row => ({
            ...row,
            threshold: row.threshold ? JSON.parse(row.threshold) : null
          })));
        }
      });
    });
  }

  static findUnacknowledged() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM alerts 
        WHERE acknowledged = 0 
        ORDER BY timestamp DESC
      `;

      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            threshold: row.threshold ? JSON.parse(row.threshold) : null
          })));
        }
      });
    });
  }

  static findBySeverity(severity, limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM alerts 
        WHERE severity = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      db.all(sql, [severity, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            threshold: row.threshold ? JSON.parse(row.threshold) : null
          })));
        }
      });
    });
  }

  static acknowledge(alertId) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE alerts 
        SET acknowledged = 1, acknowledged_at = ? 
        WHERE id = ?
      `;

      db.run(sql, [new Date().toISOString(), alertId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: alertId, acknowledged: true, changes: this.changes });
        }
      });
    });
  }

  static acknowledgeMultiple(alertIds) {
    return new Promise((resolve, reject) => {
      const placeholders = alertIds.map(() => '?').join(',');
      const sql = `
        UPDATE alerts 
        SET acknowledged = 1, acknowledged_at = ? 
        WHERE id IN (${placeholders})
      `;

      db.run(sql, [new Date().toISOString(), ...alertIds], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ acknowledged: alertIds, changes: this.changes });
        }
      });
    });
  }

  static getStatistics(startTime = null, endTime = null) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN severity = 'WARNING' THEN 1 ELSE 0 END) as warning,
          SUM(CASE WHEN severity = 'INFO' THEN 1 ELSE 0 END) as info,
          SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged,
          device_id,
          type
        FROM alerts
      `;

      const params = [];
      const conditions = [];

      if (startTime) {
        conditions.push('timestamp >= ?');
        params.push(startTime);
      }

      if (endTime) {
        conditions.push('timestamp <= ?');
        params.push(endTime);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' GROUP BY device_id, type';

      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Aggregate statistics
          const stats = {
            total: 0,
            critical: 0,
            warning: 0,
            info: 0,
            unacknowledged: 0,
            byDevice: {},
            byType: {}
          };

          rows.forEach(row => {
            stats.total += row.total;
            stats.critical += row.critical;
            stats.warning += row.warning;
            stats.info += row.info;
            stats.unacknowledged += row.unacknowledged;

            if (!stats.byDevice[row.device_id]) {
              stats.byDevice[row.device_id] = 0;
            }
            stats.byDevice[row.device_id] += row.total;

            if (!stats.byType[row.type]) {
              stats.byType[row.type] = 0;
            }
            stats.byType[row.type] += row.total;
          });

          resolve(stats);
        }
      });
    });
  }

  static deleteOld(daysToKeep = 30) {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const sql = `
        DELETE FROM alerts 
        WHERE timestamp < ? AND acknowledged = 1
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
}

module.exports = Alert;