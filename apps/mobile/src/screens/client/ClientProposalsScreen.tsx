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
import { ClientHireModal, ClientProposalApplicant } from "../../components/modals/ClientHireModal";

interface ClientProposalsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const ClientProposalsScreen: React.FC<ClientProposalsScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedProposal, setSelectedProposal] = useState<ClientProposalApplicant | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [search, setSearch] = useState("");

  const [proposals, setProposals] = useState<ClientProposalApplicant[]>([
    {
      id: "PROP-101",
      freelancerName: "Marcus Vance",
      freelancerRating: "4.9 ★",
      jobTitle: "AI Fraud Detection Risk Scoring Engine",
      bidAmount: "$3,200.00",
      timeline: "10 Days",
      submittedDate: "Aug 04, 2026",
      status: "pending",
      coverLetter:
        "Senior AI/ML engineer with 6+ years building real-time anomaly detection pipelines and risk evaluation models...",
      milestones: [
        { description: "Phase 1: 8 Security Signals Data Pipeline", amount: "$1,600.00", days: 5 },
        { description: "Phase 2: Real-time Scoring API Integration", amount: "$1,600.00", days: 5 },
      ],
    },
    {
      id: "PROP-102",
      freelancerName: "Elena Rostova",
      freelancerRating: "5.0 ★",
      jobTitle: "Solidity Staking Contract Audit",
      bidAmount: "$2,500.00",
      timeline: "7 Days",
      submittedDate: "Jul 30, 2026",
      status: "accepted",
      coverLetter:
        "Full OpenZeppelin security vault pattern implementation with comprehensive Hardhat unit test coverage...",
    },
  ]);

  const filteredProposals = proposals.filter((p) => {
    const matchesTab = selectedTab === "all" || p.status === selectedTab;
    const matchesSearch =
      p.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.freelancerName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleOpenHireModal = (prop: ClientProposalApplicant) => {
    setSelectedProposal(prop);
    setModalVisible(true);
  };

  const handleAcceptHire = (proposalId: string, freelancerName: string, amount: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId ? { ...p, status: "accepted" } : p
      )
    );
  };

  const handleDeclineProposal = (proposalId: string) => {
    setProposals(
      proposals.map((p) =>
        p.id === proposalId ? { ...p, status: "rejected" } : p
      )
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Applicant Proposals</Text>
          <Text style={styles.headerSubtitle}>Review Pitches & Hire Talent</Text>
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
        {/* Search Bar */}
        <GlassCard style={{ padding: 12, marginBottom: 12 }}>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Search proposals by title or freelancer..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </GlassCard>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(["all", "pending", "accepted", "rejected"] as const).map((tb) => (
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
                {tb === "pending" ? "NEEDS REVIEW" : tb.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          RECEIVED PROPOSALS ({filteredProposals.length})
        </Text>

        {filteredProposals.map((prop) => (
          <GlassCard key={prop.id} style={{ marginBottom: 14, padding: 16 }}>
            <View style={styles.propHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{prop.id} • {prop.submittedDate}</Text>
                <Text style={[styles.propTitle, { color: colors.textPrimary }]}>{prop.jobTitle}</Text>
                <Text style={[styles.propFreelancer, { color: colors.textMuted }]}>
                  Freelancer: {prop.freelancerName} • {prop.freelancerRating}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge
                  status={prop.status === "accepted" ? "active" : prop.status === "rejected" ? "danger" : "pending"}
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
              <TouchableOpacity onPress={() => handleOpenHireModal(prop)} activeOpacity={0.8}>
                <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "900" }}>
                  Review Pitch & Hire ➔
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Client Hire & Proposal Detail Modal */}
      <ClientHireModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        proposal={selectedProposal}
        onAcceptHire={handleAcceptHire}
        onDeclineProposal={handleDeclineProposal}
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
  searchInput: { borderWidth: 1, borderRadius: 12, height: 44, paddingHorizontal: 12, fontSize: 13, fontWeight: "600" },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tabPill: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabPillTxt: { fontSize: 9, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 12 },
  propHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  propTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  propFreelancer: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  propBid: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  coverBox: { backgroundColor: "rgba(255, 255, 255, 0.04)", borderRadius: 10, padding: 10, marginBottom: 10 },
  coverTxt: { fontSize: 11, lineHeight: 16 },
  propFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.06)", paddingTop: 10 },
});
