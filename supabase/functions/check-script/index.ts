import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the page
    let html: string;
    try {
      const response = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        // Set a timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
            status: response.status 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      html = await response.text();
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : "Failed to fetch URL",
          details: "The URL may be unreachable, blocked, or require authentication"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for tracker script
    const trackerScriptUrl = "https://creator-campaign-hub.vercel.app/tracker.js";
    const hasTrackerScript = html.includes(trackerScriptUrl) || 
                            html.includes("tracker.js") ||
                            html.includes("creator-campaign-hub.vercel.app/tracker");

    // Also check for campaignId in the URL or in script tags
    const hasCampaignId = html.includes("campaignId") || html.includes("campaign_id");

    // Extract script tags for more detailed analysis
    const scriptTagRegex = /<script[^>]*src=["']([^"']*tracker\.js[^"']*)["'][^>]*>/gi;
    const scriptMatches = Array.from(html.matchAll(scriptTagRegex));

    return new Response(
      JSON.stringify({
        success: true,
        url: targetUrl.toString(),
        hasTrackerScript,
        hasCampaignId,
        scriptFound: scriptMatches.length > 0,
        scriptTags: scriptMatches.map(match => ({
          fullTag: match[0],
          src: match[1]
        })),
        message: hasTrackerScript 
          ? "✅ Tracker script found on this page!"
          : "❌ Tracker script not found. Make sure to add the script tag to the page."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-script:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "An error occurred while checking the URL"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

