# CarbonTrack — AI-Powered Sustainability Platform

CarbonTrack is a full-stack web application for tracking personal carbon footprints, receiving AI-powered sustainability advice, and syncing data across devices.

## Features

- **Firebase Authentication** — Email/password, Google login, password reset, session persistence
- **MongoDB Atlas** — Persistent storage for users, activities, chat history, and challenges
- **Carbon Coach** — Gemini AI chatbot with personalized advice based on your emission data
- **AI Insights Dashboard** — Weekly/monthly summaries, carbon scores, improvement opportunities
- **Activity Tracking** — Log, edit, delete activities with automatic CO2 calculations
- **Dashboard Analytics** — Chart.js visualizations for weekly/monthly trends and category breakdown
- **Protected Routes** — All app views require authentication

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (ES modules) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | Firebase Auth + Firebase Admin SDK |
| AI | Google Gemini API |
| Charts | Chart.js |
| Deployment | Render |

## Project Structure

```
carbontrack/
├── backend/
│   ├── server.js              # Express entry point
│   ├── config/                  # DB & Firebase config
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # API route definitions
│   ├── controllers/             # Request handlers
│   ├── middleware/              # Auth, error handling
│   └── services/                # Gemini AI, analytics
├── src/
│   ├── app.js                   # Frontend controller
│   ├── components/              # View modules
│   ├── services/                # API & auth clients
│   ├── charts/                  # Chart.js wrappers
│   ├── data/                    # Emission factors
│   └── utils/                   # Helpers, validation
├── login.html                   # Login page
├── register.html                # Registration page
├── forgot-password.html         # Password reset
├── index.html                   # Main app (protected)
└── .env.example                 # Environment template
```

## Setup

### 1. Clone and install

```bash
cd carbontrack
npm run install:backend
cp .env.example .env
```

### 2. Configure Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Email/Password** and **Google** authentication
3. Generate a service account key (Project Settings → Service Accounts)
4. Copy public config and admin credentials to `.env`

### 3. Configure MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist your IP (or `0.0.0.0/0` for Render)
3. Copy the connection string to `MONGO_URI` in `.env`

### 4. Configure Gemini API

1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set `GEMINI_API_KEY` in `.env`

### 5. Run locally

```bash
npm start
```

Open `http://localhost:4173/login.html`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/config` | Public Firebase config |
| POST | `/api/auth/register` | Create user profile |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/activities` | List activities |
| POST | `/api/activities` | Create activity |
| PUT | `/api/activities/:id` | Update activity |
| DELETE | `/api/activities/:id` | Delete activity |
| POST | `/api/activities/sync` | Migrate localStorage data |
| GET | `/api/dashboard` | Dashboard metrics |
| GET | `/api/dashboard/insights` | AI insights |
| POST | `/api/chatbot` | Send chat message |
| GET | `/api/chatbot/history` | Chat history |
| DELETE | `/api/chatbot/history/:id` | Delete chat |
| PUT | `/api/users/profile` | Update profile |

All endpoints except `/api/auth/config` require a Firebase Bearer token.

## Deploy to Render

1. Push the repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set build command: `npm install --prefix backend`
4. Set start command: `node backend/server.js`
5. Add all environment variables from `.env.example`
6. For `FIREBASE_PRIVATE_KEY`, paste the key with `\n` for newlines

Alternatively, use the included `render.yaml` for Blueprint deployment.

## Security

- Firebase JWT verification on all protected API routes
- Helmet security headers
- Rate limiting (200 req/15min general, 10 req/min chat)
- Input validation with express-validator
- Secrets stored in environment variables only
- MongoDB URI, Gemini key, and Firebase admin credentials never exposed to client

## License

Private — CarbonTrack MVP
