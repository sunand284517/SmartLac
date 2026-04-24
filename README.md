# Dairy Cow Sonogram Classification Platform

This project is a Deep Learning Web Platform that classifies dairy cows according to lactation status based on sonogram (ultrasound echotexture) images. It uses a **MERN Stack** coupled with a **Python/Celery Machine Learning Worker**.

## Architecture & File Structure

We followed the Clean Architecture principle ("keep each file for one use in the folder").

- `frontend/`: React application (Vite)
  - `src/components/`: Reusable UI components.
  - `src/pages/`: Main application views (Dashboard, Login, Register).
  - `src/context/`: Global React state (AuthContext).
  - `src/utils/`: API configuration and HTTP interceptors.
- `backend/`: Node.js Express API
  - `controllers/`: Request handlers and business logic.
  - `routes/`: Express endpoint definitions.
  - `models/`: Mongoose schemas.
  - `services/`: Interfaces to Redis queue.
  - `middleware/`: Auth validation and Multer file upload handlers.
- `ml_worker/`: Python Celery Microservice
  - `worker.py`: Message queue consumer.
  - `model.py`: PyTorch CNN definitions and inference logic.
  - `train.py`: PyTorch script to train the model on provided datasets.

## Requirements
- Node.js (v18+)
- Python 3.10+
- MongoDB (Running locally on default port 27017)
- Redis Server (Running locally on default port 6379)

## Setup Instructions

### 1. Database & Cache
Ensure MongoDB and Redis are running on your machine:
```bash
brew services start mongodb-community
brew services start redis
```

### 2. Backend (Node.js API)
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. ML Worker (Python Celery)
Open a new terminal window:
```bash
cd ml_worker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
celery -A worker.app worker --loglevel=info
```

### 4. Frontend (React)
Open a third terminal window:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## How to use
1. Go to `http://localhost:5173` and register a new account.
2. Navigate to the Dashboard.
3. Upload an ultrasound image.
4. The Node API will accept the image and push a message to Redis.
5. Watch the Celery terminal logs pick up the job, run PyTorch inference, and mark the status as `COMPLETED`.
6. The frontend will dynamically update every 5 seconds with the classification status.
