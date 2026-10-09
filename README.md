# 🏛️ IVMS — Interns & Volunteers Management System
### City of Kigali | Version 1.0

![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Database](https://img.shields.io/badge/Database-SQLite-lightgrey)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS-yellow)
![Institution](https://img.shields.io/badge/Institution-City%20of%20Kigali-red)

---

## 📌 Overview

**IVMS** is a full-stack web application developed for the **City of Kigali** to digitize and streamline the management of interns and volunteers across all departments. It replaces manual tracking with a centralized, role-based system that provides real-time visibility into placements, contributions, and performance.

---

## 🎯 Key Features

| Module | Description |
|---|---|
| 🔐 **Authentication** | Secure login & registration with SHA-256 password hashing, role-based access (Admin / Staff) |
| 🏢 **Departments** | Manage departments with slot capacity tracking (total, occupied, available) |
| 👥 **Interns & Volunteers** | Full CRUD for Professional Interns, Academic Interns, and Youth Volunteers |
| 📋 **Contributions** | Record and track tasks and outputs per intern |
| 📅 **Monthly Plans & Reports** | Set monthly objectives, submit reports, and track achievement rates |
| 🔍 **Follow-ups & Support** | Log resources provided, usage status, and support needs per intern |
| 📨 **Placement Requests** | Partners submit placement requests; admins approve or reject |
| ⚠️ **Duration Alerts** | Automatic alerts for overdue or expiring placements (within 30 days) |
| ⭐ **Retention Evidence** | Full intern dossier — contributions, plans, follow-ups in one view |
| 📊 **Dashboard** | Live charts (doughnut, bar) showing placements by category, status, and department capacity |
| ⚙️ **Settings** | Edit profile (name, email, role) and change password |

---

## 🗂️ Project Structure

```
ivms/
├── backend/
│   ├── db/
│   │   └── schema.js          # SQLite database schema & initialization
│   ├── routes/
│   │   ├── auth.js            # Login, register, profile update, password change
│   │   ├── departments.js     # Department CRUD
│   │   ├── interns.js         # Intern/Volunteer CRUD
│   │   ├── contributions.js   # Contributions management
│   │   ├── monthly_plans.js   # Monthly plans & reports
│   │   ├── followups.js       # Follow-up records
│   │   ├── requests.js        # Placement requests
│   │   └── reports.js         # Dashboard stats, duration alerts, retention evidence
│   ├── package.json
│   └── server.js              # Express app entry point (port 3000)
├── frontend/
│   ├── index.html             # Single-page application shell
│   ├── auth.js                # Login / register logic
│   ├── app.js                 # All page rendering & API calls
│   ├── style.css              # Full UI styling
│   └── logo.png               # City of Kigali logo
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

**Backend**
- [Node.js](https://nodejs.org/) — Runtime environment
- [Express.js v5](https://expressjs.com/) — REST API framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Synchronous SQLite database
- [crypto](https://nodejs.org/api/crypto.html) — SHA-256 password hashing (built-in)
- [cors](https://www.npmjs.com/package/cors) — Cross-Origin Resource Sharing

**Frontend**
- Vanilla HTML5 / CSS3 / JavaScript (no frameworks)
- [Chart.js](https://www.chartjs.org/) — Interactive dashboard charts
- LocalStorage — Session persistence

**Database**
- SQLite (file-based, zero configuration)

---

## 🗄️ Database Schema

```
users              → id, full_name, email, password, role, created_at
departments        → id, name, total_slots, created_at
interns            → id, full_name, email, phone, category, qualification,
                     referring_partner, department_id, start_date, end_date, status
contributions      → id, intern_id, task, output, date
monthly_plans      → id, intern_id, month, plan, report, achievement_rate
followups          → id, intern_id, resources_provided, resources_used,
                     support_needs, resolved, date
placement_requests → id, partner, candidate_name, qualification, department_id, status
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A modern web browser (Chrome, Firefox, Edge)

### Installation & Run

**1. Clone the repository**
```bash
git clone https://github.com/kigalicity/ivms.git
cd ivms
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Start the backend server**
```bash
node server.js
```
> API will be running at `http://localhost:3000`

**4. Open the frontend**

Open `frontend/index.html` directly in your browser — no build step required.

**5. Create your first account**

On the login screen, click **"Create Account"** to register, then sign in.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| PUT | `/api/auth/profile` | Update profile (name, email, role) |
| PUT | `/api/auth/change-password` | Change password |
| GET/POST | `/api/departments` | List / create departments |
| PUT/DELETE | `/api/departments/:id` | Update / delete department |
| GET/POST | `/api/interns` | List / create interns |
| GET/PUT/DELETE | `/api/interns/:id` | Get / update / delete intern |
| GET/POST | `/api/contributions` | List / add contributions |
| GET/POST | `/api/monthly-plans` | List / add monthly plans |
| PUT | `/api/monthly-plans/:id/report` | Submit monthly report |
| GET/POST | `/api/followups` | List / add follow-ups |
| PUT | `/api/followups/:id/resolve` | Mark follow-up as resolved |
| GET/POST | `/api/requests` | List / create placement requests |
| PUT | `/api/requests/:id/status` | Approve or reject request |
| GET | `/api/reports/dashboard` | Dashboard statistics |
| GET | `/api/reports/duration-alerts` | Overdue & expiring placements |
| GET | `/api/reports/retention/:id` | Full intern retention dossier |

---

## 👤 User Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access — manage departments, approve requests, view all data |
| **Staff** | Manage interns, contributions, plans, follow-ups |

---

## 🎨 UI Design (Figma)

The full UI/UX design prototype is available on Figma:
👉 [View IVMS Design on Figma](https://www.figma.com/design/NUkfCQK2WVyfld3b4s6wB8/logoof-city-of-kigali?node-id=29-136&t=2ITHPlDxpJ5rKZE9-1)

---

## 👨‍💻 Developer

Developed by the **City of Kigali — Digital Systems Unit**
📧 coksystems@kigalicity.gov.rw
🌐 [kigalicity.gov.rw](https://www.kigalicity.gov.rw)

---

## 📄 License

© 2025 City of Kigali. All rights reserved.
