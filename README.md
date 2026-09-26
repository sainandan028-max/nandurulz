# 🎬 Family Movies

> A private family movie library — stream your movie collection directly from Google Drive with a beautiful, TV-friendly interface hosted for free on GitHub Pages.

![Family Movies](https://img.shields.io/badge/Powered_by-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)
![React](https://img.shields.io/badge/Built_with-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

---

## 📖 Overview

Family Movies is a **completely static** web application that turns your Google Drive folder into a Netflix-like streaming experience for your family. No server needed — just a GitHub Pages site reading your movie files straight from Google Drive.

### How It Works

```
Google Drive (Movies Folder) ──→ Static Website (GitHub Pages) ──→ Family watches on TV/Phone/Desktop
```

- **Google Drive** stores your movie files (MP4, etc.)
- **GitHub Pages** hosts the static frontend
- **No server required** — everything runs in the browser
- **Zero Configuration** — simply drop files in your Drive folder, and the website discovers them automatically

---

## ✨ Features

- 🎥 **Cinematic dark theme** — premium Netflix-like UI
- 📺 **TV remote navigation** — arrow keys, Enter, Back fully supported
- 📱 **Responsive design** — works on phones, tablets, desktops, and Smart TVs
- ▶️ **HTML5 video player** with Google Drive fallback
- 💾 **Remembers playback position** — resume where you left off
- 🔍 **Search** by title, year, or category
- ⚡ **Fast loading** — skeleton screens, lazy poster loading, metadata caching
- 🔄 **Easy admin** — upload a file to Drive, and you're done
- 📋 **Admin Dashboard** — optionally rename movies directly in the website
- 📲 **PWA installable** — can be installed as an app on supported devices
- ♿ **Accessible** — ARIA labels, keyboard navigation, high contrast support

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- A Google account
- A GitHub account

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nandurules.git
cd nandurules

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`.

---

## 🔧 Complete Setup Guide

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name it (e.g., "Family Movies")
4. Click **Create**

### Step 2: Enable Google Drive API

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for **"Google Drive API"**
3. Click **Enable**

### Step 3: Create a Browser API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copy the generated API key
4. Click **"Edit API key"** to add restrictions:
   - **Application restrictions**: HTTP referrers
   - Add your GitHub Pages URL:
     ```
     https://YOUR_USERNAME.github.io/*
     ```
   - Also add localhost for development:
     ```
     http://localhost:3000/*
     ```
   - **API restrictions**: Restrict to **Google Drive API** only
5. Click **Save**

### Step 4: Set Up Google Drive

1. Open [Google Drive](https://drive.google.com/)
2. Create a folder called **"Movies"**
3. Upload your movie files into this folder

**Recommended video format for best compatibility:**
- **Container**: MP4
- **Video codec**: H.264
- **Audio codec**: AAC

4. **Share the folder**:
   - Right-click the "Movies" folder
   - Click **Share**
   - Change access to **"Anyone with the link"** → **Viewer**
   - Click **Done**

5. **Get the folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/ABCDEFG123456789
                                          ↑ This is your FOLDER_ID
   ```

### Step 5: Configure the Application

Edit `src/config/appConfig.ts`:

```typescript
const appConfig: AppConfig = {
  driveFolderId: 'YOUR_ACTUAL_FOLDER_ID',        // From Step 4
  googleApiKey: 'YOUR_ACTUAL_API_KEY',            // From Step 3
  siteName: 'Family Movies',
  catalogMode: { type: 'drive' },                 
};
```

### Step 6: Deploy to GitHub Pages

1. Create a GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nandurules.git
   git push -u origin main
   ```
3. Go to **repository Settings** → **Pages**
4. Under **Source**, select **GitHub Actions**
5. The included `.github/workflows/deploy.yml` will automatically build and deploy

Your site will be available at:
```
https://YOUR_USERNAME.github.io/nandurules/
```

---

## 🎬 How to Add a Movie

The workflow is as simple as possible:

1. **Upload** a movie file to your Google Drive "Movies" folder.
2. **That's it.**

The website will automatically scan the folder and add the movie. It uses the file name as the movie title (automatically cleaning up things like `.mp4` and `1080p`).

### Editing Movie Names (Optional)

If you want to rename a movie on the website (e.g., change "Avatar.2024.1080p.mp4" to just "Avatar"):
1. Go to `#/admin-helper` on your website.
2. Click **Edit** next to the movie.
3. Change the title, year, or category.
4. Click **Save**.

*Note: Changes are saved locally in your browser so you don't need a database or Google Sheet.*

---

## 📺 TV Usage

### Setting Up on Your TV

1. Open the **web browser** on your Smart TV / Android TV / Google TV
2. Navigate to your site URL
3. Bookmark it for easy access

### Navigation

| Key | Action |
|-----|--------|
| ← → | Move between movies |
| ↑ ↓ | Move between sections/rows |
| Enter | Select / Play / Pause |
| Back/Escape | Go back / Exit player |

---

## ⚠️ Known Limitations

- **Google Drive** is not a professional video streaming CDN. Direct HTML5 playback may not work on all browsers/devices. The app provides a graceful fallback to Google's built-in Drive player.
- **No DRM**: This is not DRM-protected content distribution. Shared Drive files can potentially be accessed by anyone with the URL.
- **Device-Specific Progress**: Playback progress and metadata edits are saved per-device in the browser's localStorage. There is no cross-device sync.

---

## 📄 License

This project is private family software. Modify and use as needed for your family.
