# Environment Configuration Guide

This document explains how to configure environment variables for the pulse-ai project across different environments (development, staging, production).

## Overview

The project uses environment variables to manage configuration that varies between environments. This includes:

- **API Server Configuration**: Port, CORS origins, database connection
- **Authentication**: Firebase credentials
- **Third-party Services**: Anthropic API key for content summarization
- **Scheduler Settings**: Daily fetch timing and timezone
- **Frontend Configuration**: API URLs, ports, proxy settings

---

## Backend Setup

### 1. Create `.env` from Template

```bash
cd backend
cp .env.example .env
```

### 2. Configure Required Variables

Edit `backend/.env` and fill in:

```env
# Server Port
PORT=3001

# MongoDB Connection URI
MONGODB_URI=mongodb://localhost:27017/pulse-ai

# Anthropic API Key (for Claude summarization)
# Get from: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-xxxxx...

# CORS Allowed Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,https://pulse-ai.in,https://www.pulse-ai.in

# Firebase Service Account
# Place your firebase-service-account.json in the backend directory
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Scheduler Configuration
SCHEDULER_CRON_TIME=0 8 * * *     # Daily at 8 AM
SCHEDULER_TIMEZONE=Asia/Kolkata

# Cache TTL (seconds)
FEED_CACHE_TTL=3600               # 1 hour
```

### 3. Important Notes

- **MongoDB**: Ensure MongoDB is running on `localhost:27017` or update `MONGODB_URI`
- **Firebase**: Download your service account JSON from Firebase Console and place in `backend/firebase-service-account.json`
- **Anthropic API Key**: Get from https://console.anthropic.com (optional - if not set, summaries will use raw excerpts)

---

## Frontend Setup

### 1. Create `.env.local` from Template

```bash
cd frontend
cp .env.example .env.local
```

### 2. Configure Required Variables

Edit `frontend/.env.local`:

```env
# API Base URL (adjust based on environment)
VITE_API_URL=http://localhost:3001

# Firebase Configuration
# Get these from your Firebase Console
VITE_FIREBASE_API_KEY=AIzaSyB9hQsc_...
VITE_FIREBASE_AUTH_DOMAIN=pulse-ai-db2aa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pulse-ai-db2aa
VITE_FIREBASE_STORAGE_BUCKET=pulse-ai-db2aa.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=692358705188
VITE_FIREBASE_APP_ID=1:692358705188:web:cc1319f08f815a12afa8b1
VITE_FIREBASE_MEASUREMENT_ID=G-QJ0G5RYD1N

# Vite Dev Server Configuration
VITE_DEV_PORT=5173
VITE_ALLOWED_HOSTS=localhost,127.0.0.1,pulse-ai.in,www.pulse-ai.in
VITE_PROXY_TARGET=http://localhost:3001
```

### 3. Important Notes

- **Firebase Config**: Get all values from Firebase Console under Project Settings
- **VITE_API_URL**: Adjust based on environment:
  - Development: `http://localhost:3001`
  - Production: `https://api.pulse-ai.in` (your API domain)

---

## Environment-Specific Configurations

### Development

**Backend (.env)**
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/pulse-ai
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Frontend (.env.local)**
```env
VITE_API_URL=http://localhost:3001
VITE_DEV_PORT=5173
```

### Production

**Backend (.env.production)**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/pulse-ai
CORS_ORIGINS=https://pulse-ai.in,https://www.pulse-ai.in,https://api.pulse-ai.in
SCHEDULER_CRON_TIME=0 8 * * *
SCHEDULER_TIMEZONE=Asia/Kolkata
```

**Frontend (.env.production)**
```env
VITE_API_URL=https://api.pulse-ai.in
```

---

## Running the Project

### Backend

```bash
cd backend
npm install
npm start        # Production mode
npm run dev      # Development with nodemon
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Security Best Practices

⚠️ **Important**: Never commit `.env` files to Git. The `.gitignore` is configured to prevent this.

1. **Git Ignore**: All `.env*` files except `.env.example` are ignored
2. **Secrets**: Store sensitive data (API keys, database URLs) only in `.env` files
3. **Template Files**: Use `.env.example` as documentation for required variables
4. **Firebase**: Never commit `firebase-service-account.json` - it's in `.gitignore`
5. **API Keys**: Rotate API keys periodically and remove old ones from Firebase Console

---

## Troubleshooting

### Backend Won't Start

- **MongoDB Error**: Ensure MongoDB is running
  ```bash
  # macOS/Linux
  brew services start mongodb-community
  
  # Windows (if installed as service)
  net start MongoDB
  ```
- **Port Already in Use**: Change `PORT` in `.env` or kill process using port 3001
- **Firebase Error**: Ensure `firebase-service-account.json` exists and path is correct

### Frontend Can't Connect to Backend

- **CORS Error**: Check `CORS_ORIGINS` in backend `.env` includes your frontend URL
- **Proxy Not Working**: Ensure `VITE_PROXY_TARGET` matches backend URL
- **API URL**: Verify `VITE_API_URL` in frontend `.env.local`

### Anthropic API Issues

- **Missing Key**: Get from https://console.anthropic.com
- **Rate Limit**: Check Anthropic dashboard for usage
- **No Summaries**: If key is missing, fallback uses raw excerpts

---

## Environment Variables Reference

### Backend

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| PORT | 3001 | No | Default: 3001 |
| MONGODB_URI | mongodb://localhost:27017/pulse-ai | Yes | Connection string |
| ANTHROPIC_API_KEY | sk-ant-... | No | Optional - uses fallback if missing |
| CORS_ORIGINS | http://localhost:5173,https://pulse-ai.in | Yes | Comma-separated origins |
| FIREBASE_SERVICE_ACCOUNT_PATH | ./firebase-service-account.json | Yes | Path to service account JSON |
| SCHEDULER_CRON_TIME | 0 8 * * * | No | Cron schedule (default: 8 AM daily) |
| SCHEDULER_TIMEZONE | Asia/Kolkata | No | IANA timezone |
| FEED_CACHE_TTL | 3600 | No | TTL in seconds (default: 30 min) |
| NODE_ENV | development | No | development \| production |

### Frontend

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| VITE_API_URL | http://localhost:3001 | Yes | Backend API URL |
| VITE_FIREBASE_* | (see .env.example) | Yes | All 7 Firebase config values |
| VITE_DEV_PORT | 5173 | No | Dev server port |
| VITE_ALLOWED_HOSTS | localhost,127.0.0.1 | No | Comma-separated hosts |
| VITE_PROXY_TARGET | http://localhost:3001 | No | Backend proxy target |

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env` in both backend and frontend
- [ ] Fill in all required variables
- [ ] Ensure MongoDB is running
- [ ] Place Firebase service account JSON in backend folder
- [ ] Run `npm install` in both directories
- [ ] Start backend: `npm start` (or `npm run dev`)
- [ ] Start frontend: `npm run dev`
- [ ] Access application at http://localhost:5173

