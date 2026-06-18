#!/bin/bash
# Startup Orchestrator for Lumen Clinical AI Workstation & OpenVINO Server

# Terminate any existing servers on port 8000 and Vite's dev port 3000
echo "Cleaning up any old running instances..."
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
pkill -f "server_host.py" 2>/dev/null || true

# Start the OpenVINO FastAPI server in the background using the host's virtual environment
echo "Starting OpenVINO Host Model Server on http://127.0.0.1:8000..."
VENV_PYTHON="./.venv/bin/python3"
if [ ! -f "$VENV_PYTHON" ]; then
    VENV_PYTHON="python3"
fi
$VENV_PYTHON server/server_host.py > openvino_server.log 2>&1 &
OPENVINO_PID=$!

# Wait for the OpenVINO server to start up
sleep 3

# Start the Vite Frontend Server
echo "Starting Lumen Clinical Workstation (Vite Dev Server)..."
npm run dev > vite_frontend.log 2>&1 &
VITE_PID=$!

# Wait a moment for ports to bind
sleep 2

# Open the browser to Lumen
echo "Opening Lumen Workstation in browser..."
xdg-open "http://localhost:3000" 2>/dev/null || sensible-browser "http://localhost:3000" 2>/dev/null

echo "----------------------------------------------------------"
echo "Lumen Clinical AI Workstation & OpenVINO Server are running!"
echo "  - OpenVINO Model Server PID: $OPENVINO_PID (Logs: openvino_server.log)"
echo "  - Vite Workstation PID: $VITE_PID (Logs: vite_frontend.log)"
echo "----------------------------------------------------------"
echo "Keep this terminal open while testing the application."
echo "Press CTRL+C to stop both servers cleanly."
echo "----------------------------------------------------------"

# Trap CTRL+C and exit signals to clean up background processes
trap "echo -e '\nShutting down servers...'; kill $OPENVINO_PID $VITE_PID 2>/dev/null; exit" INT TERM EXIT
while kill -0 $OPENVINO_PID 2>/dev/null && kill -0 $VITE_PID 2>/dev/null; do
    sleep 1
done
