# SDN-NDIS — Local Desktop Setup & Re-Installation Guide

**System:** Surigao del Norte Natural Disaster Web-Based Information System (`SDN-NDIS`)  
**Stack:** Laravel 12 + Inertia.js v2 + Vue 3 + Tailwind CSS v4 + MySQL 8.0 + Leaflet GIS

This guide contains the exact installers, versions, `php.ini` configuration, and terminal commands used on the original development laptop so you can set up and run this project on any new Windows desktop from scratch.

---

## 1. Required Software & Official Installers

Install these 5 standalone tools on the new Windows PC:

### A. Node.js (`v24.13.0` 64-bit)
- **Original Install Path:** `C:\Program Files\nodejs\node.exe`
- **Installer Type:** Official Windows `.msi` Installer (64-bit)
- **Direct Download (`v24.13.0`):** https://nodejs.org/dist/v24.13.0/node-v24.13.0-x64.msi
- **All Downloads Page:** https://nodejs.org/en/download

### B. Git for Windows (`v2.38.1` or newer, 64-bit)
- **Original Install Path:** `C:\Program Files\Git\cmd\git.exe`
- **Installer Type:** Official Git for Windows Setup (includes **Git Bash / MINGW64**)
- **Official Download Page:** https://git-scm.com/download/win
- **Exact `v2.38.1` Release:** https://github.com/git-for-windows/git/releases/tag/v2.38.1.windows.1

### C. PHP (`v8.5.3` VS17 x64 Thread Safe)
- **Original Install Path:** `C:\php8.5\php.exe`
- **Installer Type:** Official Windows PHP `.zip` binary extracted to `C:\php8.5`
- **Prerequisite:** Install [Microsoft Visual C++ Redistributable (x64)](https://aka.ms/vs/17/release/vc_redist.x64.exe) first.
- **Official Download Page:** https://windows.php.net/download/
- **Releases Archive:** https://windows.php.net/downloads/releases/
- **Setup Steps for PHP (`C:\php8.5`):**
  1. Extract the downloaded PHP `.zip` into `C:\php8.5`.
  2. Add `C:\php8.5` to your Windows **System Environment Variables → `Path`**.
  3. Copy `C:\php8.5\php.ini-development` and rename the copy to `C:\php8.5\php.ini`.
  4. Open `C:\php8.5\php.ini` in Notepad/VS Code and uncomment (remove the leading `;`) on these lines:
     ```ini
     extension_dir = "ext"
     extension=curl
     extension=fileinfo
     extension=gd
     extension=intl
     extension=mbstring
     extension=mysqli
     extension=openssl
     extension=pdo_mysql
     extension=zip
     ```

### D. MySQL Community Server (`v8.0.45` Win64)
- **Original Install Path:** `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`
- **Installer Type:** Official MySQL Community Installer for Windows (`.msi`)
- **Official Download Page:** https://dev.mysql.com/downloads/installer/
- **MySQL 8.0 Archive (exact `8.0.45`):** https://downloads.mysql.com/archives/installer/
- *(Tip: Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your Windows `Path` if you want to run `mysql` from the terminal.)*

### E. Composer (`v2.9.5` Dependency Manager for PHP)
- **Original Install Path:** `C:\ProgramData\ComposerSetup\bin\composer.bat`
- **Installer Type:** Official `Composer-Setup.exe` Windows Installer (run **after** setting up PHP in `C:\php8.5\php.exe`)
- **Direct Installer Link:** https://getcomposer.org/Composer-Setup.exe
- **Download Page:** https://getcomposer.org/download/

---

## 2. Verify Installations

Open **PowerShell** or **Git Bash** on the new computer and verify every command works:

```bash
node -v
npm -v
git --version
php -v
composer --version
mysql --version
```

---

## 3. Project Setup on Another Desktop

### Step 1: Clone or Copy the Project Folder
Place the project in your preferred directory (e.g., `D:\www\SDN-NDIS` or `C:\www\SDN-NDIS`):

```bash
cd D:\www\SDN-NDIS
```

### Step 2: Install PHP & Node Dependencies
```bash
composer install
npm install
```

### Step 3: Configure `.env` and Database
1. Copy `.env.example` to `.env` if `.env` does not exist yet:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure your MySQL database connection:
   ```env
   APP_NAME="SDN-NDIS"
   APP_ENV=local
   APP_DEBUG=true
   APP_URL=http://localhost:8000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sdn_ndis
   DB_USERNAME=root
   DB_PASSWORD=
   ```
   *(Update `DB_PASSWORD` if your new MySQL installation has a root password).*

3. Create the `sdn_ndis` database in MySQL:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS sdn_ndis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

4. Generate the Laravel application key:
   ```bash
   php artisan key:generate
   ```

### Step 4: Run Migrations, Seeders & Storage Link
Run this command to create all database tables and seed the 21 Surigao del Norte municipalities, disaster types, roles, and default accounts:

```bash
php artisan migrate --seed
php artisan storage:link
```

### Step 5: Build Frontend Assets
Compile the Vue 3 + Tailwind CSS v4 frontend into `public/build`:

```bash
npm run build
```

---

## 4. Running the System Locally

### Option A: Standard Local Server (`http://localhost:8000`)
```bash
php artisan serve
```
Then open **`http://localhost:8000`** in your browser.

### Option B: Active Development Mode (with Hot Reload)
Run all services together (Laravel server + queue + Vite HMR):
```bash
composer run dev
```

### Option C: Sharing Online via `nport` Tunnel
If you want to share your local server (`port 8000`) online:
1. Terminal 1 — Start Laravel on port `8000`:
   ```bash
   php artisan serve --port=8000
   ```
2. Terminal 2 — Start `nport`:
   ```bash
   npx nport 8000 -s sdn-ndis
   ```
   *(Proxy and HTTPS headers for `.nport.link` are already pre-configured in `bootstrap/app.php` and `app/Providers/AppServiceProvider.php`.)*

---

## 5. Default Seeded Login Accounts

After running `php artisan migrate --seed`, you can log in with any of these default accounts:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **HEAD** (Executive) | Head | `head@gmail.com` | `password` |
| **HEAD** (Executive) | Rico Adolfo | `ricoadolfo@gmail.com` | `password` |
| **PDRRMO** (Admin/Operator) | PDRRMO | `pdrrmo@gmail.com` | `password` |
| **GUEST** (Citizen) | GUEST | `guest@gmail.com` | `password` |

