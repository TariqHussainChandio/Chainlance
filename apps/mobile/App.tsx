import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import type {
  AdminTabsParamList,
  ClientTabsParamList,
  FreelancerTabsParamList,
  RootStackParamList,
} from "./src/navigation/types";

import { SplashScreen } from "./src/screens/auth/SplashScreen";
import { WelcomeScreen } from "./src/screens/auth/WelcomeScreen";
import { LoginScreen } from "./src/screens/auth/LoginScreen";
import { RegisterScreen } from "./src/screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "./src/screens/auth/ForgotPasswordScreen";

import { FreelancerHomeScreen } from "./src/screens/freelancer/FreelancerHomeScreen";
import { FreelancerGigsScreen } from "./src/screens/freelancer/FreelancerGigsScreen";
import { FreelancerContractsScreen } from "./src/screens/freelancer/FreelancerContractsScreen";
import { FreelancerProposalsScreen } from "./src/screens/freelancer/FreelancerProposalsScreen";
import { FreelancerPaymentsScreen } from "./src/screens/freelancer/FreelancerPaymentsScreen";
import { FreelancerInvoicesScreen } from "./src/screens/freelancer/FreelancerInvoicesScreen";
import { FreelancerReviewsScreen } from "./src/screens/freelancer/FreelancerReviewsScreen";
import { FreelancerProfileScreen } from "./src/screens/freelancer/FreelancerProfileScreen";

import { ClientHomeScreen } from "./src/screens/client/ClientHomeScreen";
import { ClientBrowseScreen } from "./src/screens/client/ClientBrowseScreen";
import { ClientProposalsScreen } from "./src/screens/client/ClientProposalsScreen";
import { ClientContractsScreen } from "./src/screens/client/ClientContractsScreen";
import { ClientPaymentsScreen } from "./src/screens/client/ClientPaymentsScreen";
import { ClientReviewsScreen } from "./src/screens/client/ClientReviewsScreen";
import { ClientProfileScreen } from "./src/screens/client/ClientProfileScreen";

import { AdminHomeScreen } from "./src/screens/admin/AdminHomeScreen";
import { AdminKycScreen } from "./src/screens/admin/AdminKycScreen";
import { AdminFraudScreen } from "./src/screens/admin/AdminFraudScreen";
import { AdminDisputesScreen } from "./src/screens/admin/AdminDisputesScreen";
import { AdminUsersScreen } from "./src/screens/admin/AdminUsersScreen";

import { MessagesScreen } from "./src/screens/shared/MessagesScreen";
import { NotificationsScreen } from "./src/screens/shared/NotificationsScreen";
import { KycScreen } from "./src/screens/shared/KycScreen";

import { CustomDrawerModal, DrawerLink } from "./src/components/CustomDrawerModal";
import { BottomTabBar, TabItem } from "./src/components/BottomTabBar";

// ─── Role route metadata ─────────────────────────────────────────────────────

const freelancerDrawerLinks: DrawerLink[] = [
  { key: "home", label: "Dashboard Overview", iconName: "home" },
  { key: "gigs", label: "My Gigs Services", iconName: "briefcase" },
  { key: "contracts", label: "Active Contracts", iconName: "scroll" },
  { key: "proposals", label: "Submitted Proposals", iconName: "file" },
  { key: "payments", label: "Earnings & Payouts", iconName: "wallet" },
  { key: "invoices", label: "Invoices & Receipts", iconName: "receipt" },
  { key: "kyc", label: "KYC Verification", iconName: "user-check" },
  { key: "notifications", label: "System Notifications", iconName: "bell" },
  { key: "reviews", label: "Client Reviews", iconName: "star" },
  { key: "profile", label: "Profile & Portfolio", iconName: "user" },
  { key: "messages", label: "Messages Chat", iconName: "message" },
];

const freelancerTabs: TabItem[] = [
  { key: "home", label: "Dashboard" },
  { key: "gigs", label: "Gigs" },
  { key: "contracts", label: "Contracts" },
  { key: "payments", label: "Earnings" },
  { key: "messages", label: "Messages" },
];

const clientDrawerLinks: DrawerLink[] = [
  { key: "home", label: "Client Portal", iconName: "home" },
  { key: "browse", label: "Browse & Hire Talent", iconName: "search" },
  { key: "proposals", label: "Applicant Proposals", iconName: "file" },
  { key: "contracts", label: "Active Contracts", iconName: "scroll" },
  { key: "payments", label: "Payments & Invoices", iconName: "wallet" },
  { key: "kyc", label: "KYC Verification", iconName: "user-check" },
  { key: "notifications", label: "Notifications", iconName: "bell" },
  { key: "reviews", label: "Feedback & Reviews", iconName: "star" },
  { key: "profile", label: "Company Profile", iconName: "user" },
  { key: "messages", label: "Messages Chat", iconName: "message" },
];

const clientTabs: TabItem[] = [
  { key: "home", label: "Dashboard" },
  { key: "browse", label: "Browse" },
  { key: "contracts", label: "Contracts" },
  { key: "payments", label: "Payments" },
  { key: "messages", label: "Messages" },
];

const adminDrawerLinks: DrawerLink[] = [
  { key: "home", label: "Admin Control Suite", iconName: "shield" },
  { key: "kyc", label: "KYC Verifications", iconName: "user-check" },
  { key: "fraud", label: "AI Fraud Engine", iconName: "alert-triangle" },
  { key: "disputes", label: "Dispute Arbitration", iconName: "scale" },
  { key: "users", label: "User Management", iconName: "users" },
  { key: "notifications", label: "System Alerts", iconName: "bell" },
  { key: "messages", label: "Support Chat", iconName: "message" },
];

const adminTabs: TabItem[] = [
  { key: "home", label: "Suite" },
  { key: "kyc", label: "KYC" },
  { key: "fraud", label: "Fraud AI" },
  { key: "disputes", label: "Disputes" },
  { key: "users", label: "Users" },
];

// ─── Shared tab-navigator plumbing ───────────────────────────────────────────

/**
 * Renders the existing custom BottomTabBar as a react-navigation tab bar.
 * Only `visibleTabs` show in the bar; the other routes stay reachable from
 * the drawer and code navigation.
 */
function makeTabBar(visibleTabs: TabItem[]) {
  return function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const activeRoute = state.routes[state.index]?.name ?? "home";
    return (
      <BottomTabBar
        tabs={visibleTabs}
        activeTab={activeRoute}
        onSelectTab={(key) => navigation.navigate(key)}
      />
    );
  };
}

// ─── Role navigators ─────────────────────────────────────────────────────────

const FreelancerTab = createBottomTabNavigator<FreelancerTabsParamList>();
const ClientTab = createBottomTabNavigator<ClientTabsParamList>();
const AdminTab = createBottomTabNavigator<AdminTabsParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function useDrawerState(drawerLinks: DrawerLink[], activeKey: string) {
  const { profile, signOutUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [navigateFn, setNavigateFn] = useState<((key: string) => void) | null>(null);

  const drawer = (
    <CustomDrawerModal
      visible={visible}
      onClose={() => setVisible(false)}
      profile={profile}
      links={drawerLinks}
      activeKey={activeKey}
      onSelectLink={(key) => {
        setVisible(false);
        navigateFn?.(key);
      }}
      onSignOut={() => void signOutUser()}
    />
  );

  return { drawer, openDrawer: () => setVisible(true), setNavigateFn };
}

function FreelancerRoot() {
  const [activeKey, setActiveKey] = useState("home");
  const { drawer, openDrawer, setNavigateFn } = useDrawerState(
    freelancerDrawerLinks,
    activeKey
  );

  return (
    <View style={{ flex: 1 }}>
      <FreelancerTab.Navigator
        tabBar={makeTabBar(freelancerTabs)}
        screenOptions={{ headerShown: false }}
        screenListeners={({ navigation, route }) => ({
          focus: () => {
            setActiveKey(route.name);
            setNavigateFn(() => (key: string) =>
              navigation.navigate(key as keyof FreelancerTabsParamList as never)
            );
          },
        })}
      >
        <FreelancerTab.Screen name="home">
          {({ navigation }) => (
            <FreelancerHomeScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="gigs">
          {({ navigation }) => (
            <FreelancerGigsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="contracts">
          {({ navigation }) => (
            <FreelancerContractsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
              onOpenContractChat={(contractId, contractTitle) =>
                navigation.navigate(
                  "messages" as never,
                  { contractId, contractTitle } as never
                )
              }
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="payments">
          {({ navigation }) => (
            <FreelancerPaymentsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="messages">
          {({ navigation, route }) => {
            const params = (route.params ?? {}) as {
              contractId?: string;
              contractTitle?: string;
            };
            return (
              <MessagesScreen
                onOpenDrawer={openDrawer}
                onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
                contractId={params.contractId}
                contractTitle={params.contractTitle}
              />
            );
          }}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="proposals">
          {({ navigation }) => (
            <FreelancerProposalsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="invoices">
          {({ navigation }) => (
            <FreelancerInvoicesScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="reviews">
          {({ navigation }) => (
            <FreelancerReviewsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="profile">
          {({ navigation }) => (
            <FreelancerProfileScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="notifications">
          {() => <NotificationsScreen onOpenDrawer={openDrawer} />}
        </FreelancerTab.Screen>
        <FreelancerTab.Screen name="kyc">
          {({ navigation }) => (
            <KycScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof FreelancerTabsParamList as never)}
            />
          )}
        </FreelancerTab.Screen>
      </FreelancerTab.Navigator>
      {drawer}
    </View>
  );
}

function ClientRoot() {
  const [activeKey, setActiveKey] = useState("home");
  const { drawer, openDrawer, setNavigateFn } = useDrawerState(clientDrawerLinks, activeKey);

  return (
    <View style={{ flex: 1 }}>
      <ClientTab.Navigator
        tabBar={makeTabBar(clientTabs)}
        screenOptions={{ headerShown: false }}
        screenListeners={({ navigation, route }) => ({
          focus: () => {
            setActiveKey(route.name);
            setNavigateFn(() => (key: string) =>
              navigation.navigate(key as keyof ClientTabsParamList as never)
            );
          },
        })}
      >
        <ClientTab.Screen name="home">
          {({ navigation }) => (
            <ClientHomeScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="browse">
          {({ navigation }) => (
            <ClientBrowseScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="contracts">
          {({ navigation }) => (
            <ClientContractsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
              onOpenContractChat={(contractId, contractTitle) =>
                navigation.navigate(
                  "messages" as never,
                  { contractId, contractTitle } as never
                )
              }
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="payments">
          {({ navigation }) => (
            <ClientPaymentsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="messages">
          {({ navigation, route }) => {
            const params = (route.params ?? {}) as {
              contractId?: string;
              contractTitle?: string;
            };
            return (
              <MessagesScreen
                onOpenDrawer={openDrawer}
                onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
                contractId={params.contractId}
                contractTitle={params.contractTitle}
              />
            );
          }}
        </ClientTab.Screen>
        <ClientTab.Screen name="proposals">
          {({ navigation }) => (
            <ClientProposalsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="reviews">
          {({ navigation }) => (
            <ClientReviewsScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="profile">
          {({ navigation }) => (
            <ClientProfileScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
        <ClientTab.Screen name="notifications">
          {() => <NotificationsScreen onOpenDrawer={openDrawer} />}
        </ClientTab.Screen>
        <ClientTab.Screen name="kyc">
          {({ navigation }) => (
            <KycScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof ClientTabsParamList as never)}
            />
          )}
        </ClientTab.Screen>
      </ClientTab.Navigator>
      {drawer}
    </View>
  );
}

function AdminRoot() {
  const [activeKey, setActiveKey] = useState("home");
  const { drawer, openDrawer, setNavigateFn } = useDrawerState(adminDrawerLinks, activeKey);

  return (
    <View style={{ flex: 1 }}>
      <AdminTab.Navigator
        tabBar={makeTabBar(adminTabs)}
        screenOptions={{ headerShown: false }}
        screenListeners={({ navigation, route }) => ({
          focus: () => {
            setActiveKey(route.name);
            setNavigateFn(() => (key: string) =>
              navigation.navigate(key as keyof AdminTabsParamList as never)
            );
          },
        })}
      >
        <AdminTab.Screen name="home">
          {({ navigation }) => (
            <AdminHomeScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof AdminTabsParamList as never)}
            />
          )}
        </AdminTab.Screen>
        <AdminTab.Screen name="kyc">
          {({ navigation }) => (
            <AdminKycScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof AdminTabsParamList as never)}
            />
          )}
        </AdminTab.Screen>
        <AdminTab.Screen name="fraud">
          {({ navigation }) => (
            <AdminFraudScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof AdminTabsParamList as never)}
            />
          )}
        </AdminTab.Screen>
        <AdminTab.Screen name="disputes">
          {({ navigation }) => (
            <AdminDisputesScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof AdminTabsParamList as never)}
            />
          )}
        </AdminTab.Screen>
        <AdminTab.Screen name="users">
          {({ navigation }) => (
            <AdminUsersScreen
              onOpenDrawer={openDrawer}
              onNavigateTab={(k) => navigation.navigate(k as keyof AdminTabsParamList as never)}
            />
          )}
        </AdminTab.Screen>
        <AdminTab.Screen name="notifications">
          {() => <NotificationsScreen onOpenDrawer={openDrawer} />}
        </AdminTab.Screen>
        <AdminTab.Screen name="messages">
          {({ navigation, route }) => {
            const params = (route.params ?? {}) as {
              contractId?: string;
              contractTitle?: string;
            };
            return (
              <MessagesScreen
                onOpenDrawer={openDrawer}
                onNavigateTab={(k) => navigation.navigate(k as keyof AdminTabsParamList as never)}
                contractId={params.contractId}
                contractTitle={params.contractTitle}
              />
            );
          }}
        </AdminTab.Screen>
      </AdminTab.Navigator>
      {drawer}
    </View>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

const RootNavigator: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { colors, theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#10b581" />
        <Text style={[styles.loadingTxt, { color: colors.accentEmerald }]}>
          Loading ChainWork...
        </Text>
      </View>
    );
  }

  const signedIn = Boolean(user && profile);
  const role = profile?.role ?? "freelancer";

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!signedIn ? (
        <>
          <RootStack.Screen name="Welcome">
            {({ navigation }) => (
              <WelcomeScreen
                onGetStarted={() => navigation.navigate("Register")}
                onLogin={() => navigation.navigate("Login")}
                onQuickDemo={() => navigation.navigate("Login")}
              />
            )}
          </RootStack.Screen>
          <RootStack.Screen name="Login">
            {({ navigation }) => (
              <LoginScreen
                onNavigateRegister={() => navigation.navigate("Register")}
                onNavigateWelcome={() => navigation.navigate("Welcome")}
                onNavigateForgotPassword={() => navigation.navigate("ForgotPassword")}
              />
            )}
          </RootStack.Screen>
          <RootStack.Screen name="Register">
            {({ navigation }) => (
              <RegisterScreen onNavigateLogin={() => navigation.navigate("Login")} />
            )}
          </RootStack.Screen>
          <RootStack.Screen name="ForgotPassword">
            {({ navigation }) => (
              <ForgotPasswordScreen onNavigateLogin={() => navigation.navigate("Login")} />
            )}
          </RootStack.Screen>
        </>
      ) : role === "client" ? (
        <RootStack.Screen name="ClientTabs" component={ClientRoot} />
      ) : role === "admin" ? (
        <RootStack.Screen name="AdminTabs" component={AdminRoot} />
      ) : (
        <RootStack.Screen name="FreelancerTabs" component={FreelancerRoot} />
      )}
    </RootStack.Navigator>
  );
};

const AppShell: React.FC = () => {
  const { colors, theme } = useTheme();

  const navTheme = theme === "dark"
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

  return (
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
  },
});
