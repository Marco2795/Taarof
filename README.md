# Taarof (تعارف)

An open, 100% free dating & social discovery platform. Connect and message any member directly — no "matching" required, no subscriptions, no paywalls.

## Features

- Email/password authentication + Google Sign-In (JWT-based sessions)
- Multi-step onboarding (age, gender, bio, location, profile photo)
- Global member directory with search/filters (age, location, gender)
- Open messaging — message anyone directly from their profile card
- Real-time chat powered by Socket.io, with image sharing
- Profile & settings management (edit bio, change photo, log out)

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + React Router + Socket.io-client
- **Backend:** Node.js + Express + Socket.io
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (email/password) + Google Identity Services (OAuth)

## Project Structure

```
taarof/
├── backend/
│   ├── server.js              # Express + Socket.io + MongoDB bootstrap
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js            # signup, login, Google OAuth, /me
│   │   ├── users.js           # profile CRUD, directory/search, photo upload
│   │   └── messages.js        # conversations, history, send, image upload
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── upload.js          # multer image upload config
│   ├── socket/
│   │   └── socketHandler.js   # real-time messaging, typing, presence
│   ├── uploads/                # uploaded images served statically
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx             # routes + route guards
│   │   ├── index.css           # Tailwind + Taarof design tokens
│   │   ├── api/axios.js        # API client
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProfileCard.jsx
│   │   │   ├── ProfileModal.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   └── GoogleButton.jsx
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Onboarding.jsx
│   │       ├── Directory.jsx
│   │       ├── Inbox.jsx
│   │       ├── Chat.jsx
│   │       └── Settings.jsx
│   ├── package.json
│   └── .env.example
│
├── DEPLOYMENT.md               # step-by-step free hosting guide
└── README.md
```

## Quick Start (local development)

```bash
# Backend
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID
npm install
npm run dev             # runs on http://localhost:5000

# Frontend (in a new terminal)
cd frontend
cp .env.example .env   # fill in VITE_GOOGLE_CLIENT_ID
npm install
npm run dev             # runs on http://localhost:5173
```

You'll need a free MongoDB Atlas cluster and a free Google OAuth Client ID — see `DEPLOYMENT.md` for exact steps to get both, and for how to host the whole app for free.

## How "no match required" messaging works

Every profile card and profile modal has a **Send Message** button that routes straight to `/chat/:userId`. There is no friend-request, like, or match model anywhere in the schema — `POST /api/messages` and the `send_message` socket event only require a valid `receiverId`, so any authenticated user can message any other member from the very first click.
