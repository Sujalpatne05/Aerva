import { io } from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Socket.IO instance
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
  }
  return socket;
}

// Fetch initial dashboard data
export async function fetchDashboardData() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return await res.json();
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    throw err;
  }
}

// Fetch graph data for charts
export async function fetchGraphData({ deviceMac, metric, range }) {
  try {
    const params = new URLSearchParams({
      device_mac: deviceMac,
      metric,
      range
    });

    const res = await fetch(`${API_BASE}/api/dashboard/graph?${params}`);
    if (!res.ok) throw new Error('Failed to fetch graph data');
    return await res.json();
  } catch (err) {
    console.error('Graph data fetch error:', err);
    throw err;
  }
}

// Download Excel report
export function downloadExcelReport(deviceMac, range) {
  const params = new URLSearchParams({
    device_mac: deviceMac,
    range
  });
  window.location.href = `${API_BASE}/api/reports/export?${params}`;
}

// Download PDF report
export function downloadPdfReport(deviceMac, range) {
  const params = new URLSearchParams({
    device_mac: deviceMac,
    range
  });
  window.location.href = `${API_BASE}/api/reports/export-pdf?${params}`;
}

// Subscribe to live dashboard updates
export function subscribeToDashboard(callback) {
  const socketInstance = getSocket();
  
  socketInstance.on('connect', () => {
    console.log('Socket connected');
  });

  socketInstance.on('/api/dashboard/', (data) => {
    callback(data);
  });

  socketInstance.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return () => {
    socketInstance.off('/api/dashboard/', callback);
  };
}

// Unsubscribe from live updates
export function unsubscribeFromDashboard() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
