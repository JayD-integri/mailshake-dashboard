const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

const MAILSHAKE_API = 'https://api.mailshake.com/2017-04-01';

// Helper to make authenticated requests to Mailshake
async function mailshakeRequest(endpoint, apiKey) {
  const url = `${MAILSHAKE_API}${endpoint}`;
  const auth = Buffer.from(apiKey + ':').toString('base64');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Mailshake API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling Mailshake: ${error.message}`);
    throw error;
  }
}

// Endpoint to get campaigns
app.post('/api/campaigns', async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }
  
  try {
    const data = await mailshakeRequest('/campaigns/list', apiKey);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get activity (opens, clicks, sent, replies)
app.post('/api/activity/:type', async (req, res) => {
  const { type } = req.params;
  const { apiKey, campaignID, perPage = 100 } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }
  
  const validTypes = ['sent', 'opens', 'clicks', 'replies'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid activity type' });
  }
  
  try {
    let endpoint = `/activity/${type}?perPage=${perPage}`;
    if (campaignID) {
      endpoint += `&campaignID=${campaignID}`;
    }
    
    const data = await mailshakeRequest(endpoint, apiKey);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mailshake proxy server running on port ${PORT}`);
});
