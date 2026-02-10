import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "expo-router";
import { firebaseAuth } from "./firebase";
import { ensureSession } from "./api";
import { getPairIdFromSession } from "./pairing";

type AppPath = "/sign-in" | "/pair" | "/chat";

const SIGN_IN_PATH: AppPath = "/sign-in";
const PAIR_PATH: AppPath = "/pair";
const CHAT_PATH: AppPath = "/chat";

function normalizePath(pathname: string | null | undefined) {
  if (!pathname) return "/";
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "");
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const pathnameRef = useRef(normalizePath(pathname));
  const authDecisionSeqRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = normalizePath(pathname);
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    const replaceIfChanged = (target: AppPath) => {
      const currentPath = pathnameRef.current;
      const targetPath = normalizePath(target);
      if (currentPath === targetPath) return;
      router.replace(target);
    };

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      const decisionSeq = ++authDecisionSeqRef.current;
      if (!mounted) return;

      try {
        if (!user) {
          replaceIfChanged(SIGN_IN_PATH);
          return;
        }

        const session = await ensureSession();
        if (!mounted || authDecisionSeqRef.current !== decisionSeq) return;

        const pairId = getPairIdFromSession(session);
        if (!pairId) {
          replaceIfChanged(PAIR_PATH);
        } else {
          replaceIfChanged(CHAT_PATH);
        }
      } catch {
        replaceIfChanged(SIGN_IN_PATH);
      } finally {
        if (mounted && authDecisionSeqRef.current === decisionSeq) {
          setReady(true);
        }
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
