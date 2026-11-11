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
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";
import { ProposalDetailModal, ProposalItem } from "../../components/modals/ProposalDetailModal";

interface FreelancerProposalsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const FreelancerProposalsScreen: React.FC<FreelancerProposalsScreenProps> = ({
  onOpenDrawer,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "active" | "withdrawn">("all");
  const [search, setSearch] = useState("");

  const [proposals, setProposals] = useState<ProposalItem[]>([
    {
      id: "PROP-101",
      jobTitle: "AI Fraud Detection Risk Scoring Engine",
      client: "SecureChain Inc",
      bidAmount: "$3,200.00",
      timeline: "10 Days",
      submittedDate: "Aug 04, 2026",
      status: "pending",
      coverLetter:
        "I have extensive experience building machine learning models for real-time risk evaluation, multi-signal anomaly detection, and fraud prevention pipelines...",
      milestones: [
        { description: "Phase 1: 8 Security Signals Data Pipeline", amount: "$1,600.00", days: 5 },
        { description: "Phase 2: Real-time Scoring API Integration", amount: "$1,600.00", days: 5 },
      ],
    },
    {
      id: "PROP-102",
      jobTitle: "Solidity Staking Contract & Audit",
      client: "TechCorp Labs",
      bidAmount: "$2,500.00",
      timeline: "7 Days",
      submittedDate: "Jul 30, 2026",
      status: "active",
      coverLetter:
        "Full OpenZeppelin security vault pattern implementation with comprehensive Hardhat unit test coverage and automated deployment scripts...",
    },
    {
      id: "PROP-103",
      jobTitle: "Cross-Chain Token Bridge UI",
      client: "Apex Financial",
      bidAmount: "$1,800.00",
      timeline: "5 Days",
      submittedDate: "Jul 25, 2026",
      status: "active",
      coverLetter:
        "React Native mobile wallet connector integration using Ethers.js and WalletConnect V2 for seamless cross-chain token bridging...",
    },
  ]);

  const filteredProposals = proposals.filter((p) => {
    const matchesTab = selectedTab === "all" || p.status === selectedTab;
    const matchesSearch =
      p.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleOpenDetail = (prop: ProposalItem) => {
    setSelectedProposal(prop);
    setModalVisible(true);
  };

  const handleWithdrawProposal = (proposalId: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId ? { ...p, status: "withdrawn" } : p
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Submitted Proposals</Text>
          <Text style={styles.headerSubtitle}>Pitches & Bids Manager</Text>
        </View>
        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <GlassCard style={{ padding: 12, marginBottom: 12 }}>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Search proposals by title or client..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </GlassCard>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(["all", "pending", "active", "withdrawn"] as const).map((tb) => (
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
          SUBMITTED PITCHES ({filteredProposals.length})
        </Text>

        {filteredProposals.map((prop) => (
          <GlassCard key={prop.id} style={{ marginBottom: 14, padding: 16 }}>
            <View style={styles.propHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>{prop.id} • {prop.submittedDate}</Text>
                <Text style={[styles.propTitle, { color: colors.textPrimary }]}>{prop.jobTitle}</Text>
                <Text style={[styles.propClient, { color: colors.textMuted }]}>Client: {prop.client}</Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge
                  status={prop.status === "active" ? "active" : prop.status === "withdrawn" ? "danger" : "pending"}
                  text={prop.status.toUpperCase()}
                />
                <Text style={[styles.propBid, { color: colors.accentEmerald }]}>{prop.bidAmount}</Text>
              </View>
            </View>

            <View style={styles.coverBox}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900", marginBottom: 2 }}>COVER LETTER SNIPPET:</Text>
              <Text style={[styles.coverTxt, { color: colors.textSecondary }]} numberOfLines={2}>
                {prop.coverLetter}
              </Text>
            </View>

            <View style={styles.propFooter}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600" }}>Timeline: {prop.timeline}</Text>
              <TouchableOpacity onPress={() => handleOpenDetail(prop)} activeOpacity={0.7}>
                <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "800" }}>
                  Inspect Full Pitch ➔
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Proposal Detail & Withdrawal Modal */}
      <ProposalDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        proposal={selectedProposal}
        onWithdrawProposal={handleWithdrawProposal}
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
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
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
  propHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  propTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  propClient: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  propBid: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  coverBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  coverTxt: { fontSize: 11, lineHeight: 16 },
  propFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 10,
  },
});
