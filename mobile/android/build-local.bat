@echo off
REM ============================================================
REM  SiMeka - Build APK lokal untuk Windows
REM  Cara pakai: klik ganda file ini, atau jalankan dari CMD:
REM     cd C:\simeka\mobile\android
REM     build-local.bat
REM ============================================================

REM 1. Stop daemon lama supaya konfigurasi baru terbaca
call gradlew.bat --stop

REM 2. Set variabel environment yang dibutuhkan
set NODE_ENV=production

REM 3. Buat folder build ber-path pendek (hindari limit 260 karakter)
if not exist C:\tmp\bd mkdir C:\tmp\bd

REM 4. Jalankan build release; output modul :app dipindah ke folder pendek
call gradlew.bat assembleRelease -PshortBuildDir=C:/tmp/bd

if %errorlevel% neq 0 (
    echo.
    echo BUILD GAGAL. Salin seluruh pesan error dan kirim untuk dibantu.
    pause
    exit /b 1
)

REM 5. Salin APK ke lokasi mudah diakses
copy /Y C:\tmp\bd\outputs\apk\release\app-release.apk C:\simeka\app-release.apk 2>nul || copy /Y app\build\outputs\apk\release\app-release.apk C:\simeka\app-release.apk
echo.
echo ============================================================
echo  BUILD SUKSES!
echo  APK   : C:\simeka\app-release.apk
echo  Copy file APK ke HP lalu instal.
echo ============================================================
pause
