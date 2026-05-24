# Environment Variables Configuration - Summary

## What Was Changed

This document summarizes the environment configuration refactoring done to the pulse-ai project.

### Files Created

#### Backend
- `backend/.env.example` - Template for backend environment variables
- `backend/.env` - Local backend configuration (for development)
- `backend/.env.production.example` - Template for production backend configuration
- `backend/.gitignore` - Git ignore rules specific to backend

#### Frontend  
- `frontend/.env.example` - Template for frontend environment variables
- `frontend/.env.local` - Local frontend configuration (for development)
- `frontend/.env.production.example` - Template for production frontend configuration
- `frontend/.gitignore` - Git ignore rules specific to frontend

#### Root
- `ENV_SETUP.md` - Comprehensive environment setup guide
- `.gitignore` - Enhanced with proper env file handling

---

### Files Modified

#### Backend Code

**1. backend/server.js**
- **Change**: CORS origins now read from `CORS_ORIGINS` environment variable
- **Before**: Hardcoded array of origins
- **After**: Parsed from comma-separated env variable
- **Config**: `CORS_ORIGINS=http://localhost:5173,https://pulse-ai.in`

**2. backend/firebaseAdmin.js**
- **Change**: Firebase service account path now read from `FIREBASE_SERVICE_ACCOUNT_PATH` env variable
- **Before**: Hardcoded require() of local JSON file
- **After**: Dynamic loading from env-specified path with error handling
- **Config**: `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json`

**3. backend/cache.js**
- **Change**: Cache TTL now read from `FEED_CACHE_TTL` environment variable
- **Before**: Hardcoded `30 * 60` seconds (1800s)
- **After**: Read from env with fallback
- **Config**: `FEED_CACHE_TTL=3600` (default: 1800)

**4. backend/scheduler.js**
- **Change**: Cron schedule and timezone now read from environment variables
- **Before**: Hardcoded `"0 8 * * *"` (8 AM daily) and `"Asia/Kolkata"` timezone
- **After**: Read from `SCHEDULER_CRON_TIME` and `SCHEDULER_TIMEZONE` env variables
- **Config**: 
  ```
  SCHEDULER_CRON_TIME=0 8 * * *
  SCHEDULER_TIMEZONE=Asia/Kolkata
  ```

**5. backend/db.js**
- **Change**: Already using `process.env.MONGODB_URI` (no modification needed)
- **Verified**: MongoDB connection string properly sourced from environment

**6. backend/summarizer.js**
- **Change**: Already using `process.env.ANTHROPIC_API_KEY` (no modification needed)
- **Verified**: Anthropic API key properly sourced from environment

#### Frontend Code

**1. frontend/src/firebase.js**
- **Change**: All Firebase configuration now read from environment variables
- **Before**: Hardcoded Firebase config object with secrets exposed in source
- **After**: Loaded from `VITE_FIREBASE_*` environment variables with validation
- **Config Variables**:
  ```
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  VITE_FIREBASE_MEASUREMENT_ID
  ```

**2. frontend/vite.config.js**
- **Change**: Development server config now reads from environment variables
- **Before**: Hardcoded values for allowed hosts, port, and proxy target
- **After**: Dynamically loaded from `VITE_*` env variables
- **Config Variables**:
  ```
  VITE_ALLOWED_HOSTS (comma-separated)
  VITE_DEV_PORT
  VITE_PROXY_TARGET
  VITE_API_URL (existing, cleaned up comments)
  ```

**3. frontend/src/api.js**
- **Change**: Cleaned up commented code, added clear documentation
- **Before**: Multiple commented lines with different BASE_URL approaches
- **After**: Single line with clear fallback and documentation comment
- **Config**: `VITE_API_URL` (defaults to relative path if not set)

#### Backend Vite Config

**backend/vite.config.js**
- **Change**: Updated to use loadEnv for environment variable support
- **Before**: Hardcoded values
- **After**: Uses `loadEnv()` to read from env files

#### Git Ignore Files

**1. Root `.gitignore`**
- Added comprehensive environment file patterns
- Added security-critical file patterns (firebase-service-account.json)
- Added proper negation rules to track `.env.example` files
- Organized into logical sections (env, dependencies, IDE, OS, logs, cache)

**2. `backend/.gitignore`**
- Backend-specific environment and Firebase rules
- Prevents accidental commits of sensitive files

**3. `frontend/.gitignore`**
- Frontend-specific environment rules
- Prevents accidental commits of sensitive files

---

### Environment Variables Mapping

#### Backend

| Variable | Purpose | Example | Type |
|----------|---------|---------|------|
| PORT | Server listening port | 3001 | Number |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/pulse-ai | String |
| ANTHROPIC_API_KEY | Claude API key for summarization | sk-ant-... | String (Secret) |
| NODE_ENV | Environment name | development/production | Enum |
| CORS_ORIGINS | Allowed frontend origins | http://localhost:5173,https://pulse-ai.in | CSV |
| FIREBASE_SERVICE_ACCOUNT_PATH | Path to service account JSON | ./firebase-service-account.json | Path |
| SCHEDULER_CRON_TIME | Daily fetch schedule (cron format) | 0 8 * * * | Cron |
| SCHEDULER_TIMEZONE | Scheduler timezone (IANA) | Asia/Kolkata | String |
| API_BASE_URL | Public API URL | http://localhost:3001 | URL |
| FEED_CACHE_TTL | Cache duration in seconds | 3600 | Number |

#### Frontend

| Variable | Purpose | Example | Type |
|----------|---------|---------|------|
| VITE_API_URL | Backend API endpoint | http://localhost:3001 | URL |
| VITE_FIREBASE_API_KEY | Firebase API key | AIzaSyB9... | String (Secret) |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase auth domain | pulse-ai-db2aa.firebaseapp.com | Domain |
| VITE_FIREBASE_PROJECT_ID | Firebase project ID | pulse-ai-db2aa | String |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase storage bucket | pulse-ai-db2aa.firebasestorage.app | Domain |
| VITE_FIREBASE_MESSAGING_SENDER_ID | FCM sender ID | 692358705188 | String |
| VITE_FIREBASE_APP_ID | Firebase app ID | 1:692358705188:web:cc1319f08f815a12afa8b1 | String |
| VITE_FIREBASE_MEASUREMENT_ID | Google Analytics ID | G-QJ0G5RYD1N | String |
| VITE_DEV_PORT | Dev server port | 5173 | Number |
| VITE_ALLOWED_HOSTS | Allowed dev hosts | localhost,127.0.0.1,pulse-ai.in | CSV |
| VITE_PROXY_TARGET | Proxy target for /api | http://localhost:3001 | URL |

---

### Security Improvements

1. **No Hardcoded Secrets**: All API keys and database URLs moved to env files
2. **Firebase Credentials**: Moved from source code to env variables
3. **Git Protection**: `.gitignore` prevents accidental commits of:
   - `.env` files (all variants)
   - `firebase-service-account.json`
   - `.env.local`, `.env.production`, etc.

4. **Template Documentation**: `.env.example` files serve as:
   - Documentation of required variables
   - Setup guides for new developers
   - Safe files to commit to version control

---

### How to Use

#### For New Developers

1. **Clone the repository**
   ```bash
   git clone <repo>
   cd pulse-ai
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and fill in actual values
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local and fill in actual values
   ```

4. **Start the project**
   ```bash
   # Terminal 1: Backend
   cd backend && npm install && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm install && npm run dev
   ```

#### For Deployment

1. Use `.env.production.example` as reference
2. Create production `.env` files with actual production values
3. Never commit `.env` files
4. Use secure secrets management (e.g., GitHub Secrets, AWS Secrets Manager)

---

### Benefits

✅ **Security**: Secrets no longer in source code  
✅ **Flexibility**: Easy to switch between environments  
✅ **Documentation**: Clear `.env.example` files for new developers  
✅ **Best Practices**: Follows industry standards for env management  
✅ **Maintainability**: Centralized configuration management  
✅ **Scalability**: Easy to add new env variables as needed  

---

### Next Steps

1. ✅ All files have been created and configured
2. ✅ Backend and frontend code updated to read from env files
3. ✅ Git ignore rules configured
4. 👉 **Your action**: Fill in actual values in `.env` and `.env.local` files
5. 👉 **Next**: Review `ENV_SETUP.md` for detailed configuration instructions
