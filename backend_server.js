// backend_server.js
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fetch = require('node-fetch');

// Basic error logging
console.log('Starting server initialization...');
console.log('Current directory:', __dirname);
console.log('Node version:', process.version);

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());

// Add CORS handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // React dev server
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Initialize API key
const apiKey = process.env.AI_API_KEY;
if (!apiKey) {
    console.error("Error: AI_API_KEY not found in .env file.");
    process.exit(1);
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey, {
    apiVersion: "v1beta"
});

// Simple test endpoint for Gemini
app.get('/api/test-gemini', async (req, res) => {
    try {
        console.log("Testing with model models/gemini-1.5-flash");
        const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
        const result = await model.generateContent({
            contents: [{
                parts: [{
                    text: "Say 'API is working!'"
                }]
            }]
        });
        res.json({ message: result.response.text() });
    } catch (error) {
        console.error("Test API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Track recent responses to prevent repetition
const recentResponses = new Set();
const MAX_RECENT_RESPONSES = 10;

// Helper function to check if a response is too similar to recent ones
function isTooSimilar(newResponse) {
    const normalized = newResponse.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    for (const recent of recentResponses) {
        const normalizedRecent = recent.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (normalized === normalizedRecent || 
            (normalized.length > 10 && normalizedRecent.includes(normalized)) ||
            (normalizedRecent.length > 10 && normalized.includes(normalizedRecent))) {
            return true;
        }
    }
    return false;
}

function trackResponse(response) {
    recentResponses.add(response);
    if (recentResponses.size > MAX_RECENT_RESPONSES) {
        recentResponses.delete(recentResponses.values().next().value);
    }
}

async function generateWithAI(prompt) {
    try {
        console.log("\n=== Starting New Gemini Generation ===");
        console.log("Using API key:", apiKey.substring(0, 10) + "...");
        console.log("Prompt preview:", prompt.substring(0, 100) + "...");

        // Get the model and generate content
        console.log("Initializing model with models/gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ 
            model: "models/gemini-1.5-flash"
        });
        
        console.log("Making API request...");
        try {
            // Fix the content format - use the correct structure for the Gemini API
            const result = await model.generateContent({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            });

            console.log("Raw API response:", JSON.stringify(result, null, 2));
            const response = result.response;
            const text = response.text();
            console.log("Generated response:", text);

            if (isTooSimilar(text)) {
                throw new Error("Generated content was too similar to recent responses");
            }

            trackResponse(text);
            return text;
        } catch (apiError) {
            console.error("API Call Error Details:");
            console.error("Error name:", apiError.name);
            console.error("Error message:", apiError.message);
            console.error("Full error:", apiError);
            throw apiError;
        }
    } catch (error) {
        console.error("Gemini API Error Details:");
        console.error("Error type:", typeof error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        if (error.response) {
            console.error("Error response:", error.response);
        }
        throw error;
    }
}

// Endpoint to get initial fact
app.post('/api/getInitialFact', async (req, res) => {
    try {
        console.log("\n=== Starting new fact generation request ===");
        
        const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        console.log("Request ID:", requestId);
        
        const categories = [
            "quantum physics", "marine biology", "neuroscience", "astronomy",
            "modern technology", "plant biology", "chemistry", "genetics",
            "climate science", "computer science", "materials science", "ecology",
            "renewable energy", "artificial intelligence", "biotechnology"
        ];
        
        const shuffled = [...categories].sort(() => 0.5 - Math.random());
        const numCategories = Math.random() > 0.5 ? 2 : 3;
        const selectedCategories = shuffled.slice(0, numCategories);
        
        const currentYear = new Date().getFullYear();
        
        const prompt = `Generate ONE fascinating scientific fact about ${selectedCategories.join(' or ')}.

        CRITICAL RULES:
        1. NEVER MENTION:
           × Ancient history
           × Historical figures
           × Pyramids or Egypt
           × Time comparisons
           × Internet memes or viral facts
        
        2. ONLY FOCUS ON:
           ✓ Scientific discoveries from ${currentYear-5} to ${currentYear}
           ✓ Measurable data and specific numbers
           ✓ Peer-reviewed research
           ✓ Modern technology and innovation
           ✓ Current developments in ${selectedCategories.join(' or ')}
        
        3. RESPONSE MUST BE:
           ✓ One single sentence
           ✓ Include at least one specific number
           ✓ Start directly with the fact (no "Did you know" or similar)
           ✓ End with a period`;

        console.log("Selected categories:", selectedCategories);
        
        const fact = await generateWithAI(prompt);
        console.log("Successfully generated fact:", fact);
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0',
            'ETag': false,
            'Last-Modified': new Date().toUTCString(),
            'Vary': '*'
        });
        
        res.json({ 
            fact: fact.trim(),
            requestId,
            categories: selectedCategories
        });
    } catch (error) {
        console.error("Error generating fact:", error);
        res.status(500).json({ error: error.message || "Failed to generate fact" });
    }
});

// Endpoint to reframe text through a subject lens
app.post('/api/reframeFact', async (req, res) => {
    try {
        console.log("\n=== Starting new reframing request ===");
        
        const { textToReframe, subjectLens } = req.body;
        
        if (!textToReframe || !subjectLens) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        
        console.log("Text to reframe:", textToReframe);
        console.log("Subject lens:", subjectLens);
        
        const prompt = `I will give you a scientific fact, and I want you to reframe it through the lens of ${subjectLens}.
        
        The fact is: "${textToReframe}"
        
        Reframe this fact through the lens of ${subjectLens}. Explain how the fact relates to concepts, principles, or applications in ${subjectLens}.
        
        Guidelines:
        - Keep your response concise (2-3 sentences maximum)
        - Focus specifically on ${subjectLens} connections
        - Maintain scientific accuracy while translating to the new field
        - Use terminology familiar to people who study ${subjectLens}
        - Don't start with "Through the lens of ${subjectLens}..." or similar phrases
        - Start directly with the reframed fact`;
        
        const reframedText = await generateWithAI(prompt);
        console.log("Successfully reframed text:", reframedText);
        
        res.json({ reframedText: reframedText.trim() });
    } catch (error) {
        console.error("Error reframing text:", error);
        res.status(500).json({ error: error.message || "Failed to reframe text" });
    }
});

// Listen on specified port
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 