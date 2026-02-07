import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subscription {
  id: string;
  user_id: string;
  status: "active" | "expired" | "cancelled" | "pending";
  platform: string | null;
  plan_name: string | null;
  started_at: string | null;
  expires_at: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription:", error);
          setHasAccess(false);
        } else if (data) {
          setSubscription(data as Subscription);
          
          // Check if subscription is active and not expired
          const isActive = data.status === "active";
          const notExpired = !data.expires_at || new Date(data.expires_at) > new Date();
          setHasAccess(isActive && notExpired);
        } else {
          setSubscription(null);
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Subscription check error:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

    // Subscribe to changes
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { subscription, loading, hasAccess };
};
