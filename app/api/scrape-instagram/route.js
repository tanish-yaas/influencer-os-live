// app/api/scrape-instagram/route.js
// POST { query }  ->  { success, simulated, results: [...] }
// `query` can be an Instagram profile URL/username OR a creator name.
//
// Live scraping uses Apify when APIFY_TOKEN (or APIFY_API_TOKEN) is set in your
// Vercel environment variables. Without a token — or if Apify times out/fails —
// the route returns deterministic *simulated* data so the UI is always usable.
// Note: searching Instagram by NAME is inherently unreliable (no official API);
// scraping by profile LINK is the dependable path.

export const maxDuration = 30;

const CATEGORIES = ['Digital Creator', 'Tech', 'Lifestyle', 'Comedy', 'Finance', 'Education', 'Gaming', 'Fitness', 'Food', 'Travel'];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function extractUsername(query) {
  const q = query.trim();
  const m = q.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (m) return m[1];
  if (/^@?[A-Za-z0-9._]+$/.test(q) && !q.includes(' ')) return q.replace(/^@/, '');
  return null;
}

function simulateProfile(username) {
  const h = hash(username.toLowerCase());
  const followers = 10000 + (h % 1900000);
  const viewRatio = 0.15 + ((h >> 3) % 65) / 100; // 0.15 - 0.80
  const avgViews = Math.round(followers * viewRatio);
  const avgLikes = Math.round(avgViews * (0.03 + ((h >> 5) % 5) / 100));
  const avgComments = Math.round(avgLikes * (0.01 + ((h >> 7) % 3) / 100));
  const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
  return {
    username,
    fullName: username.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    profileUrl: `https://www.instagram.com/${username}/`,
    followers,
    avgViews,
    avgLikes,
    avgComments,
    engagementRate: Number(engagementRate.toFixed(2)),
    category: CATEGORIES[h % CATEGORIES.length],
    isVerified: h % 4 === 0
  };
}

function simulateSearch(name) {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const handles = [base, base + '_', base + '.official', 'the' + base, base + 'hq'];
  const seen = new Set();
  return handles.filter(hd => hd && !seen.has(hd) && seen.add(hd)).slice(0, 4).map(simulateProfile);
}

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function mapApifyProfile(p) {
  const posts = (p.latestPosts || p.posts || []).slice(0, 8);
  const views = posts.map(x => x.videoViewCount || x.videoPlayCount || x.igPlayCount || 0).filter(Boolean);
  const likes = posts.map(x => x.likesCount || 0);
  const comments = posts.map(x => x.commentsCount || 0);
  const followers = p.followersCount || 0;
  const avgViews = Math.round(avg(views.length ? views : likes.map(l => l * 12)));
  const avgLikes = Math.round(avg(likes));
  const avgComments = Math.round(avg(comments));
  const denom = avgViews || followers || 1;
  return {
    username: p.username,
    fullName: p.fullName || p.username,
    profileUrl: `https://www.instagram.com/${p.username}/`,
    followers,
    avgViews,
    avgLikes,
    avgComments,
    engagementRate: Number((((avgLikes + avgComments) / denom) * 100).toFixed(2)),
    category: p.businessCategoryName || p.category || '',
    isVerified: !!p.verified
  };
}

async function apifyProfiles(usernames, token) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames }),
      signal: AbortSignal.timeout(25000)
    }
  );
  if (!res.ok) throw new Error('Apify profile scrape failed: ' + res.status);
  const items = await res.json();
  return (Array.isArray(items) ? items : []).filter(p => p && p.username).map(mapApifyProfile);
}

async function apifySearch(name, token) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-search-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: name, searchType: 'user', searchLimit: 5 }),
      signal: AbortSignal.timeout(20000)
    }
  );
  if (!res.ok) throw new Error('Apify search failed: ' + res.status);
  const items = await res.json();
  const usernames = (Array.isArray(items) ? items : [])
    .map(x => x.username || (x.user && x.user.username))
    .filter(Boolean)
    .slice(0, 4);
  return usernames;
}

export async function POST(request) {
  let query = '';
  try {
    const body = await request.json();
    query = (body.query || '').toString();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
  if (!query.trim()) return Response.json({ success: false, error: 'Please enter a name or Instagram link.' });

  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  const username = extractUsername(query);

  // Try live scraping when a token is configured.
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
    } catch (e) {
      // fall through to simulation
      console.error('Scrape fallback:', e?.message || e);
    }
  }

  // Simulated fallback (always returns something usable).
  const results = username ? [simulateProfile(username)] : simulateSearch(query);
  return Response.json({ success: true, simulated: true, results });
}