// fun-stuff.js - Real-time API Integration for Fun Stuff Section
// All credentials are securely handled via server routes

// ============================================
// ANILIST API - Real-time Anime Tracking
// ============================================
async function getAniListUsername() {
  try {
    const res = await fetch('/anilist-username');
    if (!res.ok) throw new Error('Failed to fetch AniList username');
    const data = await res.json();
    return data.username;
  } catch (error) {
    console.error('AniList Username Error:', error);
    throw error;
  }
}

async function loadAniList() {
  const container = document.getElementById('anilist-content');
  
  const query = `
    query ($userName: String) {
      MediaListCollection(userName: $userName, type: ANIME, status: CURRENT, sort: UPDATED_TIME_DESC) {
        lists {
          entries {
            media {
              title {
                romaji
                english
              }
              coverImage {
                large
              }
              episodes
            }
            progress
            score(format: POINT_10)
            updatedAt
          }
        }
      }
    }
  `;
  
  try {
    const username = await getAniListUsername();
    
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: { userName: username }
      })
    });
    
    if (!response.ok) throw new Error('AniList API request failed');
    
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
    
    const entries = data.data.MediaListCollection?.lists[0]?.entries.slice(0, 3) || [];
    
    if (entries.length === 0) {
      container.innerHTML = '<div class="error-message">No currently watching anime found</div>';
      return;
    }
    
    container.innerHTML = entries.map(entry => {
      const title = entry.media.title.english || entry.media.title.romaji;
      const episodes = entry.media.episodes || '?';
      const score = entry.score ? `${entry.score}/10` : 'Not rated';
      
      return `
        <div class="anime-item">
          <img src="${entry.media.coverImage.large}" 
               alt="${title}" 
               class="anime-cover" 
               onerror="this.src='https://via.placeholder.com/60x85/2B2B2B/ffffff?text=No+Image'">
          <div class="anime-info">
            <div class="anime-title">${title}</div>
            <div class="anime-progress">Episode ${entry.progress}/${episodes}</div>
            <div class="anime-score">⭐ ${score}</div>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('AniList Error:', error);
    container.innerHTML = `<div class="error-message">Failed to load anime data: ${error.message}</div>`;
  }
}

// ============================================
// SPOTIFY API - Real-time Music Tracking
// ============================================
async function getSpotifyAccessToken() {
  try {
    const res = await fetch('/spotify-token');
    if (!res.ok) throw new Error('Failed to fetch Spotify token');
    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error('Spotify Token Error:', error);
    throw error;
  }
}

async function loadSpotify() {
  const container = document.getElementById('spotify-content');

  try {
    const accessToken = await getSpotifyAccessToken();

    const response = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=3',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) throw new Error('Spotify API request failed');

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      container.innerHTML = '<div class="error-message">No recently played tracks found</div>';
      return;
    }

    container.innerHTML = data.items
      .map(item => {
        const track = item.track;
        const artists = track.artists.map(a => a.name).join(', ');
        const image = track.album.images[0]?.url || 'https://via.placeholder.com/60x60/2B2B2B/22c55e?text=♪';

        return `
          <div class="spotify-item">
            <img src="${image}" 
                 alt="${track.name}" 
                 class="spotify-cover" 
                 onerror="this.src='https://via.placeholder.com/60x60/2B2B2B/22c55e?text=♪'">
            <div class="spotify-info">
              <div class="spotify-track">${track.name}</div>
              <div class="spotify-artist">${artists}</div>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    console.error('Spotify Error:', error);
    container.innerHTML = `<div class="error-message">Failed to load Spotify data: ${error.message}</div>`;
  }
}

// ============================================
// GITHUB API - Real-time Activity Tracking
// ============================================
function formatGitHubDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 604800)} weeks ago`;
}

function truncateMessage(message, maxLength = 50) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

function formatGitHubAction(event) {
  const type = event.type;
  const payload = event.payload;
  
  switch (type) {
    case 'PushEvent':
      const commits = payload.commits || [];
      const commitCount = commits.length;
      
      if (commits.length > 0) {
        const firstCommit = truncateMessage(commits[0].message.split('\n')[0]);
        return `Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''}: "${firstCommit}"`;
      }
      return `Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''}`;
      
    case 'CreateEvent':
      const refType = payload.ref_type;
      const refName = payload.ref || 'main';
      return `Created ${refType}: ${refName}`;
      
    case 'PullRequestEvent':
      const prAction = payload.action;
      const prNumber = payload.pull_request?.number;
      const prTitle = payload.pull_request?.title;
      if (prTitle) {
        return `${prAction} PR #${prNumber}: "${truncateMessage(prTitle)}"`;
      }
      return `${prAction} pull request #${prNumber}`;
      
    case 'IssuesEvent':
      const issueAction = payload.action;
      const issueNumber = payload.issue?.number;
      const issueTitle = payload.issue?.title;
      if (issueTitle) {
        return `${issueAction} issue #${issueNumber}: "${truncateMessage(issueTitle)}"`;
      }
      return `${issueAction} issue #${issueNumber}`;
      
    case 'WatchEvent':
      return 'Starred repository ⭐';
      
    case 'ForkEvent':
      return 'Forked repository 🍴';
      
    case 'DeleteEvent':
      return `Deleted ${payload.ref_type}: ${payload.ref}`;
      
    case 'ReleaseEvent':
      return `Released ${payload.release?.tag_name || 'new version'}`;
      
    default:
      return type.replace('Event', '');
  }
}

// OPTION 1: Use server proxy (recommended - better rate limiting)
async function loadGitHub() {
  const container = document.getElementById('github-content');
  
  try {
    const response = await fetch('/github-activity');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'GitHub API request failed');
    }
    
    const events = await response.json();
    
    if (!events || events.length === 0) {
      container.innerHTML = '<div class="error-message">No recent activity found</div>';
      return;
    }
    
    // Prioritize PushEvents (commits) but show other activity too
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    const otherEvents = events.filter(e => e.type !== 'PushEvent');
    
    let displayEvents = [];
    if (pushEvents.length >= 3) {
      displayEvents = [...pushEvents.slice(0, 3), ...otherEvents.slice(0, 1)];
    } else {
      displayEvents = events.slice(0, 4);
    }
    
    container.innerHTML = displayEvents.map(event => {
      const repoName = event.repo.name.split('/')[1] || event.repo.name;
      const action = formatGitHubAction(event);
      const date = formatGitHubDate(event.created_at);
      const branch = event.payload.ref ? event.payload.ref.split('/').pop() : null;
      
      return `
        <div class="github-item">
          <div class="github-repo">${repoName}${branch ? ` <span style="color: #6b7280;">• ${branch}</span>` : ''}</div>
          <div class="github-action">${action}</div>
          <div class="github-date">${date}</div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('GitHub Error:', error);
    container.innerHTML = `<div class="error-message">Failed to load GitHub data: ${error.message}</div>`;
  }
}

// OPTION 2: Fetch token from server (alternative approach)
/*
async function getGitHubToken() {
  try {
    const res = await fetch('/github-token');
    if (!res.ok) throw new Error('Failed to fetch GitHub token');
    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error('GitHub Token Error:', error);
    throw error;
  }
}

async function loadGitHub() {
  const container = document.getElementById('github-content');
  
  try {
    const token = await getGitHubToken();
    
    const response = await fetch(
      `https://api.github.com/users/${CONFIG.github.username}/events/public?per_page=20`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`
        }
      }
    );
    
    // ... rest of the implementation
  } catch (error) {
    console.error('GitHub Error:', error);
    container.innerHTML = `<div class="error-message">Failed to load GitHub data</div>`;
  }
}
*/

// ============================================
// AUTO-REFRESH FUNCTIONALITY
// ============================================
function startAutoRefresh() {
  // Refresh every 5 minutes (300000ms)
  setInterval(() => {
    loadAniList();
    loadSpotify();
    loadGitHub();
  }, 300000);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Load all data immediately
  loadAniList();
  loadSpotify();
  loadGitHub();
  
  // Start auto-refresh
  startAutoRefresh();
});