#!/bin/bash
# Runs ngrok on port 4001, restarting every 1.5 hours.

NGROK_PORT=4001
INTERVAL=5400  # 1.5 hours in seconds

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping existing ngrok on port $NGROK_PORT..."
    pkill -f "ngrok.*$NGROK_PORT" 2>/dev/null || true
    sleep 2

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting ngrok http $NGROK_PORT..."
    ngrok http "$NGROK_PORT" &
    NGROK_PID=$!
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ngrok started (PID: $NGROK_PID). Next restart in 1.5 hours."

    sleep "$INTERVAL"
done
