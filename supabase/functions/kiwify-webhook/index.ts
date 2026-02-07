import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, signature",
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

    const body = await req.text();
    const payload = JSON.parse(body);
    
    // Verify Kiwify signature (optional but recommended)
    const signature = req.headers.get("signature");
    const kiwifySecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
    
    if (kiwifySecret && signature) {
      const expectedSignature = createHmac("sha1", kiwifySecret)
        .update(body)
        .digest("hex");
      
      if (signature !== expectedSignature) {
        console.error("Invalid Kiwify signature");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Kiwify webhook received:", JSON.stringify(payload, null, 2));

    const event = payload.order_status;
    const buyerEmail = payload.Customer?.email;
    const orderId = payload.order_id;
    const productName = payload.Product?.product_name;

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
      return new Response(JSON.stringify({ 
        message: "User not registered yet",
        email: buyerEmail 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Handle different Kiwify events
    switch (event) {
      case "paid": {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error: upsertError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            status: "active",
            platform: "kiwify",
            external_id: orderId,
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

      case "refunded":
      case "chargedback": {
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