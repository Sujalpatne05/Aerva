// Backend API configuration
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
export const DASHBOARD_EVENT = '/api/dashboard/';

// Fetch initial dashboard data
export async function fetchLatestDashboard() {
  const res = await fetch(`${API_BASE}/api/dashboard/`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard: ${res.statusText}`);
  }
  
  return res.json();
}

// Fetch graph data for metrics
export async function fetchGraphData({ deviceMac, metric, range }) {
  const params = new URLSearchParams({
    device_mac: deviceMac,
    metric,
    range
  });

  const res = await fetch(`${API_BASE}/api/dashboard/graph?${params}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch graph data: ${res.statusText}`);
  }
  
  return res.json();
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
