# 🚀 Quick Start Guide

## Run Your AERVA Application

### Option 1: Two Terminals (Recommended)

**Terminal 1 - Backend:**
```bash
cd aerva-backend-main
npm start
```
✅ Wait for: `http server running on port 3000`

**Terminal 2 - Frontend:**
```bash
cd aerva-react
npm run dev
```
✅ Open: http://localhost:5173

### Option 2: PowerShell (Windows)

Run backend and frontend together:
```powershell
# Terminal 1
cd aerva-backend-main; npm start

# Terminal 2
cd aerva-react; npm run dev
```

## What to Expect

1. **Backend starts** → Port 3000
   - API endpoints available
   - Socket.IO listening
   - MQTT client connecting

2. **Frontend starts** → Port 5173
   - React app loads
   - Connects to backend via Socket.IO
   - Real-time data starts flowing

3. **Open browser** → http://localhost:5173
   - Dashboard shows sensor data
   - Live updates via WebSocket
   - Charts display historical data

## Verify Connection

Open browser console (F12) and look for:
```
Socket connected: <socket-id>
```

This confirms frontend ↔ backend connection is working!

## Stop Servers

Press `Ctrl+C` in each terminal to stop the servers.

---

**That's it! Your full-stack AERVA app is running locally! 🎉**
