# 🚀 ExamRank — Entrance Exam Rank Predictor

ExamRank is a production-level full-stack web application that predicts entrance exam ranks for **JEE Main (PCM)** and **NEET (PCB)** using a realistic interpolation-based prediction engine.

It includes authentication, prediction history, percentile calculation, confidence score, and interactive charts.

---

# 🌟 Features

• Predict rank for JEE and NEET  
• Realistic interpolation prediction engine  
• Percentile calculation  
• Confidence score  
• Interactive Rank vs Marks chart  
• Secure login and signup (JWT authentication)  
• Prediction history tracking  
• Modern animated UI (TailwindCSS + Framer Motion)  
• Fully responsive (mobile, tablet, desktop)  
• Microservice architecture  

---

# 🧠 Prediction Engine

ExamRank uses interpolation based on real exam trends.

Example NEET predictions:

Marks | Rank  
720 | 1  
700 | ~100  
650 | ~13000  
600 | ~95000  

Example JEE predictions:

Marks | Rank  
300 | 1  
250 | ~3200  
200 | ~35000  

This ensures accurate predictions.

---

# 🏗️ Architecture

Frontend (React + TailwindCSS)  
↓  
Backend (Node.js + Express)  
↓  
ML Microservice (Python Flask)  
↓  
Interpolation Engine  
↓  
SQLite Database  

---

# 💻 Tech Stack

Frontend:  
React  
TailwindCSS  
Framer Motion  
Recharts  
Vite  

Backend:  
Node.js  
Express.js  
SQLite  
JWT Authentication  

ML Service:  
Python  
Flask  

Deployment:  
Vercel (Frontend)  
Render (Backend & ML Service)  

---

# 📁 Project Structure

examrank-frontend/

src/
App.jsx
Auth.jsx
History.jsx
RankChart.jsx

backend/
server.js
db.js
auth.js
authMiddleware.js

ml-service/
app.py

README.md
package.json

---

# ⚙️ Installation

Clone repository:

git clone https://github.com/YOUR_USERNAME/examrank.git

cd examrank-frontend

Install frontend dependencies:

npm install

Install backend dependencies:

cd backend
npm install

Install ML service dependencies:

cd ../ml-service
pip install flask

---

# ▶️ Run Application

Start ML service:

cd ml-service
python app.py

Start backend:

cd backend
node server.js

Start frontend:

npm run dev

---

# 📊 Example Prediction Response

{
total_marks: 505,
predicted_rank: 590000,
percentile: 74.35,
confidence: 88.2
}

---

# 🔐 Authentication

Includes:

• Signup and login  
• JWT authentication  
• Protected routes  
• Prediction history  

---

# 📱 Responsive UI

Supports mobile, tablet, and desktop.

---

# 🚀 Deployment Ready

Frontend → Vercel  
Backend → Render  
ML Service → Render  

---

# 👨‍💻 Author

Khushank Singh  
B.Tech CSE  

---

# ⭐ Purpose

Portfolio project demonstrating full-stack development and system design.


