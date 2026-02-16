# Vitality Console

Auth and API key management for Vitality. Users sign in with **Google** (optional) or **email/password**, manage API keys, and view buckets with read-only storage stats. **Buckets** are created and owned here (source of truth); **object storage** (upload/delete) is done via **Warpdrive**’s S3-compatible API. Storage usage (object count, size per bucket) is fetched from Warpdrive when configured.

## How to start

**Backend (from project root):**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` with at least `secret_key=any-secure-random-string`. Optional: `DATABASE_PATH`, Google OAuth vars, and Warpdrive vars (see [Backend Setup](#backend-setup) and [Warpdrive integration](#warpdrive-integration-optional)).

Then:

```bash
uvicorn main:app --reload
```

**Frontend (new terminal):**

```bash
cd frontend
npm install
```

Create `frontend/.env` with `REACT_APP_API_URL=http://localhost:8000`. Optional: `REACT_APP_GOOGLE_CLIENT_ID` for Google sign-in (see [Frontend Setup](#frontend-setup)).

Then:

```bash
npm start
```

- **App:** http://localhost:3000  
- **API:** http://localhost:8000  

**Google sign-in** is optional; if not configured, the login page shows email-only sign-in.

## Prerequisites

- Python 3.8+
- Node.js 16+
- Google Cloud Platform account (optional, for Google OAuth)
- Git

## Backend Setup

1. Clone the repository and enter the project:

```bash
git clone https://github.com/vitality-ai/Vitality-console.git
cd Vitality-console
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory (see `backend/.env.example`):

```env
DATABASE_PATH=./data/vitality.db
secret_key=your_jwt_secret
```

Optional (for Google sign-in):

```env
google_client_id=your_google_client_id
google_client_secret=your_google_client_secret
```

Optional (for storage stats from Warpdrive):

```env
WARPDRIVE_URL=http://localhost:9710
WARPDRIVE_SERVICE_SECRET=your_shared_secret
```

- **DATABASE_PATH**: Path to the SQLite database file (default: `./data/vitality.db`).
- **secret_key**: Required; used for JWT signing; keep secure.
- **google_client_id** / **google_client_secret**: Optional. Omit to run with email-only sign-in.
- **WARPDRIVE_URL** / **WARPDRIVE_SERVICE_SECRET**: Optional. When set, bucket list and usage show object count and size from Warpdrive; same secret must be set in Warpdrive’s `.env`.

## Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

Optional (for Google sign-in):

```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Google OAuth Setup (optional)

Google sign-in is **optional**. You can run the app with email/password only: omit the Google-related env vars and the login page will show *"Google sign-in is not set up yet. Please use email above to register or log in."* Users can register and log in with email only.

If you want to enable Google sign-in, follow these steps.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google OAuth2 API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google OAuth2"
   - Click "Enable"
4. Configure OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required information (app name, user support email, developer contact)
   - Add necessary scopes (email, profile)
5. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:3000
     http://localhost:3000/auth/google/callback
     ```
     (Add production URLs when you deploy.)
6. Copy the **Client ID** and **Client Secret** into your env files:
   - **Backend** `backend/.env`: `google_client_id=...` and `google_client_secret=...`
   - **Frontend** `frontend/.env`: `REACT_APP_GOOGLE_CLIENT_ID=...`
7. Restart the backend and frontend. The login page will show the Google sign-in button.

---

## Warpdrive integration (optional)

To show **object count and total size** per bucket in the Console UI:

1. Run **Warpdrive** with Vitality Console auth (see Warpdrive’s README): set `VITALITY_CONSOLE_URL` and `WARPDRIVE_SERVICE_SECRET` in Warpdrive’s `.env`.
2. In Console **backend** `.env`, set:
   - `WARPDRIVE_URL` – e.g. `http://localhost:9710`
   - `WARPDRIVE_SERVICE_SECRET` – same value as in Warpdrive

Console then calls Warpdrive `GET /s3` with the logged-in user’s API key and merges stats into the bucket list and usage. If these are unset, buckets still appear but with zero object count/size.

## Running the Application

1. Start the backend:

```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend:

```bash
cd frontend
npm start
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:8000  
- API docs: http://localhost:8000/docs  

## Features

- **Auth**: Google sign-in (optional) and email/password (register and login)
- **API keys**: Generate and delete API keys; list keys (secret shown only at creation). Keys are used to sign S3 requests to Warpdrive.
- **Buckets**: Create and list buckets (source of truth in Console). When Warpdrive is configured, the UI shows object count and total size per bucket from Warpdrive.
- **Storage usage**: Read-only view of storage used and object count; data comes from Warpdrive when `WARPDRIVE_URL` and `WARPDRIVE_SERVICE_SECRET` are set.
- **S3 auth**: Warpdrive calls `POST /api/auth/s3-credentials` (with `X-Warpdrive-Secret`) to resolve an API key to the user’s secret and then verifies SigV4 locally. Object uploads and deletes go to Warpdrive’s S3 API, not to Console.

## Development

- API docs: http://localhost:8000/docs  
- SQLite DB path is set by `DATABASE_PATH`; the file and directory are created on first run.

## Security

- Do not commit `.env` or secrets
- Use a strong, unique `secret_key` for JWT
- Rotate API keys as needed

## License

[Add your license information here]
