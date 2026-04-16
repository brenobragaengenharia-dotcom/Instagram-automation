@echo off
REM Agenda o publish para rodar todo dia às 7h da manhã
REM Execute este arquivo uma vez como Administrador

set PASTA=%~dp0
set NODEJS=%APPDATA%\..\Local\Programs\node\node.exe

schtasks /create ^
  /tn "3W Instagram Feed" ^
  /tr "cmd /c cd /d \"%PASTA%\" && npm run publish >> \"%PASTA%logs.txt\" 2>&1" ^
  /sc daily ^
  /st 07:00 ^
  /f

echo.
echo Tarefa agendada com sucesso!
echo O feed sera atualizado todo dia as 07:00.
echo Log em: %PASTA%logs.txt
echo.
pause
