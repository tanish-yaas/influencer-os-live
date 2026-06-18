import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { link } = body;

    if (!link) {
      return NextResponse.json({ success: false, error: "No link provided" }, { status: 400 });
    }

    // 1. Extract the Instagram Shortcode (e.g., 'C3bXYZ' from instagram.com/p/C3bXYZ/)
    const urlParts = link.split('/');
    const shortcodeIndex = urlParts.indexOf('p') !== -1 ? urlParts.indexOf('p') + 1 : urlParts.indexOf('reel') + 1;
    const shortcode = urlParts[shortcodeIndex];

    console.log(`[BACKEND] Fetching metrics for shortcode: ${shortcode}`);

    // ==========================================
    // PRODUCTION API INTEGRATION GOES HERE
    // In production, you would call Apify or Meta Business Discovery here:
    // const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}...`)
    // ==========================================

    // For the prototype, we simulate a successful API response from Meta/Scraper
    // Generates realistic variation based on a random baseline
    const baseViews = Math.floor(Math.random() * 400000) + 50000; 
    
    const simulatedMetrics = {
      views: baseViews,
      likes: Math.floor(baseViews * 0.08), // 8% like rate
      comments: Math.floor(baseViews * 0.005), // 0.5% comment rate
      shares: Math.floor(baseViews * 0.02), // 2% share rate
      saves: Math.floor(baseViews * 0.015), // 1.5% save rate
    };

    // Add a slight delay to mimic real network latency
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Return the clean data payload to the frontend
    return NextResponse.json({ 
      success: true, 
      metrics: simulatedMetrics 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}