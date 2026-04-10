# 🚌 Student Bus Pass Management System

A full-stack web application for managing student bus pass applications, built with React, Node.js, Express, and MongoDB.

## 🔗 Live Demo

- **Frontend:** https://bus-pass-system-two.vercel.app
- **Backend API:** https://bus-pass-system-bkx4.onrender.com

## ✨ Features

### Student
- Register & login
- Apply for bus pass with document uploads
- Track application status
- Make payment after approval
- Download pass as PDF
- Submit complaints & feedback
- View announcements & notifications

### Admin
- Review & approve/reject applications
- View uploaded documents
- Manage bus routes
- Reply to complaints
- Post announcements
- Export applications as Excel
- Audit logs
- Extend pass validity
- Bulk approve/reject

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| File Storage | Cloudinary |
| Payment | Razorpay |
| Email | Nodemailer (Gmail) |
| Auth | JWT |
| Deployment | Vercel (frontend), Render (backend) |

## 📁 Project Structure

📁 project/
│
├── 📁 frontend/                # React App
│   └── 📁 src/
│       ├── 📁 pages/           # All pages (Home, Login, Dashboard etc.)
│       ├── 📁 components/      # Reusable UI components
│       └── 📁 context/         # React Context (Auth, Global State)
│
└── 📁 backend/                 # Express API
    ├── 📁 controllers/         # Business logic
    ├── 📁 models/              # Database schemas
    ├── 📁 routes/              # API routes
    ├── 📁 middleware/          # Authentication, error handling
    └── 📁 utils/               # Helper functions


## 🚀 Getting Started Locally

### Prerequisites
- Node.js
- MongoDB (local or Atlas)

### Backend
```bash
cd backend
npm install
node server.js
Frontend
cd frontend
npm install
npm run dev
Environment Variables
backend/.env

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
FRONTEND_URL=http://localhost:5173
frontend/.env

VITE_API_URL=http://localhost:5000
📄 License
MIT


Click **"Add a README"** on GitHub, paste this content,and commit.
