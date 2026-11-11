import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import {
  FREELANCER_FEE_PERCENTAGE,
  CLIENT_FEE_PERCENTAGE,
  PLATFORM_FEE_PERCENTAGE,
  calculateTransactionFee,
} from "@chainwork/shared";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";
import { WithdrawModal } from "../../components/modals/WithdrawModal";

interface FreelancerPaymentsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const FreelancerPaymentsScreen: React.FC<FreelancerPaymentsScreenProps> = ({
  onOpenDrawer,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  // Real fee rates from @chainwork/shared
  const feeBreakdownEx = calculateTransactionFee(1000);

  // Financial Stats
  const stats = {
    totalEarnings: "$12,450.00",
    availableBalance: "$4,300.00",
    pendingEarnings: "$1,850.00",
    platformFeeRate: `${(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%`,
    clientFeeRate: `${(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}%`,
    exampleEarnings: `$${feeBreakdownEx.freelancerEarnings.toFixed(2)} per $1,000`,
  };

  // Payment Destinations State
  const [walletAddress, setWalletAddress] = useState("0x71C...39A2");
  const [ibanAccount, setIbanAccount] = useState("GB82 WEST 1234 5678 9012 34");
  const [stripeConnected, setStripeConnected] = useState(true);

  // Payout History Logs
  const payouts = [
    { id: "PO-STRIPE-991", amount: "$1,250.00", method: "Stripe Express Payout", date: "Aug 02, 2026", status: "cleared" },
    { id: "PO-STRIPE-990", amount: "$900.00", method: "Web3 USDT Wallet", date: "Jul 28, 2026", status: "cleared" },
    { id: "PO-STRIPE-989", amount: "$1,850.00", method: "Bank IBAN Transfer", date: "Jul 20, 2026", status: "pending_clearance" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Earnings & Payouts</Text>
          <Text style={styles.headerSubtitle}>Escrow Funds & Balance Management</Text>
        </View>
        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 4 Financial Stat Cards */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>TOTAL EARNINGS</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalEarnings}</Text>
            <Text style={{ color: "#10b581", fontSize: 9, fontWeight: "800", marginTop: 2 }}>Gross Completed</Text>
          </GlassCard>

          <GlassCard variant="emerald" style={styles.statCard}>
            <Text style={{ color: colors.accentEmerald, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>AVAILABLE BALANCE</Text>
            <Text style={[styles.statValue, { color: colors.accentEmerald }]}>{stats.availableBalance}</Text>
            <TouchableOpacity
              style={styles.cashoutBtn}
              onPress={() => setWithdrawModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.cashoutBtnTxt}>Withdraw ➔</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>PENDING CLEARANCE</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pendingEarnings}</Text>
            <Text style={{ color: "#38bdf8", fontSize: 9, fontWeight: "800", marginTop: 2 }}>72-Hour Review</Text>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>PLATFORM FEE</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.platformFeeRate}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 9, fontWeight: "800", marginTop: 2 }}>of gross amount</Text>
          </GlassCard>
        </View>

        {/* Platform Fee Transparency */}
        <GlassCard style={{ marginBottom: 14, padding: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 8 }}>
            FEE BREAKDOWN (per $1,000 contract)
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "800" }}>CLIENT PAYS</Text>
              <Text style={{ color: "#60a5fa", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                ${feeBreakdownEx.clientTotal.toFixed(0)}
              </Text>
              <Text style={{ color: "#60a5fa", fontSize: 9, fontWeight: "700" }}>
                +{(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}% fee
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "800" }}>PLATFORM TAKES</Text>
              <Text style={{ color: "#f97316", fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                ${feeBreakdownEx.platformFee.toFixed(0)}
              </Text>
              <Text style={{ color: "#f97316", fontSize: 9, fontWeight: "700" }}>combined fees</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "800" }}>YOU EARN</Text>
              <Text style={{ color: colors.accentEmerald, fontSize: 14, fontWeight: "900", marginTop: 2 }}>
                ${feeBreakdownEx.freelancerEarnings.toFixed(0)}
              </Text>
              <Text style={{ color: colors.accentEmerald, fontSize: 9, fontWeight: "700" }}>
                after {(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% fee
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* 3-Day Clearance Policy Banner */}
        <GlassCard variant="azure" style={{ marginBottom: 14, padding: 14 }}>
          <Text style={{ color: "#38bdf8", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>🛡️ 3-DAY ESCROW CLEARANCE POLICY</Text>
          <Text style={[styles.policyTxt, { color: colors.textSecondary }]}>
            Delivered milestone payouts undergo a 72-hour review window. If no revisions or disputes are initiated by the client within 3 days, escrow funds auto-clear directly to your Available Balance.
          </Text>
        </GlassCard>

        {/* Payout Destinations Configuration */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PAYOUT DESTINATIONS CONFIGURATION</Text>

        <GlassCard style={{ padding: 16, marginBottom: 14 }}>
          {/* Stripe Express Onboarding */}
          <View style={styles.destinationRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.destName, { color: colors.textPrimary }]}>Stripe Connect Express</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600" }}>Instant Direct Debit Card & Bank Transfer</Text>
            </View>
            <StatusBadge status={stripeConnected ? "active" : "pending"} text={stripeConnected ? "VERIFIED" : "SETUP"} />
          </View>

          {/* Web3 Wallet Address */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Web3 Wallet Payout Address (ETH/USDT/SOL)</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            value={walletAddress}
            onChangeText={setWalletAddress}
          />

          {/* Bank IBAN Details */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bank Account IBAN / Direct Transfer</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            value={ibanAccount}
            onChangeText={setIbanAccount}
          />
        </GlassCard>

        {/* Payout History Ledger */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PAYOUT HISTORY LOG</Text>
        {payouts.map((po) => (
          <GlassCard key={po.id} style={{ marginBottom: 10, padding: 14 }}>
            <View style={styles.poRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{po.id}</Text>
                <Text style={[styles.poMethod, { color: colors.textPrimary }]}>{po.method}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>{po.date}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.poAmount, { color: colors.accentEmerald }]}>{po.amount}</Text>
                <StatusBadge status={po.status === "cleared" ? "active" : "pending"} text={po.status.toUpperCase()} />
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Withdraw Funds Modal */}
      <WithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        availableBalance={stats.availableBalance}
        onConfirmWithdraw={(amt, dest) => {
          Alert.alert("Withdrawal Triggered 💸", `Payout request for ${amt} to ${dest} is processing.`);
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
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 90 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: "48%",
    padding: 12,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  cashoutBtn: {
    backgroundColor: "#10b581",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  cashoutBtnTxt: { color: "#ffffff", fontSize: 10, fontWeight: "900" },
  policyTxt: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  destinationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  destName: { fontSize: 14, fontWeight: "900" },
  inputLabel: { fontSize: 11, fontWeight: "800", marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  poRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  poMethod: { fontSize: 13, fontWeight: "800" },
  poAmount: { fontSize: 15, fontWeight: "900", marginBottom: 2 },
});
