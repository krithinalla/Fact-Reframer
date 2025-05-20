# Fact Reframer

An interactive application that displays random scientific facts and allows users to view them through different subject lenses.

## Features

- Get random scientific facts
- View facts through different subject lenses (Chemistry, Mathematics, Art, etc.)
- Add custom subject lenses

## Setup

1. Make sure you have Node.js installed
2. Create a `.env` file with your AI API key:
   ```
   AI_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Running the Application

The application consists of two parts:
- Backend server (handles AI API calls)
- Frontend React app

### Option 1: Start both services at once (recommended)
```
npm run start-app
```

### Option 2: Start services manually
```
# Terminal 1
node backend_server.js

# Terminal 2
npm run start-react
```

### Testing the API
To verify that the API is working correctly:
```
npm run test-api
```

## Troubleshooting

### API Connection Issues
If you see "Failed to retrieve a fact" errors:
1. Check that your `.env` file has a valid AI_API_KEY
2. Verify the backend server is running (should show "Server running on port 3001")
3. Check browser console for detailed error messages
4. Try restarting both servers

### UI Not Showing
If the lens buttons or fact display are not visible:
1. Open the browser console (F12) and check for errors
2. Ensure you clicked "Get Fact" button first to fetch a fact
3. Verify the React app is able to connect to the backend

## Usage

1. Click "Get Fact" to retrieve a random scientific fact
2. Select a subject lens to view the fact through that perspective
3. Use the "+" button to add custom subject lenses
