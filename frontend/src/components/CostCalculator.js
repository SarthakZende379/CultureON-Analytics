import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../services/api';

// All imports are now at the top.
// Now, we can run other code like registering ChartJS components.
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const CostCalculator = () => {
  const [deviceCount, setDeviceCount] = useState(100);
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateCosts(deviceCount);
  }, [deviceCount]);

  const calculateCosts = async (count) => {
    setLoading(true);
    try {
      const response = await api.post('/analytics/calculate-costs', { deviceCount: count });
      if (response.data.success) {
        setCosts(response.data.costs);
      }
    } catch (error) {
      console.error('Error calculating costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const scalingData = {
    labels: ['10', '100', '1,000', '10,000', '54,000'],
    datasets: [
      {
        label: 'Automated Infrastructure',
        data: [50, 140, 1040, 10040, 54040],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      },
      {
        label: 'Manual Monitoring',
        data: [500, 5000, 50000, 500000, 2700000],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      }
    ]
  };

  const scalingOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cost Scaling: Automated vs Manual (Monthly $)'
      }
    },
    scales: {
      y: {
        type: 'logarithmic',
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const savingsData = costs ? {
    labels: ['Infrastructure', 'Labor', 'Alert Response', 'Data Analysis', 'Maintenance'],
    datasets: [{
      label: 'Monthly Savings',
      data: [
        costs.summary.comparedToManual.savingsMonthly * 0.2,
        costs.summary.comparedToManual.savingsMonthly * 0.4,
        costs.summary.comparedToManual.savingsMonthly * 0.15,
        costs.summary.comparedToManual.savingsMonthly * 0.15,
        costs.summary.comparedToManual.savingsMonthly * 0.1
      ],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)'
      ]
    }]
  } : null;

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Infrastructure Cost Analysis
        </h2>
        <p className="text-gray-600 mb-6">
          Calculate the total cost of ownership for scaling CultureON's IoT infrastructure. 
          Our automated system delivers {costs?.summary.comparedToManual.savingsPercentage || '95'}% cost savings 
          compared to manual monitoring while improving reliability.
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Monthly Savings</p>
            <p className="text-2xl font-bold text-green-700">
              ${costs ? parseFloat(costs.summary.comparedToManual.savingsMonthly).toLocaleString() : '0'}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Annual Savings</p>
            <p className="text-2xl font-bold text-blue-700">
              ${costs ? parseFloat(costs.summary.comparedToManual.savingsAnnual).toLocaleString() : '0'}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">Cost Per Device</p>
            <p className="text-2xl font-bold text-purple-700">
              ${costs ? costs.summary.perDevice : '0'}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600 mb-1">ROI</p>
            <p className="text-2xl font-bold text-indigo-700">
              {costs ? costs.summary.comparedToManual.savingsPercentage : '0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Calculator */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Interactive Cost Calculator</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Devices: {deviceCount.toLocaleString()}
          </label>
          <input
            type="range"
            min="10"
            max="10000"
            step="10"
            value={deviceCount}
            onChange={(e) => setDeviceCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>100</span>
            <span>1,000</span>
            <span>10,000</span>
          </div>
        </div>

        {costs && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Automated Infrastructure Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fixed Costs:</span>
                  <span className="font-medium">${costs.breakdown.fixed.total}/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Variable Costs:</span>
                  <span className="font-medium">${costs.breakdown.variable.total.toFixed(2)}/mo</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Monthly:</span>
                    <span className="font-bold text-lg text-indigo-600">
                      ${costs.summary.monthlyTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Manual Monitoring Costs</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Labor (per device):</span>
                  <span className="font-medium">$50/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Devices:</span>
                  <span className="font-medium">{deviceCount}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Monthly:</span>
                    <span className="font-bold text-lg text-red-600">
                      ${costs.summary.comparedToManual.manualCostMonthly}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scaling Visualization */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cost Scaling Comparison</h3>
          <Line data={scalingData} options={scalingOptions} />
        </div>

        {savingsData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Savings Breakdown</h3>
            <Bar 
              data={savingsData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: function(value) {
                        return '$' + value.toFixed(0);
                      }
                    }
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Business Impact */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 mt-6 text-white">
        <h3 className="text-xl font-semibold mb-4">Business Impact at Scale</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold mb-2">54,000</p>
            <p className="text-sm opacity-90">
              Target customer base achievable with automated infrastructure
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold mb-2">$32.4M</p>
            <p className="text-sm opacity-90">
              Annual savings at full scale deployment (54K devices)
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold mb-2">3 FTEs</p>
            <p className="text-sm opacity-90">
              Engineering team size to manage entire infrastructure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;
