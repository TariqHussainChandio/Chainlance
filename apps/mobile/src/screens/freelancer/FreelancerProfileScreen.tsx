import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";

interface FreelancerProfileScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const FreelancerProfileScreen: React.FC<FreelancerProfileScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { profile, updateProfileData } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(
    profile?.bio ||
      "Senior Full-Stack Blockchain & React Native Engineer specializing in EVM smart contract security, Web3 DApp integrations, and mobile cross-platform architectures."
  );
  const [hourlyRate, setHourlyRate] = useState(profile?.hourlyRate || "$85.00/hr");
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "Solidity, React Native, TypeScript, Ethers.js, Hardhat, Python");

  const [portfolioProjects, setPortfolioProjects] = useState([
    { id: "PF-1", title: "Cross-Chain Staking Vault DApp", category: "DeFi / Mobile", link: "https://github.com/example/staking-vault" },
    { id: "PF-2", title: "AI Fraud Risk Engine API", category: "Machine Learning", link: "https://github.com/example/fraud-engine" },
  ]);

  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("");
  const [showAddProject, setShowAddProject] = useState(false);

  const userInitials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "FL";

  const handleSaveProfile = async () => {
    try {
      await updateProfileData({
        bio,
        hourlyRate,
        skills: skills.split(",").map((s) => s.trim()),
      });
      setEditing(false);
      Alert.alert("Profile Saved ⚡", "Your profile details have been updated.");
    } catch (err) {
      Alert.alert("Save Error", "Failed to update profile.");
    }
  };

  const handleAddPortfolioProject = () => {
    if (!newProjectTitle.trim()) {
      Alert.alert("Missing Title", "Please enter a portfolio project title.");
      return;
    }
    setPortfolioProjects([
      ...portfolioProjects,
      {
        id: `PF-${Date.now()}`,
        title: newProjectTitle.trim(),
        category: newProjectCategory.trim() || "Web3 / Mobile",
        link: "https://github.com/example/project",
      },
    ]);
    setNewProjectTitle("");
    setNewProjectCategory("");
    setShowAddProject(false);
    Alert.alert("Project Added 🚀", "New portfolio item added to your profile.");
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile & Portfolio</Text>
          <Text style={styles.headerSubtitle}>Verified Freelancer Identity</Text>
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
        {/* Profile Identity Card */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
          <View style={styles.profileHeaderRow}>
            {profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{userInitials}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View style={styles.kycBadge}>
                <Text style={styles.kycBadgeTxt}>✓ KYC VERIFIED IDENTITY</Text>
              </View>
              <Text style={[styles.nameTxt, { color: colors.textPrimary }]}>
                {profile?.name || "Senior Freelancer"}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                Rate: {hourlyRate} • 5.0 ★ Rating (12 Reviews)
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* KYC Identity Verification Card */}
        <GlassCard style={{ padding: 14, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                IDENTITY VERIFICATION
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "800", marginTop: 2 }}>
                KYC Status:{" "}
                <Text style={{
                  color: profile?.kycStatus === "approved" ? colors.accentEmerald
                    : profile?.kycStatus === "submitted" ? "#3b82f6"
                    : profile?.kycStatus === "rejected" ? "#ef4444"
                    : colors.textMuted,
                }}>
                  {profile?.kycStatus === "approved" ? "Verified ✓"
                    : profile?.kycStatus === "submitted" ? "Under Review"
                    : profile?.kycStatus === "rejected" ? "Rejected"
                    : "Not Submitted"}
                </Text>
              </Text>
            </View>
            {onNavigateTab && profile?.kycStatus !== "approved" && (
              <TouchableOpacity
                style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.4)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 }}
                onPress={() => onNavigateTab("kyc")}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.accentEmerald, fontSize: 11, fontWeight: "900" }}>
                  {profile?.kycStatus === "submitted" ? "View Status" : "Submit KYC"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Bio & Skills Editor */}
        <GlassCard style={{ padding: 16, marginBottom: 14 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Professional Overview</Text>
            <TouchableOpacity onPress={() => (editing ? handleSaveProfile() : setEditing(true))}>
              <Text style={{ color: colors.accentEmerald, fontSize: 12, fontWeight: "900" }}>
                {editing ? "Save Changes ✓" : "Edit Profile ✏️"}
              </Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Hourly Rate ($/hr)</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={hourlyRate}
                onChangeText={setHourlyRate}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Professional Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Skills (Comma-separated)</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={skills}
                onChangeText={setSkills}
              />
            </View>
          ) : (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.bioTxt, { color: colors.textSecondary }]}>{bio}</Text>

              <Text style={[styles.subLabel, { color: colors.textMuted, marginTop: 12 }]}>VERIFIED SKILLS & COMPETENCIES</Text>
              <View style={styles.skillsRow}>
                {skills.split(",").map((sk, idx) => (
                  <View key={idx} style={styles.skillPill}>
                    <Text style={styles.skillTxt}>{sk.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </GlassCard>

        {/* Portfolio Showcase Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PORTFOLIO SHOWCASE</Text>
          <TouchableOpacity onPress={() => setShowAddProject(true)}>
            <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "900" }}>+ Add Project</Text>
          </TouchableOpacity>
        </View>

        {showAddProject && (
          <GlassCard style={{ padding: 14, marginBottom: 12 }}>
            <Text style={[styles.addTitle, { color: colors.textPrimary }]}>Add Portfolio Item</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, marginTop: 6 }]}
              placeholder="Project Title (e.g. NFT Marketplace DApp)"
              placeholderTextColor="#64748b"
              value={newProjectTitle}
              onChangeText={setNewProjectTitle}
            />
            <TextInput
              style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, marginTop: 8 }]}
              placeholder="Category (e.g. DeFi / Smart Contracts)"
              placeholderTextColor="#64748b"
              value={newProjectCategory}
              onChangeText={setNewProjectCategory}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddPortfolioProject}>
              <Text style={styles.addBtnTxt}>Save Portfolio Item ✓</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {portfolioProjects.map((pj) => (
          <GlassCard key={pj.id} style={{ padding: 14, marginBottom: 10 }}>
            <View style={styles.pfRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pfTitle, { color: colors.textPrimary }]}>{pj.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>{pj.category}</Text>
              </View>
              <TouchableOpacity>
                <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "800" }}>View Repository 🔗</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
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
  profileHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: "#10b581" },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#10b581", justifyContent: "center", alignItems: "center" },
  avatarTxt: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  kycBadge: { backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginBottom: 2 },
  kycBadgeTxt: { color: "#10b581", fontSize: 9, fontWeight: "900" },
  nameTxt: { fontSize: 17, fontWeight: "900" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "900" },
  label: { fontSize: 11, fontWeight: "800", marginTop: 8, marginBottom: 4 },
  subLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 6 },
  bioTxt: { fontSize: 12, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 10, height: 42, paddingHorizontal: 12, fontSize: 12, fontWeight: "600" },
  textArea: { height: 74, textAlignVertical: "top", paddingTop: 8 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillPill: { backgroundColor: "rgba(16, 185, 129, 0.15)", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.3)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillTxt: { color: "#10b581", fontSize: 11, fontWeight: "800" },
  addTitle: { fontSize: 13, fontWeight: "900" },
  addBtn: { backgroundColor: "#10b581", paddingVertical: 8, borderRadius: 10, alignItems: "center", marginTop: 10 },
  addBtnTxt: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  pfRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pfTitle: { fontSize: 13, fontWeight: "800" },
});
