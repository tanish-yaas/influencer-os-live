import { NextResponse } from 'next/server';

// Simple hash helper to generate consistent mock numbers based on the link string
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { link } = body;

    if (!link) {
      return NextResponse.json({ success: false, error: "No link provided" }, { status: 400 });
    }

    console.log(`[SIMULATOR] Generating high-fidelity mock metrics for: ${link}`);

    // Generate a stable numeric seed from the link text
    const seed = hashCode(link);
    
    // Create realistic, reproducible performance data bounded by the seed
    const baseViews = (seed % 450000) + 50000; // Generates views between 50k and 500k
    const likes = Math.floor(baseViews * 0.065); // 6.5% standard engagement rate
    const comments = Math.floor(baseViews * 0.004); // 0.4% comment rate
    const shares = Math.floor(baseViews * 0.012); // 1.2% share rate
    const saves = Math.floor(baseViews * 0.008); // 0.8% save rate

    const simulatedMetrics = {
      views: baseViews,
      likes,
      comments,
      shares,
      saves
    };

    // Keep the network latency delay so the loading spinners still function beautifully in the UI
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({ 
      success: true, 
      metrics: simulatedMetrics 
    });

  } catch (error) {
    console.error("Simulator Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}