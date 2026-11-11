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
  Modal,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";
import { CustomButton } from "../../components/CustomButton";

interface ClientContractsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
  onOpenContractChat?: (contractId: string, contractTitle: string) => void;
}

interface ClientContractItem {
  id: string;
  title: string;
  freelancerName: string;
  totalAmount: string;
  status: "active" | "delivered" | "completed" | "disputed";
  createdAt: string;
  milestoneDescription: string;
  milestoneAmount: string;
  deliverableUrl?: string;
}

export const ClientContractsScreen: React.FC<ClientContractsScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
  onOpenContractChat,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedTab, setSelectedTab] = useState<"all" | "active" | "delivered" | "completed">("all");
  const [selectedContract, setSelectedContract] = useState<ClientContractItem | null>(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);

  const [contracts, setContracts] = useState<ClientContractItem[]>([
    {
      id: "CTR-881",
      title: "Full-Stack Smart Contract DApp",
      freelancerName: "Alex Rivers",
      totalAmount: "$2,500.00",
      status: "active",
      createdAt: "Aug 01, 2026",
      milestoneDescription: "Milestone 1: Smart Contract Audit & Deployment",
      milestoneAmount: "$1,250.00",
    },
    {
      id: "CTR-882",
      title: "Cross-Chain Token Bridge UI",
      freelancerName: "Sarah Chen",
      totalAmount: "$1,800.00",
      status: "delivered",
      createdAt: "Jul 26, 2026",
      milestoneDescription: "Milestone 2: Mobile Wallet Connector",
      milestoneAmount: "$900.00",
      deliverableUrl: "https://github.com/apex/bridge-ui",
    },
  ]);

  const filteredContracts = contracts.filter((c) => selectedTab === "all" || c.status === selectedTab);

  const handleApproveEscrowRelease = (contractId: string) => {
    Alert.alert(
      "Approve & Disburse Escrow Funds?",
      "Releasing milestone payment directly to freelancer's available balance.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve & Release Funds 💸",
          onPress: () => {
            setContracts(
              contracts.map((c) =>
                c.id === contractId ? { ...c, status: "completed" } : c
              )
            );
            setApproveModalVisible(false);
            Alert.alert("Milestone Approved! 🚀", "Escrow funds released to freelancer.");
          },
        },
      ]
    );
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Client Contracts</Text>
          <Text style={styles.headerSubtitle}>Milestones & Escrow Release</Text>
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
        {/* Status Filter Tabs */}
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

        {filteredContracts.map((ctr) => (
          <GlassCard key={ctr.id} style={{ marginBottom: 14, padding: 16 }}>
            <View style={styles.ctrHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{ctr.id} • {ctr.createdAt}</Text>
                <Text style={[styles.ctrTitle, { color: colors.textPrimary }]}>{ctr.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                  Freelancer: {ctr.freelancerName}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge
                  status={ctr.status === "completed" ? "active" : ctr.status === "delivered" ? "pending" : "active"}
                  text={ctr.status.toUpperCase()}
                />
                <Text style={[styles.ctrAmount, { color: colors.accentEmerald }]}>{ctr.totalAmount}</Text>
              </View>
            </View>

            <View style={styles.msBox}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900" }}>CURRENT MILESTONE:</Text>
              <Text style={[styles.msTitle, { color: colors.textPrimary }]}>{ctr.milestoneDescription}</Text>
              <Text style={{ color: colors.accentEmerald, fontSize: 12, fontWeight: "900", marginTop: 2 }}>{ctr.milestoneAmount}</Text>
            </View>

            {ctr.status === "delivered" && (
              <TouchableOpacity
                style={styles.approvePill}
                onPress={() => {
                  setSelectedContract(ctr);
                  setApproveModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.approvePillTxt}>Review Deliverable & Release Escrow 💸</Text>
              </TouchableOpacity>
            )}

            {onOpenContractChat && (
              <TouchableOpacity
                style={styles.chatPill}
                onPress={() => onOpenContractChat(ctr.id, ctr.title)}
                activeOpacity={0.8}
              >
                <Text style={styles.chatPillTxt}>💬 Message Freelancer</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        ))}
      </ScrollView>

      {/* Deliverable Review & Escrow Release Modal */}
      <Modal visible={approveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <GlassCard variant="elevated" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>DELIVERABLE SUBMITTED</Text>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{selectedContract?.title}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setApproveModalVisible(false)}>
                  <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginVertical: 12 }}>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900" }}>DELIVERABLE REPOSITORY / IPFS URL</Text>
                <Text style={{ color: colors.accentAzure, fontSize: 13, fontWeight: "900", marginTop: 4 }}>
                  {selectedContract?.deliverableUrl || "https://github.com/org/repo"}
                </Text>

                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900", marginTop: 10 }}>RELEASE AMOUNT</Text>
                <Text style={{ color: colors.accentEmerald, fontSize: 20, fontWeight: "900", marginTop: 2 }}>
                  {selectedContract?.milestoneAmount}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <CustomButton
                  title="Approve & Disburse 💸"
                  onPress={() => handleApproveEscrowRelease(selectedContract?.id || "")}
                  style={{ flex: 2 }}
                />
                <CustomButton
                  title="Request Revision"
                  variant="outline"
                  onPress={() => {
                    setApproveModalVisible(false);
                    Alert.alert("Revision Requested", "Freelancer notified to submit updated deliverable.");
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          </SafeAreaView>
        </View>
      </Modal>
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
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tabPill: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 12 },
  ctrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  ctrTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  ctrAmount: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  msBox: { backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: 10, padding: 10, marginVertical: 8 },
  msTitle: { fontSize: 12, fontWeight: "800", marginTop: 2 },
  approvePill: { backgroundColor: "#10b581", paddingVertical: 8, borderRadius: 10, alignItems: "center", marginTop: 6 },
  approvePillTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  chatPill: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "rgba(59, 130, 246, 0.35)",
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  chatPillTxt: { color: "#60a5fa", fontSize: 12, fontWeight: "900" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)", justifyContent: "center", padding: 20 },
  modalContent: { width: "100%" },
  modalCard: { padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 17, fontWeight: "900" },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.1)", justifyContent: "center", alignItems: "center" },
  closeTxt: { fontSize: 14, fontWeight: "bold" },
});
