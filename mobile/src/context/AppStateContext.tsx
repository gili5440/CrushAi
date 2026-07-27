import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { SearchResult } from "../types";

const DAILY_LIMIT = 3;
const KEYS = {
  hasSearched: "ca_has_searched",
  isPremium: "ca_is_premium",
  chatsToday: "ca_chats_today",
  boost: "ca_boost_active",
  verified: "ca_verified",
};

export type PendingDestination =
  | { kind: "tab"; tab: "Results" | "Chats" | "Settings" }
  | { kind: "visualSearch"; photoUri: string }
  | { kind: "quizSearch"; answers: Record<string, any> }
  | null;

type ChatsToday = { date: string; count: number };

type AppStateValue = {
  hasSearched: boolean;
  markSearched: () => void;

  isPremium: boolean;
  setPremium: (v: boolean) => void;

  dailyLimit: number;
  newChatsToday: number;
  canStartNewChat: boolean;
  recordNewChatStarted: () => void;

  boostActive: boolean;
  activateBoost: () => void;

  verifiedProfile: boolean;
  setVerifiedProfile: (v: boolean) => void;

  pendingDestination: PendingDestination;
  setPendingDestination: (d: PendingDestination) => void;

  lastResults: SearchResult[];
  lastSearchId: string | null;
  setLastSearch: (searchId: string, results: SearchResult[]) => void;
  removeFromResults: (profileId: string) => SearchResult | undefined;
  restoreLastRemoved: () => void;
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [hasSearched, setHasSearched] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [chatsToday, setChatsToday] = useState<ChatsToday>({ date: todayKey(), count: 0 });
  const [boostActive, setBoostActive] = useState(false);
  const [verifiedProfile, setVerifiedProfileState] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<PendingDestination>(null);
  const [lastResults, setLastResults] = useState<SearchResult[]>([]);
  const [lastSearchId, setLastSearchId] = useState<string | null>(null);
  const [lastRemoved, setLastRemoved] = useState<{ item: SearchResult; index: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [hs, prem, chats, boost, verified] = await Promise.all([
        AsyncStorage.getItem(KEYS.hasSearched),
        AsyncStorage.getItem(KEYS.isPremium),
        AsyncStorage.getItem(KEYS.chatsToday),
        AsyncStorage.getItem(KEYS.boost),
        AsyncStorage.getItem(KEYS.verified),
      ]);
      if (hs === "1") setHasSearched(true);
      if (prem === "1") setIsPremium(true);
      if (boost === "1") setBoostActive(true);
      if (verified === "1") setVerifiedProfileState(true);
      if (chats) {
        const parsed: ChatsToday = JSON.parse(chats);
        setChatsToday(parsed.date === todayKey() ? parsed : { date: todayKey(), count: 0 });
      }
    })();
  }, []);

  function markSearched() {
    setHasSearched(true);
    AsyncStorage.setItem(KEYS.hasSearched, "1");
  }

  function setPremium(v: boolean) {
    setIsPremium(v);
    AsyncStorage.setItem(KEYS.isPremium, v ? "1" : "0");
  }

  function recordNewChatStarted() {
    const next: ChatsToday = { date: todayKey(), count: chatsToday.count + 1 };
    setChatsToday(next);
    AsyncStorage.setItem(KEYS.chatsToday, JSON.stringify(next));
  }

  function activateBoost() {
    setBoostActive(true);
    AsyncStorage.setItem(KEYS.boost, "1");
  }

  function setVerifiedProfile(v: boolean) {
    setVerifiedProfileState(v);
    AsyncStorage.setItem(KEYS.verified, v ? "1" : "0");
  }

  function setLastSearch(searchId: string, results: SearchResult[]) {
    setLastSearchId(searchId);
    setLastResults(results);
    setLastRemoved(null);
  }

  function removeFromResults(profileId: string) {
    const index = lastResults.findIndex((r) => r.profile_id === profileId);
    if (index === -1) return undefined;
    const removed = lastResults[index];
    setLastResults((prev) => prev.filter((r) => r.profile_id !== profileId));
    setLastRemoved({ item: removed, index });
    return removed;
  }

  function restoreLastRemoved() {
    if (!lastRemoved) return;
    setLastResults((prev) => {
      const next = [...prev];
      next.splice(Math.min(lastRemoved.index, next.length), 0, lastRemoved.item);
      return next;
    });
    setLastRemoved(null);
  }

  const value: AppStateValue = {
    hasSearched,
    markSearched,
    isPremium,
    setPremium,
    dailyLimit: DAILY_LIMIT,
    newChatsToday: chatsToday.count,
    canStartNewChat: isPremium || chatsToday.count < DAILY_LIMIT,
    recordNewChatStarted,
    boostActive,
    activateBoost,
    verifiedProfile,
    setVerifiedProfile,
    pendingDestination,
    setPendingDestination,
    lastResults,
    lastSearchId,
    setLastSearch,
    removeFromResults,
    restoreLastRemoved,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
