import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DeviceCard = ({ device, onSimulateDoorOpening }) => {
  const [history, setHistory] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Initialize with some historical data
    if (device.latestReading) {
      setHistory(prev => [...prev, device.latestReading].slice(-20));
    }
  }, [device.latestReading]);

  const handleSimulate = () => {
    setIsSimulating(true);
    onSimulateDoorOpening(device.id);
    setTimeout(() => setIsSimulating(false), 3000);
  };

  const getStatusColor = (status) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
  };

  const getValueColor = (value, type) => {
    const thresholds = {
      temperature: { min: 36.5, max: 37.5, critical: { min: 36, max: 38 } },
      co2: { min: 4.8, max: 5.2, critical: { min: 4.5, max: 5.5 } },
      humidity: { min: 82, max: 88, critical: { min: 80, max: 90 } }
    };

    const threshold = thresholds[type];
    if (!threshold) return 'text-gray-700';

    if (value < threshold.critical.min || value > threshold.critical.max) {
      return 'text-red-600';
    } else if (value < threshold.min || value > threshold.max) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  const getBatteryIcon = (level) => {
    if (level > 60) return '🔋';
    if (level > 30) return '🔋';
    if (level > 10) return '🪫';
    return '🪫';
  };

  const sparklineData = {
    labels: history.map((_, i) => i),
    datasets: [{
      data: history.map(h => h?.temperature || 37),
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4
    }]
  };

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { 
        display: false,
        min: 36,
        max: 38
      }
    }
  };

  const reading = device.latestReading || {};

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${device.status === 'offline' ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-800">{device.id}</h4>
          <p className="text-sm text-gray-500">{device.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)} ${device.status === 'online' ? 'animate-pulse' : ''}`}></div>
          <span className="text-sm text-gray-600 capitalize">{device.status}</span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-16 mb-4">
        <Line data={sparklineData} options={sparklineOptions} />
      </div>

      {/* Sensor Readings Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Temperature</p>
          <p className={`text-xl font-bold ${getValueColor(reading.temperature || 37, 'temperature')}`}>
            {(reading.temperature || 37).toFixed(2)}°C
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">CO₂</p>
          <p className={`text-xl font-bold ${getValueColor(reading.co2 || 5, 'co2')}`}>
            {(reading.co2 || 5).toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Humidity</p>
          <p className={`text-xl font-bold ${getValueColor(reading.humidity || 85, 'humidity')}`}>
            {(reading.humidity || 85).toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Battery</p>
          <div className="flex items-center">
            <span className="text-xl mr-1">{getBatteryIcon(reading.battery || 100)}</span>
            <p className={`text-xl font-bold ${reading.battery < 20 ? 'text-red-600' : 'text-gray-700'}`}>
              {(reading.battery || 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Research Grade - Additional Oxygen Reading */}
      {device.type === 'Research' && (
        <div className="bg-purple-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-purple-600 mb-1">Oxygen Level</p>
          <p className="text-xl font-bold text-purple-700">
            {(reading.oxygen || 20).toFixed(1)}%
          </p>
        </div>
      )}

      {/* Device Info */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
        <span>Type: {device.type}</span>
        <span>Last Update: {reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : 'N/A'}</span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSimulate}
        disabled={device.status === 'offline' || isSimulating}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
          device.status === 'offline' 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isSimulating
            ? 'bg-yellow-500 text-white animate-pulse'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
        }`}
      >
        {isSimulating ? '🚨 Simulating Anomaly...' : '🚪 Simulate Door Opening'}
      </button>

      {/* Recent Alerts Indicator */}
      {device.recentAlerts && device.recentAlerts.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 font-medium">
            ⚠️ {device.recentAlerts.length} recent alert{device.recentAlerts.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviceCard;