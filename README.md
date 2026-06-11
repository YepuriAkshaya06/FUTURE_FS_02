📋 Mini CRM - Client Lead Management System

A complete full-stack CRM application for managing client leads generated from website contact forms. Built as Task 2 for Future Interns internship program.

---------------------------------------------------------------------------------------------------------------------------
🌐 Live Demo

Environment	Link	Status

Frontend	https://future-fs-02-5q5kbj11t-yepuriakshaya06s-projects.vercel.app/	✅

Backend API	https://future-fs-02-s7i1.onrender.com/	✅ 

----------------------------------------------------------------------------------------------------------------------------
🔑 Test Credentials

Email-Password

admin@crm.com-admin123

---------------------------------------------------------------------------------------------------------------------------

🎯 Project Overview

This Mini CRM system allows businesses to efficiently track, manage, and convert leads from initial contact to successful conversion. It provides a secure admin dashboard to view, update, and follow up with potential customers.

---------------------------------------------------------------------------------------------------------------------------

✨ Features Implemented

Core Requirements ✅

Lead Listing - View all leads with name, email, source, and status

Status Updates - Track leads through workflow (New → Contacted → Converted)

Notes & Follow-ups - Add and track follow-up notes for each lead

Secure Admin Access - JWT-based authentication system

----------------------------------------------------------------------------------------------------------------------------
Bonus Features 🎁
Kanban Board View - Drag-and-drop interface for visual pipeline management

Analytics Dashboard - Visual charts showing lead distribution and source tracking

Deal Value Tracking - Track potential revenue from each lead

Responsive Design - Works on desktop, tablet, and mobile devices

Real-time Statistics - Automatic updates of lead metrics

-----------------------------------------------------------------------------------------------------------------------------
🛠️ Tech Stack

Frontend:

React.js - UI library for building the dashboard

CSS3 - Custom styling with responsive design

Chart.js - Data visualization for analytics

Vercel - Hosting and deployment

Backend:

Node.js - JavaScript runtime

Express.js - Web framework for APIs

Render - Cloud hosting and deployment

Database:

JSON File Storage - Lightweight file-based storage (leads.json, users.json)

Development Tools:
Vite - Fast build tool and dev server

Nodemon - Auto-restart during development

----------------------------------------------------------------------------------------------------------------------------
📁 Project Structure

mini-crm/
├── backend/
│   ├── server.js          # Express server & API routes
│   ├── leads.json         # Lead data storage
│   ├── users.json         # User accounts storage
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Global styles
│   │   └── index.css      # Base styles
│   ├── index.html         # HTML entry point
│   └── package.json       # Frontend dependencies
└── README.md              # Project documentation

-----------------------------------------------------------------------------------------------------------------------------

🚀 Installation & Setup

Prerequisites

Node.js (v14 or higher) - Download

npm (comes with Node.js)

step 1: Clone the Repository-git clone https://github.com/yourusername/mini-crm.git

Step 2: Setup Backend-cd backend

npm install

npm run dev

The backend will run on http://localhost:5002

Step 3: Setup Frontend (New Terminal)-cd frontend

npm install

npm run dev

The frontend will run on http://localhost:5173

Step 4: Access the Application

Open your browser and navigate to http://localhost:5173

-----------------------------------------------------------------------------------------------------------------------------
🔑 Login Credentials

Email-	Password-	Role

admin@crm.com	-admin123-	Administrator

-----------------------------------------------------------------------------------------------------------------------------

Live Links:

Frontend: https://future-fs-02-5q5kbj11t-yepuriakshaya06s-projects.vercel.app/

Backend: https://future-fs-02-s7i1.onrender.com/

-----------------------------------------------------------------------------------------------------------------------------
🙏 Acknowledgments

Future Interns - For providing this learning opportunity

React.js Community - For excellent documentation

Express.js - For robust backend framework

Vercel & Render - For free hosting

-----------------------------------------------------------------------------------------------------------------------------
📝 License

This project is created for educational purposes as part of the Future Interns internship program.

-----------------------------------------------------------------------------------------------------------------------------
🎉 Thank You Future Interns!
This project successfully demonstrates:

✅ Full-stack development skills

✅ REST API implementation

✅ User authentication (JWT)

✅ Database design and management

✅ Modern UI/UX principles

✅ Problem-solving abilities

✅ Deployment on Vercel & Render

-----------------------------------------------------------------------------------------------------------------------------




