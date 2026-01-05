# Sri's Garden - Changelog

All notable changes to this project are documented here.

## Version Format
- **[MAJOR]** - Breaking changes, major new features
- **[MINOR]** - New features, significant improvements  
- **[PATCH]** - Bug fixes, small improvements
- **[HOTFIX]** - Critical bug fixes

---

## [v1.0.20] - 2026-01-04

### 🐛 Final Fix | **[HOTFIX]**
- **Homepage Fix**: Removed rogue space in EJS tag restoring interactivity. App is now stable.

---

## [v1.0.19] - 2026-01-04

### 🐛 Stability Fixes | **[HOTFIX]**
- **Homepage Fix**: Resolved EJS syntax error restoring homepage interactivity.
- **Changelog Fix**: Updated Docker config to correctly serve `CHANGELOG.md`.

---

## [v1.0.18] - 2026-01-04

### 🐛 Hotfix | **[HOTFIX]**
- **Dependency Fix**: Downgraded `marked` to support CommonJS environment (fixes cloud crash).

---

## [v1.0.17] - 2026-01-04

### 🚀 Enhancements | **[MINOR]**
- **Changelog Page**: Added `/changelog` route and view to track updates.
- **Image Optimization**: Images are now automatically resized (max 1920px) and compressed on upload for better performance.
- **Fixed**: Syntax error that caused cloud deployment crash.

---

## [v1.0.15] - 2026-01-04

### 🎨 Branding Update | **[MINOR]**
- Added custom "Sri" logo/favicon for browser tabs
- Renamed entire application from "Beautiful Garden" to "Sri's Garden"
- Updated all page titles, headers, footers with new branding
- Added apple-touch-icon for iOS devices

---

## [v1.0.14] - 2026-01-04

### 📷 Image Viewer (Lightbox) | **[MINOR]**
- Added lightbox modal for viewing full-size images
- Images in fullview modal now show "🔍 Click to zoom" hint
- Click any image to open full-size view with dark overlay
- Press Escape to close lightbox (fullview modal stays open)
- Click outside image to close lightbox

### 🐛 Bug Fix | **[PATCH]**
- Fixed EJS syntax error (`<% -` → `<%-`) causing plantsData to render empty

---

## [v1.0.13] - 2026-01-04

### 🐛 Critical Bug Fix | **[HOTFIX]**
- Fixed missing `await` on Plant.find() query chain in index route
- Plants data was not being passed to EJS template correctly
- Fullview modal now works correctly on cloud deployment

### 🔧 Deployment Fix | **[PATCH]**
- Fixed Docker image platform mismatch (ARM64 → AMD64 for cloud)

---

## [v1.0.12] - 2026-01-03

### 📤 Upload Improvements | **[MINOR]**
- Real-time upload progress with percentage and speed
- File validation (10MB images, 1GB videos)
- Visual previews before upload
- Drag & drop support

---

## [v1.0.11] - 2026-01-03

### 🖼️ Media Display | **[MINOR]**
- Show both image and video in version cards
- Delete button for removing media
- Media type badges (📷 Image, 🎬 Video)

---

## [v1.0.10] - 2026-01-03

### 🌱 Plant Growth Tracker | **[MAJOR]**
- Version-based growth tracking (V1→V2→V3→V4)
- V1: Soil Ready, V2: Sprouts, V3: Growing, V4: Harvest Ready
- Fullview modal showing all version stages
- Version progress indicators on plant cards

---

## [v1.0.9] - 2026-01-02

### 💾 Persistence | **[MAJOR]**
- In-memory database with JSON file persistence
- Data survives pod restarts
- Automatic save on data changes

---

## [v1.0.8] - 2026-01-02

### ☁️ Cloud Deployment | **[MAJOR]**
- Helm chart for Kubernetes deployment
- Deployed to garden.srinivaskona.life
- SSL certificate via Let's Encrypt
- Persistent volume for uploads

---

## [v1.0.1 - v1.0.7] - 2025-12-31 to 2026-01-01

### 🏗️ Initial Development | **[MAJOR]**
- Basic Express.js app structure
- Plant CRUD operations
- Admin dashboard
- Authentication system
- CSS styling with modern design
- Hero section with background image

---

## Importance Levels

| Level | Description | Example |
|-------|-------------|---------|
| **[MAJOR]** | New features, breaking changes | New version tracking system |
| **[MINOR]** | Improvements, new UI features | Lightbox for images |
| **[PATCH]** | Small fixes, optimizations | EJS syntax fix |
| **[HOTFIX]** | Critical production bugs | Missing await fix |
