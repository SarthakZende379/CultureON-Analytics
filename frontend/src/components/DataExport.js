import React, { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const DataExport = ({ devices }) => {
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const endpoint = selectedDevice === 'all' 
        ? '/analytics/export'
        : `/devices/${selectedDevice}/export`;
      
      const response = await api.get(endpoint, {
        params: {
          startTime: new Date(dateRange.start).toISOString(),
          endTime: new Date(dateRange.end).toISOString()
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cultureon_data_${selectedDevice}_${dateRange.start}_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const generateSampleData = () => {
    // Generate sample CSV data for demonstration
    const headers = ['timestamp', 'device_id', 'temperature', 'co2', 'humidity', 'battery', 'status'];
    const rows = [];
    
    // Generate 100 sample rows
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - i * 5 * 60 * 1000).toISOString();
      const deviceId = devices[Math.floor(Math.random() * devices.length)]?.id || 'CO-STD-001';
      const temperature = (37 + (Math.random() - 0.5) * 0.6).toFixed(2);
      const co2 = (5 + (Math.random() - 0.5) * 0.4).toFixed(2);
      const humidity = (85 + (Math.random() - 0.5) * 6).toFixed(1);
      const battery = (100 - i * 0.1).toFixed(1);
      const status = 'normal';
      
      rows.push([timestamp, deviceId, temperature, co2, humidity, battery, status].join(','));
    }
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    // Download the sample data
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cultureon_sample_data.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    toast.success('Sample data generated!');
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Data Export & Integration
        </h2>
        <p className="text-gray-600 mb-6">
          Export sensor data for research analysis, compliance reporting, and integration with 
          existing laboratory information management systems (LIMS). Data is available in 
          CSV format for compatibility with all major analysis tools.
        </p>

        {/* Key Features */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Data Points</p>
            <p className="text-2xl font-bold text-blue-700">1M+</p>
            <p className="text-xs text-blue-600">Per month</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Export Formats</p>
            <p className="text-2xl font-bold text-green-700">CSV</p>
            <p className="text-xs text-green-600">Universal compatibility</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">API Ready</p>
            <p className="text-2xl font-bold text-purple-700">REST</p>
            <p className="text-xs text-purple-600">Full integration</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600 mb-1">Compliance</p>
            <p className="text-2xl font-bold text-indigo-700">GxP</p>
            <p className="text-xs text-indigo-600">Audit ready</p>
          </div>
        </div>
      </div>

      {/* Export Configuration */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Configure Data Export</h3>
        
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Device Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Devices</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.id} - {device.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              exporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {exporting ? '📊 Exporting...' : '📥 Export Data'}
          </button>
          
          <button
            onClick={generateSampleData}
            className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-all"
          >
            🎲 Generate Sample Data
          </button>
        </div>
      </div>

      {/* Data Format Example */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Format Specification</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">Field</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Example</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2">timestamp</td>
                <td className="py-2">ISO 8601</td>
                <td className="py-2">2024-01-15T14:30:00Z</td>
                <td className="py-2">UTC timestamp</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">device_id</td>
                <td className="py-2">String</td>
                <td className="py-2">CO-RES-001</td>
                <td className="py-2">Unique device identifier</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">temperature</td>
                <td className="py-2">Float</td>
                <td className="py-2">37.05</td>
                <td className="py-2">Celsius, 2 decimal places</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">co2</td>
                <td className="py-2">Float</td>
                <td className="py-2">5.02</td>
                <td className="py-2">Percentage, 2 decimal places</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">humidity</td>
                <td className="py-2">Float</td>
                <td className="py-2">85.3</td>
                <td className="py-2">Percentage, 1 decimal place</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2">oxygen</td>
                <td className="py-2">Float/Null</td>
                <td className="py-2">20.1</td>
                <td className="py-2">Research devices only</td>
              </tr>
              <tr>
                <td className="py-2">battery</td>
                <td className="py-2">Float</td>
                <td className="py-2">87.5</td>
                <td className="py-2">Percentage remaining</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Options */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">API Integration</h3>
          <p className="text-sm opacity-90 mb-4">
            RESTful API endpoints available for real-time data access and integration 
            with existing laboratory systems.
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 font-mono text-xs">
            GET /api/devices/{'{deviceId}'}/readings<br/>
            GET /api/analytics/export?start=...&end=...<br/>
            POST /api/analytics/calculate-costs
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">Research Applications</h3>
          <p className="text-sm opacity-90 mb-4">
            Export data directly to research tools and analysis platforms for 
            advanced statistical analysis and visualization.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">Excel</span>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">R Studio</span>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">Python</span>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">MATLAB</span>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">GraphPad</span>
            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">Tableau</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;