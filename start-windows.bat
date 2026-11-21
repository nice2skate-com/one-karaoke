@echo off
rem DJ KOLJA ONE - Karaoke lokal unter Windows starten (Doppelklick)
cd /d "%~dp0"
start "" http://localhost:8777/
py server.py 8777 || python server.py 8777
pause
