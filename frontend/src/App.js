import React, { useState, useEffect, useCallback } from 'react'; // 1. Import useCallback
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import AlertPanel from './components/AlertPanel';
import CostCalculator from './components/CostCalculator';
import DataExport from './components/DataExport';
import useWebSocket from './hooks/useWebSocket';
import api from './services/api';
import './App.css';

function App() {
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [systemMetrics, setSystemMetrics] = useState(null);

  // 2. Wrap your data handling functions in useCallback
  const handleSensorData = useCallback((readings) => {
    // Handle both single reading and batch updates
    const readingsArray = Array.isArray(readings) ? readings : [readings];
    
    setDevices(prevDevices => {
      return prevDevices.map(device => {
        const newReading = readingsArray.find(r => r.deviceId === device.id);
        if (newReading) {
          return {
            ...device,
            latestReading: newReading,
            status: 'online'
          };
        }
        return device;
      });
    });
  }, []); // Empty dependency array means this function is created only once

  const handleAlert = useCallback((alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50));
  }, []);

  const handleDeviceStatus = useCallback(({ deviceId, status }) => {
    setDevices(prevDevices => {
      return prevDevices.map(device => {
        if (device.id === deviceId) {
          return { ...device, status };
        }
        return device;
      });
    });
  }, []);

  // 3. Pass the new, stable functions directly to the useWebSocket hook
  const { isConnected, simulateDoorOpening } = useWebSocket({
    onSensorData: handleSensorData,
    onAlert: handleAlert,
    onDeviceStatus: handleDeviceStatus
  });

  // Load initial data (no changes needed here)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        const devicesResponse = await api.get('/devices');
        if (devicesResponse.data.success) {
          setDevices(devicesResponse.data.devices);
        }

        const analyticsResponse = await api.get('/analytics/overview');
        if (analyticsResponse.data.success) {
          setSystemMetrics(analyticsResponse.data.analytics.systemMetrics);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSimulateDoorOpening = (deviceId) => {
    simulateDoorOpening(deviceId);
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/devices/alerts/${alertId}/acknowledge`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CultureON Analytics Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">37°</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">CultureON Analytics</h1>
                  <p className="text-sm text-gray-500">Protecting Research with 99.9% Uptime</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-8">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">{isConnected ? 'Live' : 'Disconnected'}</span>
              </div>
            </div>
            
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'dashboard' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('alerts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                  activeView === 'alerts' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Alerts
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('costs')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'costs' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cost Analysis
              </button>
              <button
                onClick={() => setActiveView('export')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'export' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Export Data
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Key Metrics Bar */}
      {systemMetrics && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Devices Online</p>
                <p className="text-lg font-bold text-green-600">{devices.filter(d => d.status === 'online').length}/6</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Temperature</p>
                <p className="text-lg font-bold text-blue-600">{systemMetrics.avgTemperature}°C</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg CO₂</p>
                <p className="text-lg font-bold text-purple-600">{systemMetrics.avgCO2}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Humidity</p>
                <p className="text-lg font-bold text-cyan-600">{systemMetrics.avgHumidity}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Alerts</p>
                <p className="text-lg font-bold text-red-600">{alerts.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">System Health</p>
                <p className="text-lg font-bold text-green-600">99.9%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <Dashboard 
            devices={devices} 
            onSimulateDoorOpening={handleSimulateDoorOpening}
          />
        )}
        
        {activeView === 'alerts' && (
          <AlertPanel 
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
          />
        )}
        
        {activeView === 'costs' && (
          <CostCalculator />
        )}
        
        {activeView === 'export' && (
          <DataExport devices={devices} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2024 CultureON Analytics - Scalable IoT Infrastructure for 54K+ Customers
            </p>
            <div className="flex space-x-6 text-sm text-gray-500">
              <span>Real-time Monitoring</span>
              <span>•</span>
              <span>Automated Alerts</span>
              <span>•</span>
              <span>Research Protection</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
