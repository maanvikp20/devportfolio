// server.js
require('dotenv').config(); // Load .env variables
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== API CONFIG ======
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ANILIST_USERNAME = process.env.ANILIST_USERNAME;

// Serve static files from 'public' directory
app.use(express.static('public'));

// Normal routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/aboutme', (req, res) => res.sendFile(path.join(__dirname, 'public', 'aboutme.html')));
app.get('/projects', (req, res) => res.sendFile(path.join(__dirname, 'public', 'projects.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));

// ===== SPOTIFY TOKEN ROUTE ======
app.get('/spotify-token', async (req, res) => {
  try {
    console.log('🎵 Attempting to refresh Spotify token...');
    
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SPOTIFY_REFRESH_TOKEN
      }).toString(),
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Spotify token refreshed successfully');
    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('❌ Spotify Token Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    res.status(500).json({ 
      error: 'Failed to get Spotify access token',
      details: error.response?.data || error.message 
    });
  }
});

// ===== GITHUB TOKEN ROUTE ======
app.get('/github-token', (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }
  
  res.json({ access_token: GITHUB_TOKEN });
});

// ===== GITHUB ACTIVITY PROXY (Optional - Better Rate Limiting) ======
app.get('/github-activity', async (req, res) => {
  try {
    if (!GITHUB_TOKEN || !GITHUB_USERNAME) {
      return res.status(500).json({ error: 'GitHub credentials not configured' });
    }

    const response = await axios.get(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=20`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('GitHub Activity Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
});

// ===== ANILIST USERNAME ROUTE ======
app.get('/anilist-username', (req, res) => {
  if (!ANILIST_USERNAME) {
    return res.status(500).json({ error: 'AniList username not configured' });
  }
  
  res.json({ username: ANILIST_USERNAME });
});

// 404 handler
app.use((req, res) => res.status(404).send('Page not found'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  console.log('Environment check:');
  console.log('  - Spotify configured:', !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET && SPOTIFY_REFRESH_TOKEN));
  console.log('  - GitHub configured:', !!(GITHUB_TOKEN && GITHUB_USERNAME));
  console.log('  - AniList configured:', !!ANILIST_USERNAME);
});