import axios from 'axios';

// IMPORTANT: Replace this IP with your computer's local IP address (e.g., 192.168.x.x)
const API_URL = 'http://10.248.184.142:5000/api';

export const fetchTelemetry = async (orgId = 'dell-hackathon-2026') => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/devices`);
    return response.data.filter(d => d.orgId === orgId);
  } catch (error) {
    console.error("Error fetching telemetry:", error);
    throw error;
  }
};

export const resolveAlert = async (deviceId) => {
  try {
    const response = await axios.post(`${API_URL}/dashboard/devices/${deviceId}/resolve`);
    return response.data;
  } catch (error) {
    console.error("Error resolving alert:", error);
    throw error;
  }
};

export const fetchDeviceDetail = async (deviceId) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/devices/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching device detail:", error);
    throw error;
  }
};
