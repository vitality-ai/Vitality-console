# Vitality Console

A secure object storage management system with user authentication and API key management.

## Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB Atlas account
- Google Cloud Platform account (for OAuth)
- Git

## Backend Setup

1. Clone the repository:

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
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

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

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is sufficient for development)
3. Under "Security" > "Database Access", create a new database user
4. Under "Security" > "Network Access", add your IP address or allow access from anywhere (0.0.0.0/0)
5. Under "Clusters", click "Connect" and choose "Connect your application"
6. Copy the connection string and replace `your_mongodb_uri` in the backend `.env` file
7. Replace `<password>` in the URI with your database user's password

## Google OAuth Setup

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
     http://localhost:3000/auth/google/callback
     ```
6. Copy the Client ID and Client Secret to your `.env` files

## Running the Application

1. Start the backend server:

```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:

```bash
cd frontend
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Development Guidelines

- Backend API endpoints are documented using Swagger UI at `/docs`
- Use feature branches and pull requests for new features
- Follow the existing code style and patterns
- Add appropriate error handling and logging
- Write clear commit messages

## Common Issues and Troubleshooting

1. MongoDB Connection Issues:

   - Verify your IP is whitelisted in MongoDB Atlas
   - Check if the connection string is correct
   - Ensure database user has correct permissions

2. Google OAuth Issues:

   - Verify redirect URIs match exactly
   - Check if the OAuth consent screen is configured
   - Ensure the OAuth2 API is enabled

3. CORS Issues:
   - Check if the frontend URL is added to the backend's CORS configuration
   - Verify the API URL in frontend `.env` file

## Security Notes

- Never commit `.env` files or sensitive credentials
- Keep the JWT secret secure and unique
- Regularly rotate API keys
- Monitor MongoDB Atlas logs for suspicious activity

## License

[Add your license information here]
