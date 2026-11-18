@echo off
setlocal
cd /d "%~dp0"
title Disqueria - levantar proyecto

echo.
echo ===== Disqueria: levantar el proyecto sin Docker =====
echo.

rem ---- 1. Verificar programas ----
where node >nul 2>nul
if errorlevel 1 (
  echo [X] No encontre Node.js. Instalalo desde https://nodejs.org y volve a abrir este archivo.
  goto :fin_error
)

set "MYSQL="
for /d %%D in ("%ProgramFiles%\MySQL\MySQL Server*") do if exist "%%D\bin\mysql.exe" set "MYSQL=%%D\bin\mysql.exe"
if not defined MYSQL (
  where mysql >nul 2>nul && set "MYSQL=mysql"
)
if not defined MYSQL (
  echo [X] No encontre MySQL Server. Instalalo con MySQL Installer.
  goto :fin_error
)

set "MONGOSH="
where mongosh >nul 2>nul && set "MONGOSH=mongosh"
if not defined MONGOSH if exist "%LOCALAPPDATA%\Programs\mongosh\mongosh.exe" set "MONGOSH=%LOCALAPPDATA%\Programs\mongosh\mongosh.exe"
if not defined MONGOSH if exist "%ProgramFiles%\mongosh\mongosh.exe" set "MONGOSH=%ProgramFiles%\mongosh\mongosh.exe"
if not defined MONGOSH (
  echo [X] No encontre mongosh. Instala mongosh-2.14.2-x64.msi desde Descargas.
  goto :fin_error
)

sc query MongoDB | find "RUNNING" >nul 2>nul
if errorlevel 1 (
  echo [X] El servicio de MongoDB no esta corriendo.
  echo     Instala MongoDB Server con "Install MongoD as a Service" o inicialo desde Servicios de Windows.
  goto :fin_error
)

echo [OK] Node, MySQL, MongoDB y mongosh encontrados.
echo.

rem ---- 2. Conectar a MySQL ----
set /p "MYSQL_PWD=Contrasena de root de MySQL: "
"%MYSQL%" -u root -e "SELECT 1" >nul 2>nul
if errorlevel 1 (
  echo [X] No pude conectarme a MySQL con esa contrasena. Revisa que MySQL este corriendo y la contrasena sea correcta.
  goto :fin_error
)
echo [OK] Conectado a MySQL.
echo.

rem ---- 3. Cargar las bases (opcional) ----
choice /c SN /m "Cargar (o recargar desde cero) las bases MySQL y MongoDB"
if errorlevel 2 goto :configurar

echo Cargando MySQL...
"%MYSQL%" -u root --default-character-set=utf8mb4 < database\modelo_relacional.sql || goto :error_carga
"%MYSQL%" -u root --default-character-set=utf8mb4 < database\datos_iniciales.sql || goto :error_carga
echo [OK] MySQL cargado.

echo Cargando MongoDB (tarda unos segundos)...
"%MONGOSH%" --quiet database\scripts_nosql\01_importar.js || goto :error_carga
"%MONGOSH%" --quiet database\scripts_nosql\02_indices.js || goto :error_carga
echo [OK] MongoDB cargado.
echo.

:configurar
rem ---- 4. Configurar el backend ----
>backend\.env echo PORT=3000
>>backend\.env echo MYSQL_HOST=localhost
>>backend\.env echo MYSQL_PORT=3306
>>backend\.env echo MYSQL_USER=root
>>backend\.env echo MYSQL_PASSWORD=%MYSQL_PWD%
>>backend\.env echo MYSQL_DATABASE=disqueria
>>backend\.env echo MONGO_URI=mongodb://localhost:27017
>>backend\.env echo MONGO_DB=disqueria
echo [OK] backend\.env configurado.

rem ---- 5. Instalar dependencias (solo la primera vez) ----
if not exist backend\node_modules (
  echo Instalando dependencias del backend...
  pushd backend & call npm install & popd
)
if not exist frontend\node_modules (
  echo Instalando dependencias del frontend...
  pushd frontend & call npm install & popd
)

rem ---- 6. Levantar backend y frontend ----
echo.
echo Abriendo el backend y el frontend en dos ventanas nuevas (no las cierres mientras uses la pagina).
start "Disqueria - backend" /d "%~dp0backend" cmd /k npm run dev
start "Disqueria - frontend" /d "%~dp0frontend" cmd /k npm run dev
timeout /t 10 /nobreak >nul
start "" http://localhost:5173

echo.
echo [OK] Listo. La pagina esta en http://localhost:5173
echo     Usuario de prueba: demo@disqueria.com / demo1234
echo     Para apagar todo, cerra las ventanas del backend y del frontend.
echo.
pause
exit /b 0

:error_carga
echo [X] Fallo la carga de las bases. Revisa el mensaje de arriba.

:fin_error
echo.
pause
exit /b 1
