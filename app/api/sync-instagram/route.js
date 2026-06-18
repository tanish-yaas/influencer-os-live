import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { link } = body;

    if (!link) {
      return NextResponse.json({ success: false, error: "No link provided" }, { status: 400 });
    }

    console.log(`[BACKEND] Fetching live data from Scraping-Bot for: ${link}`);

    // 1. Grab your secure credentials from the environment variables
    const username = process.env.SCRAPING_BOT_USERNAME;
    const apiKey = process.env.SCRAPING_BOT_API_KEY;

    // 2. Encode them into a Basic Auth header (Required by Scraping-Bot)
    const authHeader = 'Basic ' + Buffer.from(username + ':' + apiKey).toString('base64');

    // 3. Ping the Scraping-Bot Universal Scraper API
    const response = await fetch('https://api.scraping-bot.io/scrape/data-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        scraper_name: "instagramPost",
        url: link
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Scraping-Bot returned status ${response.status}: ${errorText}`);
    }

    const jsonResult = await response.json();
    
    // 4. Extract the metrics from the Scraping-Bot JSON payload
    // (Safely handling nested data arrays/objects just in case)
    const postData = jsonResult.data ? (Array.isArray(jsonResult.data) ? jsonResult.data[0] : jsonResult.data) : jsonResult;

    const realMetrics = {
      views: Number(postData.video_view_count || postData.view_count || postData.views || 0),
      likes: Number(postData.like_count || postData.likes || 0),
      comments: Number(postData.comment_count || postData.comments || 0),
      shares: Number(postData.share_count || postData.shares || 0), 
      saves: Number(postData.save_count || postData.saves || 0)     
    };

    // Fallback: If it's a static image post, Instagram doesn't return "views". 
    // In influencer reporting, we usually fall back to likes as the baseline view count.
    if (realMetrics.views === 0 && realMetrics.likes > 0) {
      realMetrics.views = realMetrics.likes; 
    }

    // 5. Send the real data back to your Influencer OS Frontend!
    return NextResponse.json({ 
      success: true, 
      metrics: realMetrics 
    });

  } catch (error) {
    console.error("Scraping-Bot Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}