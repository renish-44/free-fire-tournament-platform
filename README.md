# Free Fire Tournament Registration & Management Platform

A full-stack Free Fire tournament registration and management platform with admin dashboard, player registration, UPI payment verification, MongoDB, and tournament management.

This is a production-quality platform for managing Free Fire tournaments. It features a public-facing player registration side and an admin management interface.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios

### Backend
- Python
- FastAPI
- Motor (MongoDB Async Driver)
- Pydantic
- Passlib & JWT for Authentication

### Database
- MongoDB Atlas

## Architecture

- `frontend/`: The React application containing the user and admin interfaces.
- `backend/`: The FastAPI application providing RESTful APIs.

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python 3.9+
- MongoDB Atlas account

### Configuration
1. Copy `.env.example` to `.env` in the root directory and update the variables:
   - `MONGODB_URI`
   - `DATABASE_NAME`
   - `JWT_SECRET`
   - `VITE_API_URL`

### Running the Backend
1. Navigate to the `backend` directory.
2. Create and activate a virtual environment: `python -m venv venv` and `source venv/bin/activate` (or `venv\Scripts\activate` on Windows).
3. Install dependencies: `pip install -r requirements.txt`.
4. Run the server: `uvicorn app.main:app --reload`.

### Running the Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Run the development server: `npm run dev`.
