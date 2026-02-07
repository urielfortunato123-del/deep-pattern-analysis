import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify Hotmart webhook token (optional but recommended)
    const hottok = req.headers.get("x-hotmart-hottok");
    const expectedHottok = Deno.env.get("HOTMART_HOTTOK");
    
    if (expectedHottok && hottok !== expectedHottok) {
      console.error("Invalid Hotmart token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("Hotmart webhook received:", JSON.stringify(payload, null, 2));

    const event = payload.event;
    const buyerEmail = payload.data?.buyer?.email;
    const transactionId = payload.data?.purchase?.transaction;
    const productName = payload.data?.product?.name;

    if (!buyerEmail) {
      return new Response(JSON.stringify({ error: "Buyer email not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(JSON.stringify({ error: "Failed to find user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.users.find(u => u.email === buyerEmail);

    if (!user) {
      console.log(`User with email ${buyerEmail} not found`);
      // You might want to create a pending subscription for when they sign up
      return new Response(JSON.stringify({ 
        message: "User not registered yet",
        email: buyerEmail 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Handle different Hotmart events
    switch (event) {
      case "PURCHASE_APPROVED":
      case "PURCHASE_COMPLETE": {
        // Calculate expiry (30 days from now for monthly)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error: upsertError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            status: "active",
            platform: "hotmart",
            external_id: transactionId,
            plan_name: productName,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            cancelled_at: null,
          }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Error upserting subscription:", upsertError);
          return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case "PURCHASE_REFUNDED":
      case "PURCHASE_CHARGEBACK":
      case "SUBSCRIPTION_CANCELLATION": {
        const { error: cancelError } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (cancelError) {
          console.error("Error cancelling subscription:", cancelError);
          return new Response(JSON.stringify({ error: "Failed to cancel subscription" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      case "SUBSCRIPTION_RENEWAL": {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error: renewError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            expires_at: expiresAt.toISOString(),
            cancelled_at: null,
          })
          .eq("user_id", userId);

        if (renewError) {
          console.error("Error renewing subscription:", renewError);
          return new Response(JSON.stringify({ error: "Failed to renew subscription" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Subscription renewed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event}`);
    }

    return new Response(JSON.stringify({ success: true, event }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});