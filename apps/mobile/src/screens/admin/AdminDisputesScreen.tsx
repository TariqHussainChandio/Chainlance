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
import { AdminDisputeArbitrationModal, DisputeItem } from "../../components/modals/AdminDisputeArbitrationModal";

interface AdminDisputesScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const AdminDisputesScreen: React.FC<AdminDisputesScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState<"active" | "resolved" | "all">("active");
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [disputes, setDisputes] = useState<DisputeItem[]>([
    {
      id: "DSP-301",
      contractTitle: "Cross-Chain Token Bridge UI",
      clientName: "Acme Web3 Ventures",
      freelancerName: "Sarah Chen",
      totalAmount: "$1,800.00",
      status: "active",
      openedDate: "Aug 02, 2026",
      slaDaysRemaining: 2,
      reason: "Mobile wallet connector fails to sign transactions on Android 15 testnet emulator.",
    },
    {
      id: "DSP-300",
      contractTitle: "AI Risk Engine & Fraud Scoring API",
      clientName: "Acme Web3 Ventures",
      freelancerName: "Marcus Vance",
      totalAmount: "$3,200.00",
      status: "resolved",
      openedDate: "Jul 20, 2026",
      slaDaysRemaining: 0,
      reason: "Latency SLA breached by 450ms during peak load testing.",
    },
  ]);

  const filteredDisputes = disputes.filter(
    (d) => selectedFilter === "all" || d.status === selectedFilter
  );

  const handleExportCsv = () => {
    Alert.alert("Exporting CSV Log 📥", "Downloading chainwork-disputes-2026.csv to mobile downloads.");
  };

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Dispute Resolution</Text>
          <Text style={styles.headerSubtitle}>Escrow Arbitration & SLA Tracker</Text>
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
        {/* CSV Export & Filter Bar */}
        <GlassCard style={{ padding: 12, marginBottom: 12 }}>
          <View style={styles.tabRow}>
            {(["active", "resolved", "all"] as const).map((ft) => (
              <TouchableOpacity
                key={ft}
                style={[
                  styles.tabPill,
                  { borderColor: colors.cardBorder },
                  selectedFilter === ft && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
                ]}
                onPress={() => setSelectedFilter(ft)}
              >
                <Text style={[styles.tabPillTxt, { color: selectedFilter === ft ? "#ffffff" : colors.textMuted }]}>
                  {ft.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCsv} activeOpacity={0.8}>
            <Text style={styles.exportBtnTxt}>📥 Export Disputes CSV Log</Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          ESCROW ARBITRATION QUEUE ({filteredDisputes.length})
        </Text>

        {filteredDisputes.map((dsp) => (
          <GlassCard key={dsp.id} style={{ marginBottom: 12, padding: 14 }}>
            <View style={styles.dspHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{dsp.id} • {dsp.openedDate}</Text>
                <Text style={[styles.dspTitle, { color: colors.textPrimary }]}>{dsp.contractTitle}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                  Client: {dsp.clientName} • Freelancer: {dsp.freelancerName}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={dsp.status === "resolved" ? "active" : "pending"} text={dsp.status.toUpperCase()} />
                <Text style={[styles.dspAmount, { color: colors.accentEmerald }]}>{dsp.totalAmount}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.arbitrateBtn}
              onPress={() => {
                setSelectedDispute(dsp);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.arbitrateBtnTxt}>Review Evidence & Arbitrate ⚖️</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Dispute Arbitration Drawer Modal */}
      <AdminDisputeArbitrationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dispute={selectedDispute}
        onResolveDispute={(disputeId, action) => {
          setDisputes(
            disputes.map((d) => (d.id === disputeId ? { ...d, status: "resolved" } : d))
          );
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
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  tabPill: { flex: 1, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  exportBtn: { backgroundColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 6, borderRadius: 8, alignItems: "center" },
  exportBtnTxt: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  dspHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  dspTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  dspAmount: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  arbitrateBtn: { backgroundColor: "#10b581", paddingVertical: 8, borderRadius: 10, alignItems: "center", marginTop: 6 },
  arbitrateBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
});
