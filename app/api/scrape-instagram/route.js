// app/api/scrape-instagram/route.js
// POST { query, platform }  ->  { success, simulated, results: [...] }
// Supports BOTH Instagram and YouTube.
//   - Instagram: Apify when APIFY_TOKEN is set (else simulated).
//   - YouTube:   official YouTube Data API when YOUTUBE_API_KEY is set (else simulated).
// `platform` is 'instagram' | 'youtube' (from the app toggle). A YouTube URL is
// auto-detected regardless of the toggle.

export const maxDuration = 30;

const CATEGORIES = ['Digital Creator', 'Tech', 'Lifestyle', 'Comedy', 'Finance', 'Education', 'Gaming', 'Fitness', 'Food', 'Travel'];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

// ---------- shared simulation ----------
function simulateProfile(username, platform) {
  const h = hash((username || 'x').toLowerCase());
  const followers = 10000 + (h % 1900000);
  const viewRatio = 0.15 + ((h >> 3) % 65) / 100;
  const avgViews = Math.round(followers * viewRatio);
  const avgLikes = Math.round(avgViews * (0.03 + ((h >> 5) % 5) / 100));
  const avgComments = Math.round(avgLikes * (0.01 + ((h >> 7) % 3) / 100));
  const er = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
  const isYt = platform === 'YouTube';
  return {
    username,
    fullName: username.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    profileUrl: isYt ? `https://www.youtube.com/@${username}` : `https://www.instagram.com/${username}/`,
    followers, avgViews, avgLikes, avgComments,
    engagementRate: Number(er.toFixed(2)),
    category: isYt ? 'YouTube Creator' : CATEGORIES[h % CATEGORIES.length],
    isVerified: h % 4 === 0,
    platform: platform || 'Instagram'
  };
}

function simulateSearch(name, platform) {
  const base = (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const handles = [base, base + '_', base + '.official', 'the' + base, base + 'hq'];
  const seen = new Set();
  return handles.filter(hd => hd && !seen.has(hd) && seen.add(hd)).slice(0, 4).map(u => simulateProfile(u, platform));
}

function extractIgUsername(query) {
  const q = (query || '').trim();
  const m = q.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (m) return m[1];
  if (/^@?[A-Za-z0-9._]+$/.test(q) && !q.includes(' ')) return q.replace(/^@/, '');
  return null;
}

// ---------- Instagram (Apify) ----------
function mapApifyProfile(p) {
  const posts = (p.latestPosts || p.posts || []).slice(0, 8);
  const views = posts.map(x => x.videoViewCount || x.videoPlayCount || x.igPlayCount || 0).filter(Boolean);
  const likes = posts.map(x => x.likesCount || 0);
  const comments = posts.map(x => x.commentsCount || 0);
  const followers = p.followersCount || 0;
  const avgViews = avg(views.length ? views : likes.map(l => l * 12));
  const avgLikes = avg(likes);
  const avgComments = avg(comments);
  const denom = avgViews || followers || 1;
  return {
    username: p.username,
    fullName: p.fullName || p.username,
    profileUrl: `https://www.instagram.com/${p.username}/`,
    followers, avgViews, avgLikes, avgComments,
    engagementRate: Number((((avgLikes + avgComments) / denom) * 100).toFixed(2)),
    category: p.businessCategoryName || p.category || '',
    isVerified: !!p.verified,
    platform: 'Instagram'
  };
}

async function apifyProfiles(usernames, token) {
  const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames }), signal: AbortSignal.timeout(25000)
  });
  if (!res.ok) throw new Error('Apify profile scrape failed: ' + res.status);
  const items = await res.json();
  return (Array.isArray(items) ? items : []).filter(p => p && p.username).map(mapApifyProfile);
}

async function apifySearch(name, token) {
  const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-search-scraper/run-sync-get-dataset-items?token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search: name, searchType: 'user', searchLimit: 5 }), signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error('Apify search failed: ' + res.status);
  const items = await res.json();
  return (Array.isArray(items) ? items : []).map(x => x.username || (x.user && x.user.username)).filter(Boolean).slice(0, 4);
}

// ---------- YouTube (Data API) ----------
const YT = 'https://www.googleapis.com/youtube/v3';
async function ytGet(path, params, key) {
  const u = new URL(YT + path);
  Object.entries({ ...params, key }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u.toString(), { signal: AbortSignal.timeout(15000) });
  return r.json();
}

async function ytSearchChannels(name, key) {
  const j = await ytGet('/search', { part: 'snippet', type: 'channel', q: name, maxResults: '4' }, key);
  return (j.items || []).map(i => (i.id && i.id.channelId) || i.snippet?.channelId).filter(Boolean);
}

async function ytResolveChannelIds(query, key) {
  const raw = (query || '').trim();
  try {
    if (/youtube\.com|youtu\.be/i.test(raw)) {
      const u = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'channel' && parts[1]) return [parts[1]];
      if (parts[0] && parts[0].startsWith('@')) {
        const j = await ytGet('/channels', { part: 'id', forHandle: parts[0] }, key);
        const ids = (j.items || []).map(i => i.id); if (ids.length) return ids;
      }
      if (parts[0] === 'user' && parts[1]) {
        const j = await ytGet('/channels', { part: 'id', forUsername: parts[1] }, key);
        const ids = (j.items || []).map(i => i.id); if (ids.length) return ids;
      }
      let vid = '';
      if (u.hostname.includes('youtu.be')) vid = parts[0];
      else if (parts[0] === 'shorts' && parts[1]) vid = parts[1];
      else vid = u.searchParams.get('v') || '';
      if (vid) { const j = await ytGet('/videos', { part: 'snippet', id: vid }, key); const ids = (j.items || []).map(i => i.snippet.channelId); if (ids.length) return ids; }
      const name = decodeURIComponent(parts[parts.length - 1] || '');
      if (name) return await ytSearchChannels(name, key);
    }
    if (raw.startsWith('@')) {
      const j = await ytGet('/channels', { part: 'id', forHandle: raw }, key);
      const ids = (j.items || []).map(i => i.id); if (ids.length) return ids;
    }
  } catch (e) { /* fall through to search */ }
  return await ytSearchChannels(raw, key);
}

async function ytChannelCard(channelId, key) {
  const cj = await ytGet('/channels', { part: 'snippet,statistics,contentDetails', id: channelId }, key);
  const ch = cj.items && cj.items[0];
  if (!ch) return null;
  const subs = Number(ch.statistics?.subscriberCount) || 0;
  const uploads = ch.contentDetails?.relatedPlaylists?.uploads;
  let avgViews = 0, avgLikes = 0, avgComments = 0;
  if (uploads) {
    try {
      const pj = await ytGet('/playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: '8' }, key);
      const ids = (pj.items || []).map(i => i.contentDetails.videoId).filter(Boolean);
      if (ids.length) {
        const vj = await ytGet('/videos', { part: 'statistics', id: ids.join(',') }, key);
        const stats = (vj.items || []).map(v => v.statistics || {});
        avgViews = avg(stats.map(s => Number(s.viewCount) || 0));
        avgLikes = avg(stats.map(s => Number(s.likeCount) || 0));
        avgComments = avg(stats.map(s => Number(s.commentCount) || 0));
      }
    } catch {}
  }
  const er = avgViews > 0 ? (((avgLikes + avgComments) / avgViews) * 100) : 0;
  const custom = ch.snippet?.customUrl || '';
  const handle = custom ? custom.replace(/^@/, '') : (ch.snippet?.title || '').trim();
  return {
    username: handle,
    fullName: ch.snippet?.title || handle,
    profileUrl: custom ? `https://www.youtube.com/${custom.startsWith('@') ? custom : '@' + custom}` : `https://www.youtube.com/channel/${channelId}`,
    followers: subs, avgViews, avgLikes, avgComments,
    engagementRate: Number(er.toFixed(2)),
    category: 'YouTube Creator',
    isVerified: subs > 100000,
    platform: 'YouTube'
  };
}

export async function POST(request) {
  let query = '', platform = '';
  try {
    const body = await request.json();
    query = (body.query || '').toString();
    platform = (body.platform || '').toString().toLowerCase();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
  if (!query.trim()) return Response.json({ success: false, error: 'Please enter a name or link.' });

  const isYouTube = /youtube\.com|youtu\.be/i.test(query) || platform === 'youtube';

  // ---- YouTube path ----
  if (isYouTube) {
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      try {
        const ids = (await ytResolveChannelIds(query, ytKey)).slice(0, 4);
        const cards = [];
        for (const id of ids) { const c = await ytChannelCard(id, ytKey); if (c) cards.push(c); }
        if (cards.length) return Response.json({ success: true, simulated: false, results: cards });
      } catch (e) { console.error('YouTube scrape fallback:', e?.message || e); }
    }
    const looksLikeHandle = /youtube\.com|youtu\.be|^@/.test(query) || (!query.includes(' '));
    const uname = (query.match(/@([A-Za-z0-9._-]+)/) || [])[1] || query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'creator';
    const results = looksLikeHandle ? [simulateProfile(uname, 'YouTube')] : simulateSearch(query, 'YouTube');
    return Response.json({ success: true, simulated: true, results });
  }

  // ---- Instagram path ----
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  const username = extractIgUsername(query);
  if (token) {
    try {
      if (username) {
        const results = await apifyProfiles([username], token);
        if (results.length) return Response.json({ success: true, simulated: false, results });
      } else {
        const usernames = await apifySearch(query, token);
        if (usernames.length) {
          const results = await apifyProfiles(usernames, token);
          if (results.length) return Response.json({ success: true, simulated: false, results });
        }
      }
    } catch (e) { console.error('IG scrape fallback:', e?.message || e); }
  }
  const results = username ? [simulateProfile(username, 'Instagram')] : simulateSearch(query, 'Instagram');
  return Response.json({ success: true, simulated: true, results });
}