// app/api/sync-instagram/route.js
// POST { link }  ->  { success, simulated, metrics: { views, likes, comments, shares, saves, followers } }
//
// Powers the "Sync Instagram" button. Uses Apify when APIFY_TOKEN (or
// APIFY_API_TOKEN) is set in your environment variables; otherwise (or on
// timeout/failure) returns deterministic simulated metrics so the button always
// works. Instagram does not expose shares/saves publicly, so those are
// synthesized (shares ~= 25% of likes, saves ~= 15% of likes).

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
  const likes = Math.round(views * (0.03 + ((h >> 3) % 5) / 100));   // ~3-8% of views
  const comments = Math.round(likes * (0.01 + ((h >> 5) % 3) / 100)); // ~1-4% of likes
  const shares = Math.round(likes * 0.25);
  const saves = Math.round(likes * 0.15);
  return { views, likes, comments, shares, saves, followers };
}

function isInstagram(link) { return /instagram\.com/i.test(link || ''); }

async function apifyScrape(link, token) {
  // Single post/reel scrape via Apify's Instagram scraper.
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directUrls: [link], resultsType: 'posts', resultsLimit: 1, addParentData: true }),
      signal: AbortSignal.timeout(9000)
    }
  );
  if (!res.ok) throw new Error('Apify scrape failed: ' + res.status);
  const items = await res.json();
  const p = Array.isArray(items) ? items[0] : null;
  if (!p) throw new Error('No data returned');
  const views = p.videoViewCount || p.videoPlayCount || p.igPlayCount || 0;
  const likes = p.likesCount || 0;
  const comments = p.commentsCount || 0;
  const followers = p.ownerFollowersCount || (p.owner && p.owner.followersCount) || 0;
  return {
    views,
    likes,
    comments,
    shares: Math.round(likes * 0.25),
    saves: Math.round(likes * 0.15),
    followers
  };
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

  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;

  if (token && isInstagram(link)) {
    try {
      const metrics = await apifyScrape(link, token);
      if (metrics.views || metrics.likes) {
        return Response.json({ success: true, simulated: false, metrics });
      }
    } catch (e) {
      console.error('Sync fallback:', e?.message || e);
    }
  }

  // Simulated fallback (deterministic from the link).
  return Response.json({ success: true, simulated: true, metrics: simulateMetrics(link) });
}