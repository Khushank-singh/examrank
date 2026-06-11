# ExamRank — JEE & NEET Rank Predictor

A full-stack web application that predicts entrance exam ranks for **JEE Main** and **NEET** students based on their subject-wise marks. Built as a portfolio project to demonstrate full-stack development, system design, and real-world deployment.

---

## What It Does

A student enters their Physics, Chemistry, and Maths (JEE) or Biology (NEET) marks. The app instantly returns:

- Predicted rank based on historical exam data
- Percentile score among all appearing students
- Confidence score for the prediction
- An interactive marks vs rank curve showing their position on the distribution
- Personalised motivation and college recommendations based on the predicted rank

All predictions are saved and accessible from the History tab, with search, filter by exam, trend chart, and a clear history option.

---

## Tech Stack

**Frontend**
- React 18 (Vite)
- Framer Motion — page transitions and animated result cards
- Recharts — marks vs rank area chart with reference dot
- Custom CSS-in-JS — no Tailwind dependency at runtime

**Backend**
- Node.js + Express
- PostgreSQL (via `pg` pool) — hosted on Render
- JWT authentication — tokens stored in localStorage, verified on every protected route
- bcrypt — password hashing
- express-rate-limit — 100 requests per 15 minutes per IP

**Deployment**
- Frontend → Vercel
- Backend → Render (free tier, keep-alive via UptimeRobot)

---

## How the Prediction Engine Works

There is no external ML model. Rank prediction is done entirely inside `server.js` using **linear interpolation** on lookup tables built from real JEE and NEET historical data.

```
interpolate(marks, table, totalStudents)
```

The function finds where the submitted marks fall between two known data points and linearly interpolates the rank. For example:

```
JEE: 260 marks → rank ~900   (99.92nd percentile among 1.2M students)
JEE: 200 marks → rank ~30000 (97.50th percentile)
JEE: 120 marks → rank ~240000 (80.00th percentile)

NEET: 660 marks → rank ~6000  (99.74th percentile among 2.3M students)
NEET: 580 marks → rank ~120000 (94.78th percentile)
NEET: 480 marks → rank ~700000 (69.57th percentile)
```

Percentile is calculated as:
```
percentile = ((totalStudents - rank) / totalStudents) * 100
```

Confidence is calculated from how high the score sits within the valid range:
```
confidence = 70 + (normalised_score * 29)    → range: 70% to 99%
```

---

## Architecture

```
User Browser
    │
    ▼
React Frontend (Vercel)
    │  POST /predict   { physics, chemistry, maths/biology, stream }
    │  GET  /history
    │  DELETE /history
    │  POST /auth/login
    │  POST /auth/signup
    ▼
Express Backend (Render)
    │
    ├── authMiddleware.js  →  verifies JWT on every protected route
    ├── auth.js            →  signup / login routes
    ├── server.js          →  predict, history, clear history routes
    │       │
    │       ├── interpolate()         rank prediction
    │       ├── calculatePercentile() percentile from rank
    │       └── calculateConfidence() confidence from normalised marks
    │
    ▼
PostgreSQL Database (Render)
    ├── users       (id, name, email, password, is_verified, created_at)
    └── predictions (id, user_id, stream, physics, chemistry, maths,
                     biology, total, predicted_rank, percentile,
                     confidence, created_at)
```

---

## Project Structure

```
examrank-frontend/
├── src/
│   ├── App.jsx          main dashboard — prediction form, results, routing
│   ├── Auth.jsx         login and signup page
│   ├── History.jsx      prediction history with search, filter, trend chart
│   └── RankChart.jsx    marks vs rank area chart (Recharts)
├── backend/
│   ├── server.js        Express app, prediction engine, all API routes
│   ├── auth.js          signup and login routes
│   ├── authMiddleware.js JWT verification middleware
│   └── db.js            PostgreSQL connection pool
├── .env                 VITE_API_URL
└── README.md
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/health` | No | Health check |
| POST | `/predict` | JWT | Predict rank, saves to DB |
| GET | `/history` | JWT | Fetch last 50 predictions |
| DELETE | `/history` | JWT | Clear all predictions |

---

## Local Setup

**Clone the repo**
```bash
git clone https://github.com/Khushank-singh/examrank.git
cd examrank-frontend
```

**Frontend**
```bash
npm install
```

Create `.env` in the root:
```
VITE_API_URL=http://localhost:4000
```

```bash
npm run dev
```

**Backend**
```bash
cd backend
npm install
```

Create `.env` in `backend/`:
```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=4000
```

```bash
node server.js
```

The backend auto-creates the `users` and `predictions` tables on first start.

---

## Deployment Notes

- Frontend is deployed on **Vercel** — push to `main` auto-deploys
- Backend is deployed on **Render** free tier — spins down after 15 minutes of inactivity
- To prevent cold starts, the frontend fires a `/health` ping on page load and UptimeRobot pings the backend every 14 minutes
- The `CORS` whitelist includes both `localhost:5173` and the production Vercel URL

---

## Authentication Flow

1. User signs up — password is hashed with bcrypt (10 rounds), stored in PostgreSQL, account is immediately active
2. User logs in — bcrypt compares password, server returns a JWT signed with `JWT_SECRET` (7 day expiry)
3. Frontend stores token in `localStorage`
4. Every protected request sends `Authorization: Bearer <token>`
5. `authMiddleware.js` verifies the token and attaches `userId` to the request

---

## Author

**Khushank Singh** — B.Tech CSE

---

## Purpose

Portfolio project demonstrating full-stack development, REST API design, JWT authentication, PostgreSQL integration, interpolation-based prediction logic, and production deployment on Vercel and Render.
