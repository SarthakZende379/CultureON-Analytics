import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const useWebSocket = ({ onSensorData, onAlert, onDeviceStatus }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      toast.success('Connected to real-time data stream', { duration: 2000 });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      toast.error('Disconnected from real-time data stream', { duration: 2000 });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Data event handlers
    socket.on('initial-data', (data) => {
      console.log('Received initial data:', data);
      if (data.devices && onSensorData) {
        data.devices.forEach(device => {
          if (device.currentReadings) {
            onSensorData(device.currentReadings);
          }
        });
      }
    });

    socket.on('sensor-data', (data) => {
      console.log('Received sensor data:', data);
      if (onSensorData) {
        onSensorData(data);
      }
    });

    socket.on('sensor-data-batch', (dataArray) => {
      console.log('Received sensor data batch:', dataArray);
      if (onSensorData) {
        dataArray.forEach(data => onSensorData(data));
      }
    });

    socket.on('alert-triggered', (alert) => {
      console.log('Alert triggered:', alert);
      if (onAlert) {
        onAlert(alert);
      }
      
      // Show toast notification for alerts
      const icon = alert.severity === 'CRITICAL' ? '🚨' : 
                   alert.severity === 'WARNING' ? '⚠️' : 'ℹ️';
      
      toast(
        <div>
          <strong>{icon} {alert.severity} Alert</strong>
          <p className="text-sm">{alert.message}</p>
        </div>,
        {
          duration: alert.severity === 'CRITICAL' ? 6000 : 4000,
          style: {
            background: alert.severity === 'CRITICAL' ? '#FEE2E2' :
                       alert.severity === 'WARNING' ? '#FEF3C7' : '#DBEAFE',
            color: '#1F2937',
          },
        }
      );
    });

    socket.on('device-status', (status) => {
      console.log('Device status update:', status);
      if (onDeviceStatus) {
        onDeviceStatus(status);
      }
      
      // Show status change notification
      const statusIcon = status.status === 'online' ? '🟢' : '🔴';
      toast(
        `${statusIcon} Device ${status.deviceId} is now ${status.status}`,
        { duration: 3000 }
      );
    });

    socket.on('thresholds-updated', (thresholds) => {
      console.log('Alert thresholds updated:', thresholds);
      toast.success('Alert thresholds updated', { duration: 2000 });
    });

    socket.on('alerts-cleared', ({ deviceId }) => {
      const message = deviceId 
        ? `Alerts cleared for device ${deviceId}`
        : 'All alerts cleared';
      toast.success(message, { duration: 2000 });
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [onSensorData, onAlert, onDeviceStatus]);

  // Function to simulate door opening
  const simulateDoorOpening = (deviceId) => {
    if (socketRef.current && isConnected) {
      console.log('Simulating door opening for:', deviceId);
      socketRef.current.emit('simulate-door-opening', deviceId);
      toast('🚪 Simulating door opening...', {
        duration: 2000,
        icon: '🔄',
      });
    } else {
      toast.error('Not connected to server');
    }
  };

  // Function to send device command
  const sendDeviceCommand = (command) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('device-command', command);
    } else {
      toast.error('Not connected to server');
    }
  };

  return {
    isConnected,
    simulateDoorOpening,
    sendDeviceCommand,
    socket: socketRef.current
  };
};

export default useWebSocket;