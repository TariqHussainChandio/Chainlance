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
import { ClientDepositModal } from "../../components/modals/ClientDepositModal";
import {
  listClientContracts,
  listClientProposals,
  type FirestoreContract,
  type FirestoreProposalFull,
} from "../../config/firebaseServices";

interface ClientHomeScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab: (tabKey: string) => void;
}

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { profile } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeContractsList, setActiveContractsList] = useState<FirestoreContract[]>([]);
  const [pendingProposalsList, setPendingProposalsList] = useState<FirestoreProposalFull[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;
    setLoading(true);
    Promise.all([
      listClientContracts(profile.uid),
      listClientProposals(profile.uid),
    ]).then(([contracts, proposals]) => {
      const spent = contracts
        .filter((c) => c.status === "completed")
        .reduce((acc, c) => acc + (c.totalAmount ?? 0), 0);
      setTotalSpent(spent);
      setActiveContractsList(contracts.filter((c) => c.status === "active").slice(0, 3));
      setPendingProposalsList(proposals.filter((p) => p.status === "pending").slice(0, 3));
    }).finally(() => setLoading(false));
  }, [profile?.uid]);

  const userInitials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "CL";

  const hiredFreelancers = new Set(activeContractsList.map((c) => c.freelancerId)).size;

  const stats = [
    { label: "ACTIVE CONTRACTS", value: `${activeContractsList.length} Active`, subtitle: "Milestones Pending", color: colors.accentEmerald },
    { label: "TOTAL SPENT", value: `$${totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, subtitle: "Escrow Disbursed", color: colors.accentAzure },
    { label: "HIRED FREELANCERS", value: `${hiredFreelancers} Talent`, subtitle: "Verified Experts", color: colors.accentPurple },
    { label: "OPEN PROPOSALS", value: `${pendingProposalsList.length} Pitches`, subtitle: "Awaiting Review", color: colors.textPrimary },
  ];

  const shortcuts = [
    { key: "browse", label: "Hire Talent", icon: "🔍" },
    { key: "contracts", label: "Contracts", icon: "📜" },
    { key: "proposals", label: "Proposals", icon: "📝" },
    { key: "messages", label: "Messages", icon: "💬" },
    { key: "payments", label: "Payments", icon: "💸" },
    { key: "profile", label: "Company", icon: "👤" },
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Client Portal</Text>
          <Text style={styles.headerSubtitle}>Escrow Talent Suite</Text>
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

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Welcome Hero Banner */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
          <View style={styles.heroRow}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{userInitials}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeTxt}>✨ VERIFIED CLIENT PORTAL</Text>
              </View>
              <Text style={[styles.heroGreeting, { color: colors.textPrimary }]}>
                Welcome, {profile?.name || "Client"}!
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                256-Bit Escrow Security • Top 1% Verified Talent
              </Text>
            </View>
          </View>

          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => onNavigateTab("browse")}
              activeOpacity={0.8}
            >
              <Text style={styles.heroPrimaryBtnTxt}>Browse & Hire Talent ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => setDepositModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.heroSecondaryBtnTxt}>+ Add Escrow Funds</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Stripe Payment Account Status Banner */}
        <GlassCard variant="azure" style={{ marginBottom: 14, padding: 14 }}>
          <View style={styles.statusBannerRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#38bdf8", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>STRIPE CONNECT PAYMENT METHOD</Text>
              <Text style={[styles.statusBannerTitle, { color: colors.textPrimary }]}>Verified & Ready 💳</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                Escrow deposits authorized securely with 256-bit encryption.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* 4 Performance Metric Tiles */}
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
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>QUICK CLIENT SHORTCUTS</Text>
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
        <Text style={[styles.sectionHeader, { color: colors.textMuted, marginTop: 14 }]}>RECENT CLIENT ACTIVITY</Text>

        {/* Active Contracts Card */}
        <GlassCard style={{ padding: 14, marginBottom: 12 }}>
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>📜 Active Contracts</Text>
            <TouchableOpacity onPress={() => onNavigateTab("contracts")}>
              <Text style={{ color: colors.accentEmerald, fontSize: 11, fontWeight: "900" }}>Manage All ➔</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.accentEmerald} style={{ marginVertical: 10 }} />
          ) : activeContractsList.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 10 }}>No active contracts</Text>
          ) : (
            activeContractsList.map((c) => (
              <View key={c.id} style={styles.actRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actName, { color: colors.textPrimary }]}>{c.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>Freelancer: {c.freelancerName}</Text>
                </View>
                <Text style={[styles.actVal, { color: colors.accentEmerald }]}>${c.totalAmount?.toLocaleString()}</Text>
              </View>
            ))
          )}
        </GlassCard>

        {/* Pending Proposals Card */}
        <GlassCard style={{ padding: 14, marginBottom: 20 }}>
          <View style={styles.activityHeader}>
            <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>📝 Applicant Proposals</Text>
            <TouchableOpacity onPress={() => onNavigateTab("proposals")}>
              <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "900" }}>Review All ➔</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.accentAzure} style={{ marginVertical: 10 }} />
          ) : pendingProposalsList.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center", paddingVertical: 10 }}>No pending proposals</Text>
          ) : (
            pendingProposalsList.map((p) => (
              <View key={p.id} style={styles.actRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actName, { color: colors.textPrimary }]}>{p.gigTitle}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>Applicant: {p.freelancerName}</Text>
                </View>
                <Text style={[styles.actVal, { color: colors.accentAzure }]}>${p.bidAmount?.toLocaleString()}</Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>

      {/* Escrow Funds Deposit Modal */}
      <ClientDepositModal
        visible={depositModalVisible}
        onClose={() => setDepositModalVisible(false)}
        onConfirmDeposit={(amt) => {
          // Deposit confirmed
        }}
      />
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
  avatarImg: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "#10b581" },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#10b581", justifyContent: "center", alignItems: "center" },
  avatarTxt: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  verifiedBadge: { backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginBottom: 2 },
  verifiedBadgeTxt: { color: "#10b581", fontSize: 9, fontWeight: "900" },
  heroGreeting: { fontSize: 16, fontWeight: "900" },
  heroBtnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  heroPrimaryBtn: { backgroundColor: "#10b581", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  heroPrimaryBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  heroSecondaryBtn: { backgroundColor: "rgba(255, 255, 255, 0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  heroSecondaryBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  statusBannerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBannerTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { width: "48%", padding: 12 },
  statValue: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  shortcutsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  shortcutItem: { width: "31%", paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  shortcutTxt: { fontSize: 11, fontWeight: "800", marginTop: 6 },
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  activityTitle: { fontSize: 14, fontWeight: "900" },
  actRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 6, paddingBottom: 6 },
  actName: { fontSize: 12, fontWeight: "800" },
  actVal: { fontSize: 13, fontWeight: "900" },
});
