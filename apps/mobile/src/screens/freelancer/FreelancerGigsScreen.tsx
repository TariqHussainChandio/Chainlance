import React, { useState, useMemo } from "react";
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
  GigStatus,
  rankGigsForUser,
  type SerializedGig,
  type SerializedUser,
} from "@chainwork/shared";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { SubmitProposalModal } from "../../components/modals/SubmitProposalModal";
import { CreateGigModal } from "../../components/modals/CreateGigModal";
import { EditGigModal, GigData } from "../../components/modals/EditGigModal";

interface FreelancerGigsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const FreelancerGigsScreen: React.FC<FreelancerGigsScreenProps> = ({ onOpenDrawer }) => {
  const { profile, user } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const [createGigVisible, setCreateGigVisible] = useState(false);
  const [editGigVisible, setEditGigVisible] = useState(false);
  const [proposalModalVisible, setProposalModalVisible] = useState(false);

  const [activeGigToEdit, setActiveGigToEdit] = useState<GigData | null>(null);
  const [activeJob, setActiveJob] = useState<{ title: string; budget: string } | null>(null);

  const categories = ["All", "Smart Contracts", "Mobile DApps", "AI Models", "Audits"];

  const [openJobs, setOpenJobs] = useState<Array<{
    id: string; title: string; client: string; budget: string;
    category: string; skills: string[]; description: string;
    proposalsCount: number; status: GigStatus;
  }>>([
    {
      id: "JOB-301",
      title: "Solidity Staking Contract & Audit",
      client: "TechCorp Labs",
      budget: "$2,500",
      category: "Smart Contracts",
      skills: ["Solidity", "Hardhat", "OpenZeppelin"],
      description: "Build an ERC20 staking vault with time-lock rewards and security test suite.",
      proposalsCount: 4,
      status: "published",
    },
    {
      id: "JOB-302",
      title: "Cross-Chain Bridge UI in React Native",
      client: "Apex Crypto",
      budget: "$1,800",
      category: "Mobile DApps",
      skills: ["React Native", "TypeScript", "Ethers.js"],
      description: "Mobile wallet integration for cross-chain token bridge with real-time status tracker.",
      proposalsCount: 6,
      status: "published",
    },
    {
      id: "JOB-303",
      title: "AI Fraud Detection Risk Scoring Engine",
      client: "SecureChain Inc",
      budget: "$3,200",
      category: "AI Models",
      skills: ["Python", "TensorFlow", "FastAPI"],
      description: "Implement 8 weighted security signals algorithm for real-time account risk scoring.",
      proposalsCount: 2,
      status: "published",
    },
  ]);

  // Build a SerializedUser from the current profile for the ranking engine
  const serializedUser = useMemo((): SerializedUser => ({
    uid: user?.uid ?? "demo",
    email: user?.email ?? "demo@chainwork.io",
    name: profile?.name ?? "Freelancer",
    role: "freelancer",
    walletAddress: profile?.walletAddress ?? null,
    kycStatus: profile?.kycStatus ?? "pending",
    fraudScore: profile?.fraudScore ?? 0,
    profileImage: profile?.profileImage ?? null,
    bio: profile?.bio ?? null,
    skills: (profile as { skills?: string[] } | null)?.skills ?? [],
    createdAt: Date.now() - 90 * 86_400_000,
    updatedAt: Date.now(),
  }), [user, profile]);

  // Convert mock job data to SerializedGig and compute real AI match scores
  const aiScores = useMemo(() => {
    const serializedGigs: SerializedGig[] = openJobs.map((j, idx) => ({
      id: j.id,
      freelancerId: `client-${idx}`,
      freelancerName: j.client,
      freelancerAvatar: null,
      freelancerRating: 4.8 - idx * 0.1,
      title: j.title,
      description: j.description,
      category: j.category,
      pricingBasic: parseFloat(j.budget.replace(/[$,]/g, "")) || 1000,
      pricingStandard: parseFloat(j.budget.replace(/[$,]/g, "")) * 1.3 || 1300,
      pricingPremium: parseFloat(j.budget.replace(/[$,]/g, "")) * 1.6 || 1600,
      deliveryDays: 14,
      status: j.status,
      skills: j.skills,
      thumbnailUrl: null,
      createdAt: Date.now() - (idx + 1) * 86_400_000,
      updatedAt: Date.now() - idx * 3_600_000,
    }));
    const ranked = rankGigsForUser(serializedUser, serializedGigs);
    const scoreMap = new Map<string, number>();
    for (const r of ranked) {
      scoreMap.set(r.gig.id, r.score);
    }
    return scoreMap;
  }, [openJobs, serializedUser]);

  const filteredJobs = openJobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === "All" || j.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const handleOpenProposal = (job: { title: string; budget: string }) => {
    setActiveJob(job);
    setProposalModalVisible(true);
  };

  const handleEditGig = (job: typeof openJobs[0]) => {
    setActiveGigToEdit({
      id: job.id,
      title: job.title,
      category: job.category,
      price: job.budget,
      status: job.status,
      description: job.description,
      skills: job.skills.join(", "),
    });
    setEditGigVisible(true);
  };

  const handleSaveGigUpdate = (updated: GigData) => {
    setOpenJobs(
      openJobs.map((j) =>
        j.id === updated.id
          ? {
              ...j,
              title: updated.title,
              category: updated.category,
              budget: updated.price,
              description: updated.description,
              skills: updated.skills.split(",").map((s) => s.trim()),
              status: updated.status,
            }
          : j
      )
    );
    Alert.alert("Gig Saved ⚡", `Updated gig "${updated.title}".`);
  };

  const handleProposalSubmitted = (proposal: {
    bidAmount: string;
    timeline: string;
    coverLetter: string;
    milestoneCount: string;
  }) => {
    Alert.alert(
      "Proposal Submitted! 🚀",
      `Your pitch of ${proposal.bidAmount} for "${activeJob?.title}" was sent to the client.`
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with generous top padding to clear camera hole */}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Gigs & Marketplace</Text>
          <Text style={styles.headerSubtitle}>Manage Services & Browse Opportunities</Text>
        </View>

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Publish Gig Header Banner */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>FREELANCER GIG SUITE</Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Publish New Service Gig</Text>
            </View>
            <TouchableOpacity
              style={styles.createGigBtn}
              onPress={() => setCreateGigVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.createGigTxt}>+ Create Gig</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Search & Filter */}
        <GlassCard style={{ padding: 14, marginBottom: 14 }}>
          <Text style={styles.searchLabel}>SEARCH JOBS & SKILLS</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Search by title, Solidity, React Native..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />

          {/* Category Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, selectedCat === cat && styles.activeCatPill]}
                  onPress={() => setSelectedCat(cat)}
                >
                  <Text style={[styles.catTxt, selectedCat === cat && styles.activeCatTxt]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </GlassCard>

        {/* Job Listings */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          OPEN MARKETPLACE JOBS ({filteredJobs.length})
        </Text>

        {filteredJobs.map((job) => (
          <GlassCard key={job.id} style={{ marginBottom: 14, padding: 16 }}>
            <View style={styles.jobHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeTxt}>
                    ⚡ {Math.round((aiScores.get(job.id) ?? 0) * 100)}% AI Match
                  </Text>
                </View>
                <Text style={[styles.jobTitle, { color: colors.textPrimary }]}>{job.title}</Text>
                <Text style={styles.jobClient}>Client: {job.client} • {job.category}</Text>
              </View>
              <Text style={[styles.jobBudget, { color: colors.accentEmerald }]}>{job.budget}</Text>
            </View>

            <Text style={[styles.jobDesc, { color: colors.textSecondary }]}>{job.description}</Text>

            {/* Skills Pills */}
            <View style={styles.skillsRow}>
              {job.skills.map((sk) => (
                <View key={sk} style={styles.skillBadge}>
                  <Text style={styles.skillTxt}>{sk}</Text>
                </View>
              ))}
            </View>

            {/* Bottom Actions */}
            <View style={styles.jobFooter}>
              <TouchableOpacity onPress={() => handleEditGig(job)}>
                <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "800" }}>
                  Edit Gig Details ✏️
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => handleOpenProposal(job)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnTxt}>Submit Pitch ➔</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Modals */}
      <CreateGigModal
        visible={createGigVisible}
        onClose={() => setCreateGigVisible(false)}
        onCreateGig={(g) => Alert.alert("Gig Published! ⚡", `Gig "${g.title}" created.`)}
      />

      <EditGigModal
        visible={editGigVisible}
        onClose={() => setEditGigVisible(false)}
        gig={activeGigToEdit}
        onSaveGig={handleSaveGigUpdate}
      />

      <SubmitProposalModal
        visible={proposalModalVisible}
        onClose={() => setProposalModalVisible(false)}
        jobTitle={activeJob?.title}
        defaultBudget={activeJob?.budget}
        onSubmitProposal={handleProposalSubmitted}
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
  heroTitle: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  createGigBtn: {
    backgroundColor: "#10b581",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createGigTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  searchLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 6 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activeCatPill: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b581",
  },
  catTxt: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  activeCatTxt: { color: "#ffffff", fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  jobHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  aiBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  aiBadgeTxt: { color: "#60a5fa", fontSize: 9, fontWeight: "900" },
  jobTitle: { fontSize: 16, fontWeight: "900" },
  jobClient: { color: "#94a3b8", fontSize: 11, fontWeight: "600", marginTop: 2 },
  jobBudget: { fontSize: 18, fontWeight: "900" },
  jobDesc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  skillBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillTxt: { color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 10,
  },
  applyBtn: {
    backgroundColor: "#10b581",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  applyBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
});
