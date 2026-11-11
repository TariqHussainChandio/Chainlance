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
import { ContractDetailModal, ContractData } from "../../components/modals/ContractDetailModal";

interface FreelancerContractsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
  onOpenContractChat?: (contractId: string, contractTitle: string) => void;
}

export const FreelancerContractsScreen: React.FC<FreelancerContractsScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
  onOpenContractChat,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "active" | "delivered" | "completed">("all");

  const [contracts, setContracts] = useState<ContractData[]>([
    {
      id: "CTR-881",
      title: "Full-Stack Smart Contract DApp",
      clientName: "Acme Crypto Ltd",
      totalAmount: "$2,500.00",
      status: "active",
      createdAt: "Aug 01, 2026",
      milestones: [
        { id: "MS-1", description: "Smart Contract Audit & Deployment", amount: "$1,250.00", deadlineDays: 5, status: "in_progress" },
        { id: "MS-2", description: "React Native DApp Integration", amount: "$1,250.00", deadlineDays: 7, status: "pending" },
      ],
    },
    {
      id: "CTR-882",
      title: "Cross-Chain Token Bridge UI",
      clientName: "Apex Financial",
      totalAmount: "$1,800.00",
      status: "delivered",
      createdAt: "Jul 26, 2026",
      milestones: [
        { id: "MS-1", description: "Bridge Protocol Smart Contracts", amount: "$900.00", deadlineDays: 4, status: "completed" },
        { id: "MS-2", description: "Mobile Wallet Connector", amount: "$900.00", deadlineDays: 3, status: "delivered" },
      ],
    },
  ]);

  const filteredContracts = contracts.filter((c) => selectedTab === "all" || c.status === selectedTab);

  const handleOpenDetail = (ctr: ContractData) => {
    setSelectedContract(ctr);
    setModalVisible(true);
  };

  const handleSubmitDeliverable = (contractId: string, milestoneId: string, url: string, note: string) => {
    setContracts(
      contracts.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: "delivered",
              milestones: c.milestones.map((m) =>
                m.id === milestoneId ? { ...m, status: "delivered", deliverableUrl: url, deliverableNote: note } : m
              ),
            }
          : c
      )
    );
  };

  const handleDisputeTrigger = (contractId: string, reason: string) => {
    setContracts(
      contracts.map((c) =>
        c.id === contractId ? { ...c, status: "disputed" } : c
      )
    );
  };

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Active Contracts</Text>
          <Text style={styles.headerSubtitle}>Milestone Escrows & Deliverables</Text>
        </View>
        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(["all", "active", "delivered", "completed"] as const).map((tb) => (
            <TouchableOpacity
              key={tb}
              style={[
                styles.tabPill,
                { borderColor: colors.cardBorder },
                selectedTab === tb && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
              ]}
              onPress={() => setSelectedTab(tb)}
            >
              <Text
                style={[
                  styles.tabPillTxt,
                  { color: selectedTab === tb ? "#ffffff" : colors.textMuted },
                ]}
              >
                {tb.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          ESCROW CONTRACTS ({filteredContracts.length})
        </Text>

        {filteredContracts.map((ctr) => {
          const completedMs = ctr.milestones.filter((m) => m.status === "completed").length;
          const totalMs = ctr.milestones.length;

          return (
            <GlassCard key={ctr.id} style={{ marginBottom: 14, padding: 16 }}>
              <View style={styles.ctrHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctrId}>{ctr.id} • {ctr.createdAt}</Text>
                  <Text style={[styles.ctrTitle, { color: colors.textPrimary }]}>{ctr.title}</Text>
                  <Text style={[styles.ctrClient, { color: colors.textMuted }]}>Client: {ctr.clientName}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <StatusBadge
                    status={ctr.status === "completed" ? "active" : ctr.status === "delivered" ? "pending" : "active"}
                    text={ctr.status.toUpperCase()}
                  />
                  <Text style={[styles.ctrVal, { color: colors.accentEmerald }]}>{ctr.totalAmount}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "800" }}>
                  MILESTONES: {completedMs} / {totalMs} COMPLETED
                </Text>
                <View style={styles.trackBar}>
                  <View style={[styles.fillBar, { width: `${(completedMs / totalMs) * 100}%` }]} />
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => handleOpenDetail(ctr)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailBtnTxt}>Contract Details & Milestones ➔</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          );
        })}
      </ScrollView>

      {/* Contract Detail & Milestone Submission Modal */}
      <ContractDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        contract={selectedContract}
        onSubmitDeliverable={handleSubmitDeliverable}
        onDisputeTrigger={handleDisputeTrigger}
        onOpenChat={onOpenContractChat ? (cid, ctitle) => {
          setModalVisible(false);
          onOpenContractChat(cid, ctitle);
        } : undefined}
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
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 12 },
  ctrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  ctrId: { color: "#10b581", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  ctrTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  ctrClient: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  ctrVal: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  progressRow: { marginVertical: 8 },
  trackBar: { height: 6, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  fillBar: { height: "100%", backgroundColor: "#10b581" },
  actionRow: { marginTop: 8 },
  detailBtn: {
    backgroundColor: "#10b581",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  detailBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
});
