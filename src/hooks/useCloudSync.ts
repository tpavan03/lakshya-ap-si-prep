import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { User } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { cloudConfigured, supabase } from "../lib/supabase";
import { chooseAccountSeed, CloudSessionGuard } from "./cloudSyncPolicy";

type SyncState = "local" | "loading" | "synced" | "saving" | "error";
const nativeRedirect = "com.tpavan.lakshya://login-callback";
const ownerKey = "exam-prep-king:local-owner";
const cacheKey = (owner: string) => `exam-prep-king:account-cache:${owner}`;
const readOwner = () => {
  try {
    return localStorage.getItem(ownerKey);
  } catch {
    return null;
  }
};
const readCache = <T>(owner: string): T | null => {
  try {
    const raw = localStorage.getItem(cacheKey(owner));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const cache = <T>(owner: string, payload: T) => {
  try {
    localStorage.setItem(cacheKey(owner), JSON.stringify(payload));
  } catch {
    /* The live device state remains usable when a backup cache is full. */
  }
};
const writeOwner = (owner: string) => {
  try {
    localStorage.setItem(ownerKey, owner);
  } catch {
    /* In-memory ownership still guards this session. */
  }
};
const unavailable =
  "Cloud sign-in is unavailable. Explore on this device and try again later.";
async function canReachAuth() {
  const controller = new AbortController(),
    timeout = window.setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`,
      {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        signal: controller.signal,
      },
    );
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useCloudSync<T>(
  value: T,
  setValue: Dispatch<SetStateAction<T>>,
  { createEmptyValue }: { createEmptyValue: () => T },
) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!cloudConfigured);
  const [syncState, setSyncState] = useState<SyncState>(
    cloudConfigured ? "loading" : "local",
  );
  const [retry, setRetry] = useState(0);
  const guard = useRef(new CloudSessionGuard());
  const owner = useRef(readOwner());
  const valueRef = useRef(value);
  const seedRef = useRef(value);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const observedSession = useRef(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    valueRef.current = value;
    if (!guard.current.hydrated && owner.current === guard.current.userId)
      seedRef.current = value;
    if (owner.current) cache(owner.current, value);
  }, [value]);

  const upload = useCallback(
    (payload: T) => {
      const generation = guard.current.generation;
      if (!supabase || !userId || !guard.current.canUpload(userId, generation))
        return Promise.resolve();
      const client = supabase;
      // Serialize writes: an older, slower request cannot arrive after the newest one.
      const write = async () => {
        if (!guard.current.canUpload(userId, generation)) return;
        setSyncState("saving");
        const controller = new AbortController(),
          timeout = window.setTimeout(() => controller.abort(), 12000);
        try {
          const { error } = await client
            .from("user_state")
            .upsert({
              user_id: userId,
              payload,
              schema_version: 1,
              updated_at: new Date().toISOString(),
            })
            .abortSignal(controller.signal);
          if (guard.current.isCurrent(userId, generation))
            setSyncState(error ? "error" : "synced");
        } catch {
          if (guard.current.isCurrent(userId, generation))
            setSyncState("error");
        } finally {
          window.clearTimeout(timeout);
        }
      };
      writes.current = writes.current.catch(() => undefined).then(write);
      return writes.current;
    },
    [userId],
  );

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const applySession = (nextUser: User | null, explicitSignIn: boolean) => {
      if (!mounted) return;
      const nextId = nextUser?.id ?? null;
      // TOKEN_REFRESHED and same-user metadata events must not replace unsaved work.
      if (observedSession.current && guard.current.userId === nextId) {
        setUser(nextUser);
        return;
      }
      observedSession.current = true;
      const previousOwner = owner.current;
      if (previousOwner) cache(previousOwner, valueRef.current);
      guard.current.switchAccount(nextId);
      let seed: T;
      if (nextId) {
        seed = chooseAccountSeed({
          userId: nextId,
          owner: previousOwner,
          current: valueRef.current,
          cached: readCache<T>(nextId),
          explicitSignIn,
          empty: createEmptyValue,
        });
      } else {
        seed =
          previousOwner === null || previousOwner === "guest"
            ? valueRef.current
            : (readCache<T>("guest") ?? createEmptyValue());
      }
      owner.current = nextId ?? "guest";
      writeOwner(owner.current);
      seedRef.current = seed;
      valueRef.current = seed;
      setValue(seed);
      setUser(nextUser);
      setSyncState(nextUser ? "loading" : "local");
      setAuthReady(!nextUser);
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) =>
      applySession(session?.user ?? null, event === "SIGNED_IN"),
    );
    // An expired saved token on an unreachable host must not block guest access forever.
    const authTimeout = window.setTimeout(() => {
      if (!observedSession.current) {
        applySession(null, false);
        setSyncState("error");
      }
    }, 12000);
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!observedSession.current)
          applySession(error ? null : (data.session?.user ?? null), false);
      })
      .catch(() => {
        if (!observedSession.current) applySession(null, false);
      });
    return () => {
      mounted = false;
      window.clearTimeout(authTimeout);
      data.subscription.unsubscribe();
    };
  }, [createEmptyValue, setValue]);

  useEffect(() => {
    if (!supabase || !Capacitor.isNativePlatform()) return;
    const client = supabase;
    const handleAuthUrl = async (url: string) => {
      const parsed = new URL(url);
      if (
        parsed.protocol !== "com.tpavan.lakshya:" ||
        parsed.hostname !== "login-callback"
      )
        return;
      const params = new URLSearchParams(
        parsed.hash.replace(/^#/, "") || parsed.search,
      );
      const accessToken = params.get("access_token"),
        refreshToken = params.get("refresh_token"),
        code = params.get("code");
      if (accessToken && refreshToken)
        await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      else if (code) await client.auth.exchangeCodeForSession(code);
      await Browser.close().catch(() => undefined);
    };
    const safeHandle = (url: string) => {
      void handleAuthUrl(url).catch(() => setSyncState("error"));
    };
    void CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (result?.url) safeHandle(result.url);
      })
      .catch(() => setSyncState("error"));
    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) =>
      safeHandle(url),
    );
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  useEffect(() => {
    if (!supabase || !userId || guard.current.hydrated) return;
    const generation = guard.current.generation;
    let cancelled = false;
    const controller = new AbortController(),
      timeout = window.setTimeout(() => controller.abort(), 12000);
    setSyncState("loading");
    void Promise.resolve(
      supabase
        .from("user_state")
        .select("payload")
        .eq("user_id", userId)
        .abortSignal(controller.signal)
        .maybeSingle(),
    )
      .then(({ data, error }) => {
        if (cancelled || !guard.current.isCurrent(userId, generation)) return;
        if (error) {
          setSyncState("error");
          setAuthReady(true);
          return;
        }
        if (data?.payload) {
          // The caller normalizes legacy/v3 payloads before exposing them to the UI.
          setValue(data.payload as T);
          guard.current.hydrated = true;
          setSyncState("synced");
        } else {
          guard.current.hydrated = true;
          void upload(seedRef.current);
        }
        setAuthReady(true);
      })
      .catch(() => {
        if (!cancelled && guard.current.isCurrent(userId, generation)) {
          setSyncState("error");
          setAuthReady(true);
        }
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [retry, setValue, upload, userId]);

  useEffect(() => {
    if (!userId || !guard.current.canUpload(userId, guard.current.generation))
      return;
    const timer = window.setTimeout(() => void upload(value), 900);
    return () => window.clearTimeout(timer);
  }, [upload, userId, value]);

  const signInWithEmail = async (email: string) => {
    if (!supabase) return "Supabase is not configured yet.";
    if (!(await canReachAuth())) return unavailable;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: Capacitor.isNativePlatform()
            ? nativeRedirect
            : window.location.origin,
        },
      });
      return error?.message ?? null;
    } catch {
      return unavailable;
    }
  };
  const signInWithGoogle = async () => {
    if (!supabase) return "Supabase is not configured yet.";
    if (!(await canReachAuth())) return unavailable;
    const native = Capacitor.isNativePlatform();
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: native ? nativeRedirect : window.location.origin,
          skipBrowserRedirect: native,
        },
      });
      if (native && data.url) await Browser.open({ url: data.url });
      return error?.message ?? null;
    } catch {
      return unavailable;
    }
  };
  const signOut = async () => {
    if (!supabase) return;
    await upload(valueRef.current);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      setSyncState("error");
      throw error;
    }
  };
  const syncNow = () => {
    if (!userId) return Promise.resolve();
    if (!guard.current.hydrated) {
      setRetry((attempt) => attempt + 1);
      return Promise.resolve();
    }
    return upload(valueRef.current);
  };

  return {
    cloudConfigured,
    authReady,
    user,
    syncState,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    syncNow,
  };
}
