import React from 'react';
import { format } from 'date-fns';

const AlertPanel = ({ alerts, onAcknowledge }) => {
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'CRITICAL':
        return '🚨';
      case 'WARNING':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.severity]) {
      acc[alert.severity] = [];
    }
    acc[alert.severity].push(alert);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Alert Management Center</h2>
        <p className="text-gray-600 mb-6">
          Real-time monitoring and alert system protecting valuable research experiments. 
          Critical alerts trigger within 5 seconds of anomaly detection.
        </p>
        
        {/* Alert Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-700">
              {groupedAlerts['CRITICAL']?.length || 0}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600 mb-1">Warning</p>
            <p className="text-2xl font-bold text-yellow-700">
              {groupedAlerts['WARNING']?.length || 0}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Info</p>
            <p className="text-2xl font-bold text-blue-700">
              {groupedAlerts['INFO']?.length || 0}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Response Time</p>
            <p className="text-2xl font-bold text-green-700">&lt;5s</p>
          </div>
        </div>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">All Systems Normal</h3>
          <p className="text-gray-600">No active alerts. All incubators operating within parameters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {['CRITICAL', 'WARNING', 'INFO'].map(severity => {
            const severityAlerts = groupedAlerts[severity];
            if (!severityAlerts || severityAlerts.length === 0) return null;

            return (
              <div key={severity} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-2xl mr-2">{getSeverityIcon(severity)}</span>
                  {severity} Alerts ({severityAlerts.length})
                </h3>
                
                <div className="space-y-3">
                  {severityAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-semibold">{alert.deviceId}</span>
                            <span className="text-sm opacity-75">
                              {alert.timestamp ? format(new Date(alert.timestamp), 'HH:mm:ss') : 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">{alert.message}</p>
                          {alert.value && (
                            <p className="text-xs opacity-75">
                              Current Value: {alert.value.toFixed(2)}
                              {alert.threshold && ` (Threshold: ${JSON.stringify(alert.threshold)})`}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="ml-4 px-3 py-1 bg-white bg-opacity-50 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Response Protocol */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mt-6 text-white">
        <h3 className="text-xl font-semibold mb-4">Alert Response Protocol</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-semibold mb-2">🚨 Critical</p>
            <p className="text-sm opacity-90">
              Immediate action required. Experiment at risk. 
              Auto-notification to lab personnel.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">⚠️ Warning</p>
            <p className="text-sm opacity-90">
              Parameters approaching limits. Preventive action recommended 
              within 30 minutes.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">ℹ️ Info</p>
            <p className="text-sm opacity-90">
              System notifications and maintenance reminders. 
              Review during next lab check.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;