import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { FREELANCER_FEE_PERCENTAGE } from "@chainwork/shared";
import {
  listFreelancerContracts,
  listMilestones,
  listFreelancerProposals,
  type FirestoreContract,
  type FirestoreProposalFull,
} from "../../config/firebaseServices";

interface FreelancerHomeScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab: (tabKey: string) => void;
}

export const FreelancerHomeScreen: React.FC<FreelancerHomeScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { profile } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [activeContracts, setActiveContracts] = useState(0);
  const [pendingProposals, setPendingProposals] = useState(0);
  const [recentContracts, setRecentContracts] = useState<FirestoreContract[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;
    setLoading(true);
    Promise.all([
      listFreelancerContracts(profile.uid),
      listFreelancerProposals(profile.uid),
    ]).then(async ([contracts, proposals]) => {
      const milestonesPerContract = await Promise.all(
        contracts.map((c) => listMilestones(c.id))
      );
      const earnings = milestonesPerContract
        .flat()
        .filter((m) => m.status === "completed")
        .reduce((acc, m) => acc + (m.amount ?? 0), 0);
      setTotalEarnings(earnings);
      setActiveContracts(contracts.filter((c) => c.status === "active").length);
      setPendingProposals(proposals.filter((p) => p.status === "pending").length);
      setRecentContracts(contracts.slice(0, 3));
    }).finally(() => setLoading(false));
  }, [profile?.uid]);

  const userInitials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "FL";

  const stats = [
    { label: "TOTAL EARNINGS", value: `$${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, subtitle: "Gross Escrow", color: colors.accentEmerald },
    { label: "ACTIVE CONTRACTS", value: `${activeContracts} Active`, subtitle: "Milestones Pending", color: colors.accentAzure },
    { label: "PENDING PROPOSALS", value: `${pendingProposals} Pitches`, subtitle: "Client Review", color: colors.accentPurple },
    { label: "PROFILE VIEWS", value: "—", subtitle: "Marketplace Views", color: colors.textPrimary },
  ];

  const shortcuts = [
    { key: "gigs", label: "My Gigs", icon: "💼" },
    { key: "contracts", label: "Contracts", icon: "📜" },
    { key: "proposals", label: "Proposals", icon: "📝" },
    { key: "messages", label: "Messages", icon: "💬" },
    { key: "payments", label: "Earnings", icon: "💸" },
    { key: "profile", label: "My Profile", icon: "👤" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Notification Bell */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity style={styles.menuBtn} onPress={onOpenDrawer} activeOpacity={0.7}>
          <Text style={styles.menuTxt}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Freelancer Suite</Text>
          <Text style={styles.headerSubtitle}>Verified Escrow Protocol</Text>
        </View>

        {/* Notification Bell Button */}
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => onNavigateTab("notifications")}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>🔔</Text>
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeTxt}>3</Text>
          </View>
        </TouchableOpacity>

        {/* Theme Toggle Button */}
        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Hero Banner */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
          <View style={styles.heroRow}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.heroAvatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{userInitials}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeTxt}>✨ VERIFIED FREELANCER</Text>
              </View>
              <Text style={[styles.heroGreeting, { color: colors.textPrimary }]}>
                Welcome back, {profile?.name || "Freelancer"}!
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                {(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% Platform Fee • 5.0 ★ Rating
              </Text>
            </View>
          </View>

          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => onNavigateTab("gigs")}
              activeOpacity={0.8}
            >
              <Text style={styles.heroPrimaryBtnTxt}>+ Create Gig</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => onNavigateTab("contracts")}
              activeOpacity={0.8}
            >
              <Text style={styles.heroSecondaryBtnTxt}>Active Contracts</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 4 Performance Stat Cards */}
        <View style={styles.statsGrid}>
          {stats.map((st) => (
            <GlassCard key={st.label} style={styles.statCard}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>{st.label}</Text>
              <Text style={[styles.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: "800", marginTop: 2 }}>{st.subtitle}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Quick Work Shortcuts Grid */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>QUICK WORK SHORTCUTS</Text>
        <View style={styles.shortcutsGrid}>
          {shortcuts.map((sc) => (
            <TouchableOpacity
              key={sc.key}
              style={[styles.shortcutItem, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => onNavigateTab(sc.key)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 22 }}>{sc.icon}</Text>
              <Text style={[styles.shortcutTxt, { color: colors.textPrimary }]}>{sc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity Split View */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted, marginTop: 14 }]}>RECENT ACTIVITY</Text>

        <GlassCard style={{ padding: 14, marginBottom: 20 }}>
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>📜 Recent Contracts</Text>
            <TouchableOpacity onPress={() => onNavigateTab("contracts")}>
              <Text style={{ color: colors.accentEmerald, fontSize: 11, fontWeight: "900" }}>View All ➔</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.accentEmerald} style={{ marginVertical: 10 }} />
          ) : recentContracts.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 10 }}>No contracts yet</Text>
          ) : (
            recentContracts.map((c) => (
              <View key={c.id} style={styles.actRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actName, { color: colors.textPrimary }]}>{c.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>Client: {c.clientName}</Text>
                </View>
                <Text style={[styles.actVal, { color: colors.accentEmerald }]}>${c.totalAmount?.toLocaleString()}</Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 36) + 16 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTxt: { color: "#34d399", fontSize: 20, fontWeight: "bold" },
  headerTitle: { fontSize: 16, fontWeight: "900" },
  headerSubtitle: { color: "#10b581", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeTxt: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 90 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#10b581",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10b581",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  verifiedBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  verifiedBadgeTxt: { color: "#10b581", fontSize: 9, fontWeight: "900" },
  heroGreeting: { fontSize: 16, fontWeight: "900" },
  heroBtnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  heroPrimaryBtn: {
    backgroundColor: "#10b581",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroPrimaryBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  heroSecondaryBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  heroSecondaryBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { width: "48%", padding: 12 },
  statValue: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  shortcutsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  shortcutItem: {
    width: "31%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  shortcutTxt: { fontSize: 11, fontWeight: "800", marginTop: 6 },
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  activityTitle: { fontSize: 14, fontWeight: "900" },
  actRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 6, paddingBottom: 6 },
  actName: { fontSize: 12, fontWeight: "800" },
  actVal: { fontSize: 13, fontWeight: "900" },
});
