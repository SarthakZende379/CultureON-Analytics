import React from 'react';
import DeviceCard from './DeviceCard';

const Dashboard = ({ devices, onSimulateDoorOpening }) => {
  const devicesByType = {
    Standard: devices.filter(d => d.type === 'Standard'),
    Premium: devices.filter(d => d.type === 'Premium'),
    Research: devices.filter(d => d.type === 'Research')
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Real-Time Device Monitoring
            </h2>
            <p className="text-gray-600 mb-6">
              Monitor all CultureON incubators in real-time with automated anomaly detection. 
              Our infrastructure scales seamlessly from 4 to 54,000 devices while maintaining 
              sub-second alert response times.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600">5-second update intervals</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600">Gaussian noise simulation</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Business Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">$50K</p>
                <p className="text-sm opacity-90">Per experiment protected</p>
              </div>
              <div>
                <p className="text-3xl font-bold">99.9%</p>
                <p className="text-sm opacity-90">System uptime</p>
              </div>
              <div>
                <p className="text-3xl font-bold">&lt;5s</p>
                <p className="text-sm opacity-90">Alert response time</p>
              </div>
              <div>
                <p className="text-3xl font-bold">54K</p>
                <p className="text-sm opacity-90">Scalable to devices</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Grid by Type */}
      {Object.entries(devicesByType).map(([type, typeDevices]) => (
        <div key={type} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {type} Incubators
              <span className="ml-2 text-sm text-gray-500">
                ({typeDevices.filter(d => d.status === 'online').length}/{typeDevices.length} online)
              </span>
            </h3>
            <div className="flex items-center space-x-2">
              {type === 'Standard' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  ±0.3°C precision
                </span>
              )}
              {type === 'Premium' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  ±0.1°C precision
                </span>
              )}
              {type === 'Research' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ±0.05°C precision
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {typeDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onSimulateDoorOpening={onSimulateDoorOpening}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Interactive Demo Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          🚀 Interactive Demo
        </h3>
        <p className="text-gray-600 mb-4">
          Click the "Simulate Door Opening" button on any device card to trigger a temperature spike alert. 
          This demonstrates our real-time anomaly detection system that protects valuable research experiments.
        </p>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Normal operation</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Warning threshold</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Critical alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;