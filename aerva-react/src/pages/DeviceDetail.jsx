import React, { useContext, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import { useApp } from '../store.jsx';
import { ModalContext } from '../App.jsx';
import { SENSORS, findSensor } from '../data/sensors.js';
import { SensorIllustration, makeChartData, makeReadings } from '../data/devices.jsx';
import { IconEdit, IconDownload, IconSparkle } from '../components/icons.jsx';
import { aqiCategory, evaluateSensor } from '../lib/aqi.js';

function formatValue(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const numericValue = Number(value);
  return Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(1);
}

function formatReadingTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function getReadingStatus(sensorId, value) {
  const status = sensorId === 'aqi'
    ? aqiCategory(value).status
    : evaluateSensor(sensorId, value).status;

  return status === 'good' ? 'green' : 'yellow';
}

function SensorTab({ sensor, active, onClick }) {
  return (
    <button className={`stab${active ? ' active' : ''}`} onClick={onClick}>
      <div className="st-head">
        <span className="st-name">{sensor.name}</span>
        <span className={`st-dot ${sensor.status}`} />
      </div>
      <div className="st-val">
        <span className="v">{formatValue(sensor.value)}</span>
        <span className="u">{sensor.unit}</span>
      </div>
      <span className={`st-status ${sensor.status}`}>{sensor.statusText}</span>
      <div className="st-meter">
        <div className={`fill ${sensor.status}`} style={{ width: `${sensor.meterPct}%` }} />
      </div>
    </button>
  );
}

export default function DeviceDetail() {
  const { deviceId } = useParams();
  const {
    devices,
    currentSensorId,
    setSensor,
    getLiveSensor,
    liveHistory,
    mqttStatus,
    lastUpdate
  } = useApp();
  const { openRenameDevice } = useContext(ModalContext);

  const device = devices.find(d => d.id === deviceId);
  const isLivingRoom = deviceId === 'living-room';
  const sensors = SENSORS.map((sensorDefinition) => {
    if (!isLivingRoom) return sensorDefinition;

    const liveSensor = getLiveSensor(sensorDefinition.id);
    return liveSensor
      ? { ...sensorDefinition, ...liveSensor }
      : sensorDefinition;
  });

  const sensor = sensors.find(s => s.id === currentSensorId) || findSensor(currentSensorId);
  const liveSensorHistory = isLivingRoom
    ? liveHistory.filter(point => point[currentSensorId] != null)
    : [];
  const historyValues = liveSensorHistory.map(point => Number(point[currentSensorId]));
  const hasLiveHistory = historyValues.length > 0;
  const liveAverage = hasLiveHistory
    ? historyValues.reduce((sum, value) => sum + value, 0) / historyValues.length
    : null;

  const liveStats = hasLiveHistory
    ? {
        average: liveAverage,
        peak: Math.max(...historyValues),
        variance: Math.sqrt(
          historyValues.reduce((sum, value) => sum + ((value - liveAverage) ** 2), 0)
          / historyValues.length
        )
      }
    : null;

  const chartData = useMemo(() => {
    if (!isLivingRoom) {
      return makeChartData(sensor.id.length, sensor.value, Math.max(2, sensor.variance));
    }

    return liveSensorHistory.map(point => ({
      time: formatReadingTime(point.t),
      value: Number(point[currentSensorId])
    }));
  }, [currentSensorId, isLivingRoom, liveHistory]);

  const readings = isLivingRoom
    ? liveSensorHistory.slice(-12).reverse().map(point => ({
        t: formatReadingTime(point.t),
        v: formatValue(point[currentSensorId]),
        s: getReadingStatus(currentSensorId, Number(point[currentSensorId]))
      }))
    : makeReadings();

  if (!device) return <Navigate to="/" replace />;

  const chartColor = ['bad', 'poor', 'hazardous'].includes(sensor.status)
    ? '#D63D3D'
    : sensor.status === 'moderate' ? '#EFBE1D' : '#1FA063';
  const connectionLabel = mqttStatus === 'connected' ? 'Online' : 'Connecting';
  const updatedLabel = lastUpdate ? formatReadingTime(lastUpdate) : '—';

  return (
    <>
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="eyebrow-home">
            <span className="home-dot" />
            DEVICE · AERVA Home · SN {device.sn}
          </div>
          <h1 className="display-1">
            {device.name}
            <button className="rename-btn rename-btn--inline" onClick={() => openRenameDevice(device.id)} aria-label="Rename room">
              <IconEdit />
            </button>
          </h1>
          <div className="sub mono">Ground floor · {connectionLabel} · Last update {updatedLabel}</div>
        </div>
        <div className="head-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => openRenameDevice(device.id)}>
            <IconEdit /> Rename
          </button>
          <button className="btn btn-accent"><IconDownload /> Export</button>
        </div>
      </div>

      {/* Sensor tabs */}
      <div className="sensor-tabs-wrap">
        <div className="sensor-tabs">
          {sensors.map(s => (
            <SensorTab key={s.id} sensor={s} active={s.id === currentSensorId} onClick={() => setSensor(s.id)} />
          ))}
        </div>
      </div>

      {/* Educational card */}
      <div className="edu-card">
        <div className="edu-body">
          <div className="edu-eyebrow">What is {sensor.name}</div>
          <div className="edu-title">{sensor.fullName}</div>
          <div className="edu-desc">{sensor.description}</div>
          <div className="edu-bullets">
            {sensor.bullets.map((b, i) => (
              <span key={i} className="edu-bullet">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12"/></svg>
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="edu-illust">
          <SensorIllustration sensorId={sensor.id} />
        </div>
      </div>

      {/* Reading detail + chart */}
      <div className="detail-grid">
        <div className="card reading-hero">
          <div className="reading-head">
            <div className="who">
              <div className="reading-icon">
                <IconSparkle />
              </div>
              <div className="reading-name">
                <div className="t">{sensor.type}</div>
                <div className="b">{sensor.name === 'RH' ? 'Humidity' : sensor.fullName}</div>
              </div>
            </div>
            <div className="live-pill"><span className="live-dot" /> {mqttStatus === 'connected' ? 'LIVE' : 'WAITING'}</div>
          </div>

          <div className="reading-big">
            <span className="n">{formatValue(sensor.value)}</span>
            <span className="u">{sensor.unit}</span>
          </div>

          <div className="threshold-bar-wrap">
            <div className="threshold-bar">
              <div className="threshold-marker" style={{ left: `${sensor.markerPos}%` }} />
            </div>
            <div className="threshold-labels">
              {sensor.thresholds.map((t, i) => <span key={i}>{t}</span>)}
            </div>
          </div>

          <div className="reading-stats">
            <div className="reading-stat"><div className="l">{hasLiveHistory ? 'Session Avg' : '24h Avg'}</div><div className="v">{formatValue(liveStats?.average ?? sensor.avg24)}</div></div>
            <div className="reading-stat"><div className="l">{hasLiveHistory ? 'Session Peak' : 'Peak today'}</div><div className="v">{formatValue(liveStats?.peak ?? sensor.peak)}</div></div>
            <div className="reading-stat"><div className="l">Variance</div><div className="v">±{formatValue(liveStats?.variance ?? sensor.variance)}</div></div>
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">{isLivingRoom ? 'Live trend' : 'Historical trend'}</div>
              <div className="chart-sub">{sensor.name} · {isLivingRoom ? 'live Socket.IO session' : 'last 24 hours · 5 min intervals'}</div>
            </div>
            {!isLivingRoom && (
              <div className="timeframe">
                <button className="tf-btn">1H</button>
                <button className="tf-btn active">24H</button>
                <button className="tf-btn">7D</button>
                <button className="tf-btn">30D</button>
              </div>
            )}
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="time" stroke="#A8B5C8" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} interval={2} />
                <YAxis stroke="#A8B5C8" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  contentStyle={{ background: '#0A2E50', border: '1px solid #EFBE1D', borderRadius: 8, fontSize: 11, color: '#fff' }}
                  formatter={(v) => [`${v} ${sensor.unit}`, sensor.name]}
                />
                <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fill="url(#dgrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Last 12 readings */}
      <div className="card readings-list-card">
        <div className="chart-head">
          <div>
            <div className="chart-title">Last 12 readings</div>
            <div className="chart-sub">{isLivingRoom ? 'Updates when the backend emits a reading' : 'Auto-refresh every 30 seconds'}</div>
          </div>
          <span className="panel-link">Export CSV →</span>
        </div>
        <div className="readings-list">
          {readings.length === 0 && (
            <div className="mono" style={{ color: 'var(--text-3)', padding: '18px 0' }}>
              Waiting for the first live reading…
            </div>
          )}
          {readings.map((r, i) => (
            <div key={i} className="reading-item">
              <span className="t">{r.t}</span>
              <span className="v">
                <span className={`dot`} style={{ background: r.s === 'yellow' ? 'var(--aerva-yellow)' : 'var(--green)' }} />
                {r.v} {sensor.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
