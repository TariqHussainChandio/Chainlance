import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";
import { ClientDepositModal } from "../../components/modals/ClientDepositModal";

interface ClientPaymentsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const ClientPaymentsScreen: React.FC<ClientPaymentsScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "payments" | "fees" | "deposits">("all");

  const stats = {
    totalSpent: "$8,450.00",
    platformFees: "20.0%",
    escrowDeposits: "$10,500.00",
  };

  const transactions = [
    { id: "TX-STRIPE-881", amount: "$1,250.00", type: "payments", method: "Escrow Disbursed (Alex Rivers)", date: "Aug 02, 2026", status: "completed" },
    { id: "TX-STRIPE-880", amount: "$500.00", type: "deposits", method: "Stripe Escrow Deposit", date: "Aug 01, 2026", status: "completed" },
    { id: "TX-STRIPE-879", amount: "$900.00", type: "payments", method: "Escrow Disbursed (Sarah Chen)", date: "Jul 28, 2026", status: "completed" },
  ];

  const filteredTransactions = transactions.filter(
    (t) => selectedFilter === "all" || t.type === selectedFilter
  );

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Payments & Escrow</Text>
          <Text style={styles.headerSubtitle}>Escrow Deposits & Transaction History</Text>
        </View>

        {/* Notification Bell Button */}
        {onNavigateTab && (
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
        )}

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 3 Financial Overview Cards */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>TOTAL SPENT</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalSpent}</Text>
            <Text style={{ color: "#10b581", fontSize: 9, fontWeight: "800", marginTop: 2 }}>Disbursed to Talent</Text>
          </GlassCard>

          <GlassCard variant="emerald" style={styles.statCard}>
            <Text style={{ color: colors.accentEmerald, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>ESCROW DEPOSITS</Text>
            <Text style={[styles.statValue, { color: colors.accentEmerald }]}>{stats.escrowDeposits}</Text>
            <TouchableOpacity
              style={styles.depositBtn}
              onPress={() => setDepositModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.depositBtnTxt}>+ Deposit Funds 💳</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>PLATFORM FEE SHARE</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.platformFees}</Text>
            <Text style={{ color: "#38bdf8", fontSize: 9, fontWeight: "800", marginTop: 2 }}>Included in Escrow</Text>
          </GlassCard>
        </View>

        {/* Transaction History Filter Tabs */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>TRANSACTION HISTORY LOG</Text>
        <View style={styles.tabRow}>
          {(["all", "payments", "deposits"] as const).map((tb) => (
            <TouchableOpacity
              key={tb}
              style={[
                styles.tabPill,
                { borderColor: colors.cardBorder },
                selectedFilter === tb && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
              ]}
              onPress={() => setSelectedFilter(tb)}
            >
              <Text
                style={[
                  styles.tabPillTxt,
                  { color: selectedFilter === tb ? "#ffffff" : colors.textMuted },
                ]}
              >
                {tb.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredTransactions.map((tx) => (
          <GlassCard key={tx.id} style={{ marginBottom: 10, padding: 14 }}>
            <View style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{tx.id}</Text>
                <Text style={[styles.txMethod, { color: colors.textPrimary }]}>{tx.method}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>{tx.date}</Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.txAmount, { color: tx.type === "deposits" ? colors.accentEmerald : colors.accentAzure }]}>
                  {tx.type === "deposits" ? `+${tx.amount}` : `-${tx.amount}`}
                </Text>
                <StatusBadge status="active" text={tx.status.toUpperCase()} />
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Escrow Deposit Modal */}
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
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statCard: { width: "48%", padding: 12 },
  statValue: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  depositBtn: { backgroundColor: "#10b581", paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, alignSelf: "flex-start", marginTop: 6 },
  depositBtnTxt: { color: "#ffffff", fontSize: 10, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tabPill: { flex: 1, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txMethod: { fontSize: 13, fontWeight: "800" },
  txAmount: { fontSize: 15, fontWeight: "900", marginBottom: 2 },
});
