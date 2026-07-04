import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { INITIAL_DEVICES, INITIAL_RULES } from './data/devices.jsx';
import { mqttManager, loadConfig } from './lib/mqttClient.js';
import { evaluateSensor, aqiFromPm25, aqiCategory } from './lib/aqi.js';
import { API_BASE, DASHBOARD_EVENT, fetchLatestDashboard } from './lib/backendApi.js';

const AppContext = createContext(null);

const initialState = {
  devices: INITIAL_DEVICES,
  alertRules: INITIAL_RULES,
  currentSensorId: 'pm25',
  selectedDeviceId: 'living-room',
  drawerOpen: false,
  toast: null,
  primaryRoomName: 'Living Room',

  // ---- Live MQTT state ----
  mqttStatus: 'idle',
  mqttError: null,
  mqttConfig: loadConfig(),
  live: null,
  liveHistory: [],
  lastUpdate: null,
  backendDeviceMac: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_DEVICE':
      return { ...state, devices: [...state.devices, action.payload] };

    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map(d => d.id === action.payload.id ? { ...d, ...action.payload.changes } : d),
        primaryRoomName: action.payload.id === 'living-room' && action.payload.changes.name
          ? action.payload.changes.name
          : state.primaryRoomName
      };

    case 'DELETE_DEVICE':
      return { ...state, devices: state.devices.filter(d => d.id !== action.payload) };

    case 'SET_SENSOR':
      return { ...state, currentSensorId: action.payload };

    case 'SET_SELECTED_DEVICE':
      return { ...state, selectedDeviceId: action.payload };

    case 'ADD_RULE':
      return { ...state, alertRules: [...state.alertRules, action.payload] };

    case 'UPDATE_RULE':
      return {
        ...state,
        alertRules: state.alertRules.map(r => r.id === action.payload.id ? { ...r, ...action.payload.changes } : r)
      };

    case 'DELETE_RULE':
      return { ...state, alertRules: state.alertRules.filter(r => r.id !== action.payload) };

    case 'TOGGLE_DRAWER':
      return { ...state, drawerOpen: action.payload !== undefined ? action.payload : !state.drawerOpen };

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'MQTT_STATUS':
      return { ...state, mqttStatus: action.payload.status, mqttError: action.payload.error };

    case 'MQTT_CONFIG':
      return { ...state, mqttConfig: action.payload };

    case 'MQTT_MESSAGE': {
      const live = action.payload;
      const history = [...state.liveHistory, {
        t: live.receivedAt,
        pm25: live.readings.pm25,
        co2: live.readings.co2,
        co: live.readings.co,
        o2: live.readings.o2,
        temp: live.readings.temp,
        rh: live.readings.rh,
        aqi: live.aqi
      }].slice(-60);

      const devices = state.devices.map(d =>
        d.id === 'living-room' && live.aqi != null
          ? { ...d, aqi: live.aqi, status: live.aqiCategory.status }
          : d
      );

      return {
        ...state,
        live,
        liveHistory: history,
        lastUpdate: live.receivedAt,
        devices,
        backendDeviceMac: live.mac || state.backendDeviceMac
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const startedRef = useRef(false);

  useEffect(() => {
    const offStatus = mqttManager.on('status', (status, error) => {
      dispatch({ type: 'MQTT_STATUS', payload: { status, error } });
    });
    const offMsg = mqttManager.on('message', (parsed) => {
      dispatch({ type: 'MQTT_MESSAGE', payload: parsed });
    });

    if (!startedRef.current) {
      startedRef.current = true;
      const cfg = loadConfig();
      if (cfg.url) {
        setTimeout(() => mqttManager.connect(cfg), 300);
      }
    }

    return () => { offStatus(); offMsg(); };
  }, []);

  useEffect(() => {
    let ignore = false;
    const socket = io(API_BASE || '/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    async function loadDashboardBootstrap() {
      try {
        const raw = await fetchLatestDashboard();
        if (ignore) return;

        const normalized = normalizeDashboardPayload(raw);
        dispatch({ type: 'MQTT_STATUS', payload: { status: 'connected', error: null } });
        dispatch({ type: 'MQTT_MESSAGE', payload: normalized });
      } catch {
        // Keep demo/MQTT flow if backend is unavailable.
      }
    }

    loadDashboardBootstrap();

    socket.on('connect', () => {
      if (!ignore) {
        dispatch({ type: 'MQTT_STATUS', payload: { status: 'connected', error: null } });
      }
    });

    socket.on(DASHBOARD_EVENT, (raw) => {
      if (ignore) return;
      const normalized = normalizeDashboardPayload(raw);
      dispatch({ type: 'MQTT_MESSAGE', payload: normalized });
    });

    socket.on('disconnect', () => {
      if (!ignore) {
        dispatch({ type: 'MQTT_STATUS', payload: { status: 'offline', error: null } });
      }
    });

    return () => {
      ignore = true;
      socket.disconnect();
    };
  }, []);

  const addDevice = useCallback((device) => dispatch({ type: 'ADD_DEVICE', payload: device }), []);
  const updateDevice = useCallback((id, changes) => dispatch({ type: 'UPDATE_DEVICE', payload: { id, changes } }), []);
  const deleteDevice = useCallback((id) => dispatch({ type: 'DELETE_DEVICE', payload: id }), []);
  const setSensor = useCallback((id) => dispatch({ type: 'SET_SENSOR', payload: id }), []);
  const setSelectedDevice = useCallback((id) => dispatch({ type: 'SET_SELECTED_DEVICE', payload: id }), []);
  const addRule = useCallback((rule) => dispatch({ type: 'ADD_RULE', payload: rule }), []);
  const updateRule = useCallback((id, changes) => dispatch({ type: 'UPDATE_RULE', payload: { id, changes } }), []);
  const deleteRule = useCallback((id) => dispatch({ type: 'DELETE_RULE', payload: id }), []);
  const toggleDrawer = useCallback((value) => dispatch({ type: 'TOGGLE_DRAWER', payload: value }), []);
  const showToast = useCallback((text) => {
    dispatch({ type: 'SHOW_TOAST', payload: text });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800);
  }, []);

  const connectMqtt = useCallback((cfg) => {
    if (cfg) dispatch({ type: 'MQTT_CONFIG', payload: cfg });
    mqttManager.connect(cfg);
  }, []);
  const disconnectMqtt = useCallback(() => {
    mqttManager.disconnect();
    dispatch({ type: 'MQTT_STATUS', payload: { status: 'idle', error: null } });
  }, []);
  const publishCommand = useCallback((obj) => mqttManager.publish(obj), []);

  const getLiveSensor = useCallback((id) => {
    if (!state.live) return null;
    const map = {
      pm25: state.live.readings.pm25,
      co2: state.live.readings.co2,
      co: state.live.readings.co,
      o2: state.live.readings.o2,
      temp: state.live.readings.temp,
      rh: state.live.readings.rh,
      aqi: state.live.aqi
    };
    const value = map[id];
    if (value == null) return null;
    const evalResult = id === 'aqi'
      ? { status: state.live.aqiCategory.status, statusText: state.live.aqiCategory.label, meterPct: Math.min(100, (value / 300) * 100), markerPos: Math.min(100, (value / 300) * 100) }
      : evaluateSensor(id, value);
    return { value, ...evalResult };
  }, [state.live]);

  return (
    <AppContext.Provider value={{
      ...state,
      addDevice, updateDevice, deleteDevice,
      setSensor, setSelectedDevice,
      addRule, updateRule, deleteRule,
      toggleDrawer, showToast,
      connectMqtt, disconnectMqtt, publishCommand, getLiveSensor
    }}>
      {children}
    </AppContext.Provider>
  );
}

function normalizeDashboardPayload(raw) {
  const readings = {
    pm25: toNumber(raw?.readings?.pm2_5),
    pm10: toNumber(raw?.readings?.pm10),
    pm1: toNumber(raw?.readings?.pm1_0),
    co2: toNumber(raw?.readings?.co2_ppm),
    co: toNumber(raw?.readings?.co_ppm),
    o2: toNumber(raw?.readings?.o2_pct),
    temp: toNumber(raw?.readings?.temperature),
    rh: toNumber(raw?.readings?.humidity)
  };

  const aqi = aqiFromPm25(readings.pm25);

  return {
    mac: raw?.device_mac || null,
    time: raw?.received_at || null,
    timeStatus: raw?.status?.time_status || null,
    readings,
    aqi,
    aqiCategory: aqiCategory(aqi),
    diag: {
      rssi: toNumber(raw?.readings?.rssi),
      o2Warn: !!raw?.status?.o2_warn,
      uptime: null,
      mqttErr: toNumber(raw?.status?.mqtt_err)
    },
    receivedAt: Date.now()
  };
}

function toNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
