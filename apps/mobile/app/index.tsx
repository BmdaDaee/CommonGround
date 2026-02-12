import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("booting...");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user?.email ?? null);
      setStatus(data.session ? "session OK" : "no session (signed out)");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setStatus(session ? "session OK" : "signed out");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>CommonGround</Text>
      <Text style={{ marginTop: 10 }}>{status}</Text>
      <Text style={{ marginTop: 10, opacity: 0.7 }}>{email ? `user: ${email}` : "user: none"}</Text>

      {email ? (
        <Pressable onPress={signOut} style={{ marginTop: 18, padding: 12, borderWidth: 1, borderRadius: 10 }}>
          <Text>Sign out</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
