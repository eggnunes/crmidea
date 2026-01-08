import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ClientProfile {
  id: string;
  user_id: string;
  consultant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  office_name: string | null;
  created_at: string;
}

interface ClientAuthContextType {
  user: User | null;
  session: Session | null;
  profile: ClientProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, consultantId: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchClientProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchClientProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchClientProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching client profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, consultantId: string) => {
    try {
      const redirectUrl = `${window.location.origin}/area-cliente`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            is_consulting_client: true,
            consultant_id: consultantId,
          },
        },
      });

      if (error) throw error;

      // Create client profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from("client_profiles")
          .insert({
            user_id: data.user.id,
            consultant_id: consultantId,
            full_name: fullName,
            email: email,
          });

        if (profileError) {
          console.error("Error creating client profile:", profileError);
        }

        // Create initial form progress
        const { error: progressError } = await supabase
          .from("diagnostic_form_progress")
          .insert({
            client_user_id: data.user.id,
            consultant_id: consultantId,
            current_step: 1,
            form_data: {},
          });

        if (progressError) {
          console.error("Error creating form progress:", progressError);
        }

        // Create timeline event for signup
        await supabase
          .from("client_timeline_events")
          .insert({
            client_user_id: data.user.id,
            consultant_id: consultantId,
            event_type: "signup",
            title: "Cadastro realizado",
            description: "Bem-vindo à consultoria IDEA! Seu cadastro foi concluído com sucesso.",
          });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <ClientAuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}
