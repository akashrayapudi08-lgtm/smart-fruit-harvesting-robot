@echo off
title Smart Fruit Harvesting Robot - Live Online Sharing
cd /d "%~dp0"
echo ======================================================================
echo  DESIGN AND DEVELOPMENT OF A SMART FRUIT HARVESTING ROBOT
echo  Live Public Web Simulation Share Tunnel
echo ======================================================================
echo.
echo Starting local server and creating public shareable HTTPS link...
echo.

start "Local Server" python -u run_simulation.py
timeout /t 2 /nobreak >nul

echo Starting public tunnel on port 8080...
echo.
echo Your public link will appear below (Share it with anyone):
echo ======================================================================
npx.cmd -y localtunnel --port 8080 --subdomain smart-fruit-robot-demo
pause

