@echo off
docker compose up -d --build
start http://localhost:8080/
pause
