# Integrated Student Wellness Platform

A full-stack web application to support student wellness through mood tracking, study planning, and relaxation resources. Built with **Node.js/Express** (backend) and **React** (frontend).

## Features

- **Authentication**: Sign up, login, JWT-based sessions
- **Mood Tracker**: Log daily moods with emoji picker and notes
- **Study Planner**: Add, edit, and manage assignments with due dates
- **Relaxation**: Meditation and breathing exercise resources
- **Profile**: View and update user profile
- **Admin**: Admin dashboard (stats, user list) for users with admin role

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs
- **Frontend**: React, React Router, CSS (Flexbox/Grid)

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later)
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- **npm** or **yarn**

### 1. Clone and install

```bash
# Clone the repo (if from git)
git clone <repo-url>
cd Integrated_Student_Wellness_Platform

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment variables

**Backend** – copy and edit:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:

- `PORT` – server port (e.g. `5000`)
- `MONGODB_URI` – MongoDB connection string (see **Using MongoDB Atlas** below for Atlas)
- `JWT_SECRET` – long random string for signing JWTs (e.g. generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

#### Using MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account (or log in).
2. Create a **project** and a **cluster** (free M0 tier is enough).
3. In the cluster, click **Connect** → **Connect your application** → choose **Node.js** and copy the connection string.
4. In **Database Access**, create a database user (username + password). Use that username and password in the connection string.
5. In **Network Access**, add your IP (or `0.0.0.0/0` for development so any IP can connect).
6. In `backend/.env`, set `MONGODB_URI` to that string and replace `<password>` with your database user password. Use the database name `student-wellness` (or add it after the host: `...mongodb.net/student-wellness?retryWrites=true&w=majority`).

Example format:

```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/student-wellness?retryWrites=true&w=majority
```

If your password contains special characters (e.g. `#`, `@`, `%`), URL-encode them (e.g. `@` → `%40`, `#` → `%23`).

**Frontend** – copy and edit:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` and set:

- `VITE_API_URL` – backend base URL (e.g. `http://localhost:5000/api`)

### 3. Run the app

**Terminal 1 – Backend**

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:5000` (or your `PORT`).

**Terminal 2 – Frontend**

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173` (or the port Vite shows).

### 4. Seed sample data (optional)

To create a test user, admin user, and sample moods/assignments:

```bash
cd backend
node scripts/seed.js
```

Then log in with:

**Student:**
- **Email:** `student@test.com`
- **Password:** `password123`

**Admin:**
- **Email:** `admin@test.com`
- **Password:** `admin123`

---

## Project structure

```
Integrated_Student_Wellness_Platform/
├── backend/
│   ├── config/
│   │   └── database.js      # MongoDB connection
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth (JWT) middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── scripts/
│   │   └── seed.js          # Sample data script
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/mood` | Get current user's moods |
| POST | `/api/mood` | Create mood entry |
| PUT | `/api/mood/:id` | Update mood |
| DELETE | `/api/mood/:id` | Delete mood |
| GET | `/api/assignments` | Get assignments |
| POST | `/api/assignments` | Create assignment |
| PUT | `/api/assignments/:id` | Update assignment |
| DELETE | `/api/assignments/:id` | Delete assignment |

Protected routes require header: `Authorization: Bearer <token>`.

---

## Deployment notes

- Set `NODE_ENV=production` for the backend.
- Use a production MongoDB URI and a strong `JWT_SECRET`.
- Point `VITE_API_URL` to your deployed API URL when building the frontend.
- Ensure CORS on the backend allows your frontend origin.

---

## License

MIT
