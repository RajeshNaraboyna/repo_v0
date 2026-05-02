# Runs ngrok on port 4001, restarting every 1.5 hours.

$NGROK_PORT = 4001
$INTERVAL   = 5400  # 1.5 hours in seconds

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Stopping existing ngrok on port $NGROK_PORT..."
    Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Starting ngrok http $NGROK_PORT..."
    $proc = Start-Process ngrok -ArgumentList "http $NGROK_PORT" -PassThru -NoNewWindow
    Write-Host "[$timestamp] ngrok started (PID: $($proc.Id)). Next restart in 1.5 hours."

    Start-Sleep -Seconds $INTERVAL
}
