// app/api/sync-instagram/route.js
// POST { link }  ->  { success, simulated, metrics: { views, likes, comments, shares, saves, followers } }
//
// Powers the "Sync" button for BOTH Instagram and YouTube deliverable links.
//   - Instagram: Apify when APIFY_TOKEN is set (else simulated).
//   - YouTube:   official YouTube Data API when YOUTUBE_API_KEY is set (else simulated).
// Instagram/YouTube don't expose shares & saves, so those are synthesized
// (shares ~= 25% of likes, saves ~= 15% of likes).

export const maxDuration = 30;

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function simulateMetrics(link) {
  const h = hash(String(link || 'x'));
  const followers = 20000 + (h % 1500000);
  const views = 5000 + (h % 900000);
  const likes = Math.round(views * (0.03 + ((h >> 3) % 5) / 100));
  const comments = Math.round(likes * (0.01 + ((h >> 5) % 3) / 100));
  return { views, likes, comments, shares: Math.round(likes * 0.25), saves: Math.round(likes * 0.15), followers };
}

const isInstagram = (l) => /instagram\.com/i.test(l || '');
const isYouTube = (l) => /youtube\.com|youtu\.be/i.test(l || '');

function ytVideoId(link) {
  try {
    const u = new URL(link);
    const h = u.hostname.toLowerCase();
    if (h.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || '';
    if (h.includes('youtube.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const si = parts.findIndex(p => p.toLowerCase() === 'shorts');
      if (si >= 0 && parts[si + 1]) return parts[si + 1];
      return u.searchParams.get('v') || '';
    }
  } catch {}
  return '';
}

async function youtubeMetrics(link, key) {
  const id = ytVideoId(link);
  if (!id) throw new Error('No YouTube video id in link');
  const vr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${id}&key=${key}`, { signal: AbortSignal.timeout(12000) });
  const vj = await vr.json();
  const it = vj.items && vj.items[0];
  if (!it) throw new Error('Video not found');
  const st = it.statistics || {};
  const views = Number(st.viewCount) || 0;
  const likes = Number(st.likeCount) || 0;
  const comments = Number(st.commentCount) || 0;
  let followers = 0;
  const channelId = it.snippet && it.snippet.channelId;
  if (channelId) {
    try {
      const cr = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`, { signal: AbortSignal.timeout(10000) });
      const cj = await cr.json();
      followers = Number(cj.items?.[0]?.statistics?.subscriberCount) || 0;
    } catch {}
  }
  return { views, likes, comments, shares: Math.round(likes * 0.25), saves: Math.round(likes * 0.15), followers };
}

async function apifyInstagram(link, token) {
  const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directUrls: [link], resultsType: 'posts', resultsLimit: 1, addParentData: true }),
    signal: AbortSignal.timeout(9000)
  });
  if (!res.ok) throw new Error('Apify scrape failed: ' + res.status);
  const items = await res.json();
  const p = Array.isArray(items) ? items[0] : null;
  if (!p) throw new Error('No data returned');
  const views = p.videoViewCount || p.videoPlayCount || p.igPlayCount || 0;
  const likes = p.likesCount || 0;
  const comments = p.commentsCount || 0;
  const followers = p.ownerFollowersCount || (p.owner && p.owner.followersCount) || 0;
  return { views, likes, comments, shares: Math.round(likes * 0.25), saves: Math.round(likes * 0.15), followers };
}

export async function POST(request) {
  let link = '';
  try {
    const body = await request.json();
    link = (body.link || '').toString();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
  if (!link.trim()) return Response.json({ success: false, error: 'No link provided.' });

  // YouTube path
  if (isYouTube(link)) {
    const ytKey = process.env.YOUTUBE_API_KEY;
    if (ytKey) {
      try {
        const metrics = await youtubeMetrics(link, ytKey);
        if (metrics.views || metrics.likes) return Response.json({ success: true, simulated: false, metrics });
      } catch (e) { console.error('YouTube sync fallback:', e?.message || e); }
    }
    return Response.json({ success: true, simulated: true, metrics: simulateMetrics(link) });
  }

  // Instagram path
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (token && isInstagram(link)) {
    try {
      const metrics = await apifyInstagram(link, token);
      if (metrics.views || metrics.likes) return Response.json({ success: true, simulated: false, metrics });
    } catch (e) { console.error('IG sync fallback:', e?.message || e); }
  }

  return Response.json({ success: true, simulated: true, metrics: simulateMetrics(link) });
}