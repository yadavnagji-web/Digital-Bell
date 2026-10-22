@echo off
title Digital Bell (Web Browser Mode)
cd /d "%~dp0"
start http://localhost:3000
node server.js
