import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * Typed route maps for the mobile app.
 *
 * Structure: a root native-stack switches between the auth flow and one
 * role-scoped bottom-tab navigator (role comes from the Firestore user doc).
 * The visible tab bar shows each role's main five tabs; the remaining routes
 * are tab screens reachable from the drawer (and hidden from the bar).
 * Detail/modal screens land on the root stack as Phase 5 ports them.
 */

export type MessagesParams = {
  contractId?: string;
  contractTitle?: string;
} | undefined;

export type FreelancerTabsParamList = {
  home: undefined;
  gigs: undefined;
  contracts: undefined;
  payments: undefined;
  messages: MessagesParams;
  proposals: undefined;
  invoices: undefined;
  reviews: undefined;
  profile: undefined;
  notifications: undefined;
  kyc: undefined;
};

export type ClientTabsParamList = {
  home: undefined;
  browse: undefined;
  contracts: undefined;
  payments: undefined;
  messages: MessagesParams;
  proposals: undefined;
  reviews: undefined;
  profile: undefined;
  notifications: undefined;
  kyc: undefined;
};

export type AdminTabsParamList = {
  home: undefined;
  kyc: undefined;
  fraud: undefined;
  disputes: undefined;
  users: undefined;
  notifications: undefined;
  messages: MessagesParams;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  FreelancerTabs: NavigatorScreenParams<FreelancerTabsParamList>;
  ClientTabs: NavigatorScreenParams<ClientTabsParamList>;
  AdminTabs: NavigatorScreenParams<AdminTabsParamList>;
};
