# 📥 Install Git on Windows

## Quick Install

### Option 1: Download Installer (Recommended)

1. Go to https://git-scm.com/download/win
2. Download **Git for Windows** (64-bit)
3. Run installer
4. Use default settings (just click "Next")
5. Restart terminal/PowerShell after installation

### Option 2: Using Winget (Windows Package Manager)

```powershell
winget install --id Git.Git -e --source winget
```

### Option 3: Using Chocolatey

```powershell
choco install git
```

---

## Verify Installation

After installing, restart your terminal and run:

```bash
git --version
```

You should see: `git version 2.x.x`

---

## After Installation

Then you can run:

```bash
cd C:\Users\Oliwer\Desktop\Cursor\Nocturne\gpt-relay-server
git init
git add .
git commit -m "Initial commit"
```

---

## Alternative: Use Docker Hub Instead

If you don't want to install Git, you can use **Docker Hub** instead (see `DOCKER_HUB_SETUP.md`)

