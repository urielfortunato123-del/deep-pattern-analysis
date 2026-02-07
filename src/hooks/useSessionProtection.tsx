import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SESSION_CHECK_INTERVAL = 30000; // Check every 30 seconds
const SESSION_TOKEN_KEY = "app_session_token";

// Generate a unique session token
const generateSessionToken = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

// Get device info
const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  const platform = navigator.platform || "Unknown";
  return `${platform} - ${ua.substring(0, 100)}`;
};

export const useSessionProtection = (userId: string | null) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  // Register new session and invalidate others
  const registerSession = useCallback(async (uid: string) => {
    try {
      const sessionToken = generateSessionToken();
      sessionTokenRef.current = sessionToken;
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);

      // Insert new session
      const { error: insertError } = await supabase
        .from("user_sessions")
        .insert({
          user_id: uid,
          session_token: sessionToken,
          device_info: getDeviceInfo(),
          is_active: true,
        });

      if (insertError) {
        console.error("Error registering session:", insertError);
        return;
      }

      // Invalidate all other sessions for this user
      const { error: rpcError } = await supabase.rpc("invalidate_other_sessions", {
        p_user_id: uid,
        p_current_session_token: sessionToken,
      });

      if (rpcError) {
        console.error("Error invalidating other sessions:", rpcError);
      }

      console.log("Session registered successfully");
    } catch (error) {
      console.error("Session registration error:", error);
    }
  }, []);

  // Check if current session is still valid
  const checkSessionValidity = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc("is_session_valid", {
        p_session_token: sessionToken,
      });

      if (error) {
        console.error("Error checking session:", error);
        return;
      }

      if (!data) {
        // Session was invalidated (someone logged in from another device)
        toast({
          title: "Sessão encerrada",
          description: "Sua conta foi acessada em outro dispositivo. Você foi desconectado.",
          variant: "destructive",
        });

        // Clear local session and sign out
        localStorage.removeItem(SESSION_TOKEN_KEY);
        await supabase.auth.signOut();
        navigate("/");
      } else {
        // Update last seen timestamp
        await supabase.rpc("update_session_last_seen", {
          p_session_token: sessionToken,
        });
      }
    } catch (error) {
      console.error("Session check error:", error);
    }
  }, [toast, navigate]);

  // Cleanup session on logout
  const cleanupSession = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (sessionToken) {
      try {
        await supabase
          .from("user_sessions")
          .update({ is_active: false })
          .eq("session_token", sessionToken);
      } catch (error) {
        console.error("Error cleaning up session:", error);
      }
      
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    
    sessionTokenRef.current = null;
  }, []);

  useEffect(() => {
    if (userId) {
      // Check if we already have a valid session token
      const existingToken = localStorage.getItem(SESSION_TOKEN_KEY);
      
      if (!existingToken || !sessionTokenRef.current) {
        // Register new session
        registerSession(userId);
      }

      // Start periodic session validation
      intervalRef.current = setInterval(checkSessionValidity, SESSION_CHECK_INTERVAL);

      // Also check immediately
      checkSessionValidity();
    } else {
      // User logged out, cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, registerSession, checkSessionValidity]);

  return { cleanupSession };
};
