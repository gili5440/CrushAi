import { SearchResult } from "../types";

export type QuizAnswers = {
  ageMin?: number;
  ageMax?: number;
  hair?: string;
  eyes?: string;
  body?: string;
  religionPref?: string;
  regionPref?: string;
  smoking?: string;
  goal?: string;
  evening?: string;
  value?: string;
  plan?: string;
  conflict?: string;
};

export type AnalyzingParams =
  | { source: "visual"; photoUri: string }
  | { source: "quiz"; answers: QuizAnswers };

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  Auth: undefined;
  Forgot: undefined;
  Otp: { mode: "signup" | "login" };
  Onboarding: undefined;
  Notif: undefined;
  Quiz: undefined;
  Analyzing: AnalyzingParams;
  ProfileDetail: { profile: SearchResult };
  Match: { profile: SearchResult };
  Chatroom: { matchId: string; name: string; avatarSeed: string };
  Premium: undefined;
  Boost: undefined;
  Inbox: undefined;
  Discovery: undefined;
  ShowMe: undefined;
  Interests: undefined;
  Orientation: undefined;
  EditProfile: undefined;
  Verify: undefined;
  Safety: undefined;
  DeleteAccount: undefined;
  Invite: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Results: undefined;
  Chats: undefined;
  Settings: undefined;
};
