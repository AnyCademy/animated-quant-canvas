# Anycademy Payment Server

This is a Node.js Express server that handles Midtrans payment connection testing for the Anycademy platform.

## Features

- Test Midtrans API connection with sandbox and production credentials
- CORS enabled for frontend integration
- Proper error handling and logging

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

3. **Server will run on:** `http://localhost:3001`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Test Midtrans Connection
- **POST** `/api/test-midtrans-connection`
- **Body:**
  ```json
  {
    "serverKey": "SB-Mid-server-YOUR_SERVER_KEY",
    "isProduction": false
  }
  ```
- **Response:**
  ```json
  {
    "status": "success|error|warning",
    "message": "Connection result message"
  }
  ```

## How It Works

The server tests Midtrans credentials by making a request to check a non-existent order status:
- **404 response**: Credentials are valid (order doesn't exist but auth worked)
- **401 response**: Invalid credentials
- **Other status**: Unexpected response requiring manual verification

## Integration

The frontend React application calls this API instead of making direct requests to Midtrans, avoiding CORS issues while maintaining security.

## Running Both Frontend and Backend

From the main project directory:
```bash
npm run dev:full
```

This will start both the Node.js server (port 3001) and the Vite frontend (port 8081).
