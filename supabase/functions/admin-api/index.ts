import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    switch (action) {
      case "users": {
        // List all users with their profiles, subscriptions, and sessions
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError) throw usersError;

        // Get profiles
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("*");

        // Get subscriptions
        const { data: subscriptions } = await supabaseAdmin
          .from("subscriptions")
          .select("*");

        // Get active sessions
        const { data: sessions } = await supabaseAdmin
          .from("user_sessions")
          .select("*")
          .eq("is_active", true);

        // Get user roles
        const { data: roles } = await supabaseAdmin
          .from("user_roles")
          .select("*");

        const enrichedUsers = users.users.map(user => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          profile: profiles?.find(p => p.user_id === user.id),
          subscription: subscriptions?.find(s => s.user_id === user.id),
          active_sessions: sessions?.filter(s => s.user_id === user.id) || [],
          roles: roles?.filter(r => r.user_id === user.id).map(r => r.role) || [],
        }));

        return new Response(JSON.stringify({ users: enrichedUsers }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "subscription": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        const { target_user_id, status, expires_at, plan_name } = body;

        if (!target_user_id || !status) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: upsertError } = await supabaseAdmin
          .from("subscriptions")
          .upsert({
            user_id: target_user_id,
            status,
            platform: "manual",
            plan_name: plan_name || "Manual",
            started_at: status === "active" ? new Date().toISOString() : undefined,
            expires_at: expires_at || null,
            cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
          }, { onConflict: "user_id" });

        if (upsertError) throw upsertError;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "block-user": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        const { target_user_id } = body;

        if (!target_user_id) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Invalidate all sessions
        const { error: sessionsError } = await supabaseAdmin
          .from("user_sessions")
          .update({ is_active: false })
          .eq("user_id", target_user_id);

        if (sessionsError) throw sessionsError;

        // Cancel subscription
        const { error: subError } = await supabaseAdmin
          .from("subscriptions")
          .upsert({
            user_id: target_user_id,
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (subError) throw subError;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "force-logout": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        const { target_user_id } = body;

        if (!target_user_id) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Invalidate all sessions
        const { error: sessionsError } = await supabaseAdmin
          .from("user_sessions")
          .update({ is_active: false })
          .eq("user_id", target_user_id);

        if (sessionsError) throw sessionsError;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "stats": {
        // Dashboard statistics
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        
        const { data: activeSubs } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("status", "active");

        const { data: activeSessions } = await supabaseAdmin
          .from("user_sessions")
          .select("id")
          .eq("is_active", true);

        const { data: expiredSubs } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("status", "expired");

        return new Response(JSON.stringify({
          total_users: users?.users?.length || 0,
          active_subscriptions: activeSubs?.length || 0,
          expired_subscriptions: expiredSubs?.length || 0,
          active_sessions: activeSessions?.length || 0,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

  } catch (error) {
    console.error("Admin API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});