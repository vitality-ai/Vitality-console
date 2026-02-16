# Vitality Console

Auth and API key management for Vitality. Users can sign in with Google or email/password, manage API keys, and view read-only storage usage (data provided by Warpdrive). Bucket and object write operations (create bucket, upload, delete) are handled by **Warpdrive**; this app is the single source of truth for users and keys.

## How to start

**Backend (from project root):**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` with at least:

```env
secret_key=any-secure-random-string
```

Then:

```bash
uvicorn main:app --reload
```

**Frontend (new terminal):**

```bash
cd frontend
npm install
```

Create `frontend/.env` with:

```env
REACT_APP_API_URL=http://localhost:8000
```

Then:

```bash
npm start
```

- **App:** http://localhost:3000  
- **API:** http://localhost:8000  

If you don’t set up Google OAuth (`google_client_id` in backend and `REACT_APP_GOOGLE_CLIENT_ID` in frontend), the console still runs: the login page will say *"Google sign-in is not set up yet. Please use email above to register or log in."* and users can register and log in with email only.

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

4. Create a `.env` file in the backend directory:

```env
DATABASE_PATH=./data/vitality.db
secret_key=your_jwt_secret
```

Optional (for Google sign-in):

```env
google_client_id=your_google_client_id
google_client_secret=your_google_client_secret
```

- **DATABASE_PATH**: Path to the SQLite database file (default: `./data/vitality.db`).
- **secret_key**: Required; used for JWT signing; keep secure.
- **google_client_id** / **google_client_secret**: Optional. Omit to run with email-only sign-in; the UI will prompt users to use email.

## Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

`REACT_APP_GOOGLE_CLIENT_ID` is only needed for Google sign-in.

## Google OAuth Setup (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the Google OAuth2 API
3. Configure the OAuth consent screen and create OAuth client credentials (Web application)
4. Add authorized JavaScript origins and redirect URIs (e.g. `http://localhost:3000`)
5. Copy the Client ID and Client Secret into the backend and frontend `.env` files

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

- **Auth**: Google sign-in and email/password (register and login)
- **API keys**: Generate and delete API keys; list keys (no secret after creation)
- **Read-only usage**: View buckets and storage usage; data is provided by the Warpdrive service (stub until Warpdrive implements the API)
- **S3 auth**: Warpdrive calls `POST /api/auth/s3-credentials` (with `X-Warpdrive-Secret`) to get credentials and verifies request signatures (SigV4) locally

Bucket and object creation, uploads, and deletes are done in **Warpdrive**, not in this app.

## Development

- API docs: http://localhost:8000/docs  
- SQLite DB path is set by `DATABASE_PATH`; the file and directory are created on first run.

## Security

- Do not commit `.env` or secrets
- Use a strong, unique `secret_key` for JWT
- Rotate API keys as needed

## License

[Add your license information here]
