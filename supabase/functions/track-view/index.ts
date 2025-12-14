import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_id } = await req.json();

    if (!campaign_id) {
      console.error("Missing campaign_id");
      return new Response(
        JSON.stringify({ error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert the view event
    const { error: insertError } = await supabase
      .from("campaign_events")
      .insert({
        campaign_id,
        event_type: "view",
        source: "api",
      });

    if (insertError) {
      console.error("Error inserting event:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign metrics
    const { error: updateError } = await supabase.rpc("update_campaign_metrics", {
      campaign_uuid: campaign_id,
    });

    if (updateError) {
      console.error("Error updating metrics:", updateError);
    }

    console.log(`View tracked for campaign: ${campaign_id}`);

    return new Response(
      JSON.stringify({ success: true, event_type: "view" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in track-view:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});