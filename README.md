# Digital Heroes Lead Management Platform

A full-stack lead management platform built for the Digital Heroes training task.

## Features
- **Public Lead Capture Form**: Web form for capturing leads directly into the system.
- **Authentication & Authorization**: JWT-based auth with Role-Based Access Control (Admin vs. Member).
- **Lead Lifecycle Management**: Status tracking (New, Contacted, Qualified, Proposal Sent, Won, Lost).
- **Activity Logging**: Automated audit trail for important actions.
- **REST API**: Robust API with pagination, filtering, searching, and validation.

## Project Architecture
This project follows a strict MVC (Model-View-Controller) architecture using Node.js/Express on the backend and React/Vite on the frontend.
- **Frontend**: React (Vite), Tailwind CSS, React Router, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MySQL (using `mysql2` with raw, parameterized SQL queries).

### Folder Structure
```
/
├── backend/
│   ├── config/      # Environment, DB, Logger configuration
│   ├── controllers/ # HTTP request handlers
│   ├── middleware/  # Auth, validation, error handling
│   ├── models/      # Raw SQL database queries
│   ├── routes/      # Express route definitions
│   ├── services/    # Business logic layer
│   ├── utils/       # Helpers (e.g., custom errors)
│   └── tests/       # Jest and Supertest test suites
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
├── docs/            # Task B documentation deliverables
├── schema.sql       # Database schema and seed data
└── README.md
```

## Installation

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)

### 1. Database Setup
1. Create a MySQL database named `digital_heroes`.
2. Run the `schema.sql` file located in the root directory to create tables and insert seed data.

### 2. Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env to match your local database credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

The REST API is located at `http://localhost:5000/api`.

### Auth Endpoints
- `POST /api/auth/login`: Login and receive JWT & Refresh Token.
- `POST /api/auth/refresh-token`: Get a new JWT using a refresh token.
- `GET /api/auth/me`: Get current authenticated user details.

### Lead Endpoints
- `POST /api/leads/capture`: (Public) Submit a new lead.
- `GET /api/leads`: (Auth) List leads with pagination (`page`, `limit`), filtering (`status`, `assigned_user_id`), and `search`.
- `GET /api/leads/:id`: (Auth) Get lead details and notes.
- `PUT /api/leads/:id`: (Auth) Update lead details/status.
- `POST /api/leads/:id/notes`: (Auth) Add a note to a lead.
- `POST /api/leads/:id/assign`: (Admin) Assign a lead to a user.
- `DELETE /api/leads/:id`: (Admin) Delete a lead.

### User Endpoints
- `GET /api/users`: (Admin) List all users.
- `POST /api/users`: (Admin) Create a new user.

## Entity Relationship (ER) Diagram
![ER Diagram Placeholder](/path/to/er-diagram.png)
*Tables: Users, Leads, Notes, Activities*

## Deployment Guide

### Database (Railway / PlanetScale)
1. Provision a MySQL database.
2. Run the `schema.sql` against the production database.
3. Note the connection URL/credentials.

### Backend (Render)
1. Create a new Web Service on Render, connected to your GitHub repo.
2. Set the Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add Environment Variables (from `.env`).

### Frontend (Netlify / Vercel)
1. Create a new project, connected to your GitHub repo.
2. Set the Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. Add Environment Variable: `VITE_API_URL=https://your-render-backend-url.com/api`

---
Built for Digital Heroes Training Task
