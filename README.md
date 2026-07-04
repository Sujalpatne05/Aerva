# AERVA - Air Quality Monitoring System

## Project Structure

```
Averaaaaa/
├── aerva-backend-main/     # Backend API (Node.js + Express + Socket.IO)
└── aerva-react/             # Frontend App (React + Vite + PWA)
```

## Setup & Run

### 1. Backend Setup

```bash
cd aerva-backend-main
npm install
npm start
```

Backend will run on: **http://localhost:3000**

### 2. Frontend Setup

```bash
cd aerva-react
npm install
npm run dev
```

Frontend will run on: **http://localhost:5173**

## API Integration

The frontend is already connected to the backend at `http://localhost:3000`

### Available Endpoints:

- **GET** `/api/dashboard/` - Get latest sensor data
- **GET** `/api/dashboard/graph` - Get chart data (requires: device_mac, metric, range)
- **GET** `/api/reports/export` - Download Excel report
- **GET** `/api/reports/export-pdf` - Download PDF report

### Socket.IO Live Updates:

The frontend listens to `/api/dashboard/` event for real-time sensor data updates.

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000
```

## Documentation

- Backend API docs: `aerva-backend-main/docs/frontend-api.md`

## Tech Stack

### Backend
- Node.js + Express
- Socket.IO (real-time updates)
- PostgreSQL (database)
- MQTT (IoT communication)

### Frontend
- React 18
- Vite (build tool)
- Recharts (data visualization)
- Socket.IO Client (real-time)
- PWA (Progressive Web App)
