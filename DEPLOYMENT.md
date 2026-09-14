# Deploying Taarof for Free

This guide gets Taarof fully live using only free tiers:
- **Database:** MongoDB Atlas (free M0 cluster)
- **Backend:** Render (free web service)
- **Frontend:** Vercel (free hosting + free subdomain)
- **Auth:** Google Cloud Console (free OAuth client)

---

## 1. Set up MongoDB Atlas (free database)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **free M0 cluster** (choose any nearby region).
3. Under **Database Access**, create a database user with a username/password.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) — required since Render's IPs are dynamic on the free tier.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add `/taarof` before the `?` so it targets a database named `taarof`:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taarof?retryWrites=true&w=majority
   ```
   Save this — it's your `MONGO_URI`.

---

## 2. Set up Google Sign-In (free OAuth client)

1. Go to https://console.cloud.google.com/ and create a new project (e.g. "Taarof").
2. Go to **APIs & Services > OAuth consent screen**. Choose "External", fill in the app name ("Taarof"), your email, and save.
3. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
4. Choose **Web application**.
5. Under **Authorized JavaScript origins**, add both:
   - `http://localhost:5173` (for local dev)
   - Your future Vercel URL, e.g. `https://taarof.vercel.app` (add this after step 4 below, then come back and update it)
6. Save. Copy the **Client ID** — you'll need it for both frontend and backend env vars.

---

## 3. Deploy the backend on Render (free)

1. Push this project to a GitHub repository.
2. Go to https://render.com and sign up (free).
3. Click **New > Web Service**, connect your GitHub repo.
4. Configure:
   - **Root directory:** `backend`
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
5. Add environment variables (from `backend/.env.example`):
   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | any long random string (generate one at https://generate-secret.vercel.app/32) |
   | `GOOGLE_CLIENT_ID` | your Google OAuth client ID |
   | `CLIENT_URL` | your Vercel frontend URL (set after step 4, e.g. `https://taarof.vercel.app`) |
   | `PORT` | `5000` (Render sets its own `PORT` automatically — safe to leave as fallback) |
6. Deploy. Render gives you a free URL like `https://taarof-backend.onrender.com`.

   > **Note:** Free Render web services spin down after ~15 minutes of inactivity and take ~30–60 seconds to wake up on the next request. This is expected on the free tier.

---

## 4. Deploy the frontend on Vercel (free)

1. Go to https://vercel.com and sign up (free), connect the same GitHub repo.
2. Click **Add New > Project**, select the repo.
3. Configure:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add environment variables (from `frontend/.env.example`):
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://taarof-backend.onrender.com/api` (your Render URL + `/api`) |
   | `VITE_SOCKET_URL` | `https://taarof-backend.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | your Google OAuth client ID |
5. Deploy. Vercel gives you a free subdomain like `https://taarof.vercel.app` (or `https://taarof-yourname.vercel.app`).
6. Go back to Render and update `CLIENT_URL` to this exact Vercel URL, then go back to Google Cloud Console and add this URL to **Authorized JavaScript origins**. Redeploy the backend so the CORS setting picks up the change.

---

## 5. Custom free subdomain (optional)

- Vercel's `*.vercel.app` subdomain is free and works out of the box — no extra setup needed.
- If you'd like a custom domain name instead of `.vercel.app`, you can use a free option like **DuckDNS** (`taarof.duckdns.org`) or **Freenom**, then point it at Vercel following Vercel's "Custom Domains" docs. This step is optional; the app is fully functional on the free `.vercel.app` URL.

---

## 6. Verify everything works

1. Visit your Vercel URL.
2. Sign up with email/password, then try Google Sign-In.
3. Complete onboarding, upload a profile photo.
4. Open the app in two browser windows (or incognito) with two different accounts, and confirm:
   - Both appear in each other's Discover feed.
   - "Send Message" works with no prior match.
   - Messages arrive instantly (Socket.io) without refreshing.
   - Image sharing in chat works.

---

## Local development (before deploying)

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env   # fill in VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Visit `http://localhost:5173`.

---

## Notes on file storage

Profile photos and chat images are currently stored on the backend's local disk (`backend/uploads/`) and served via Express static files. This works out of the box on Render's free tier, but **Render's free disk is not guaranteed to persist across redeploys** (it may reset). For a production-grade setup, swap the `multer` disk storage in `backend/middleware/upload.js` for a free-tier object storage service such as **Cloudinary** (free tier, easy multer integration via `multer-storage-cloudinary`) — this keeps uploaded images permanent even across redeploys, and remains 100% free within Cloudinary's free quota.
