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

interface ClientProfileScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const ClientProfileScreen: React.FC<ClientProfileScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { profile, updateProfileData } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState(profile?.name || "Acme Web3 Ventures");
  const [websiteUrl, setWebsiteUrl] = useState("https://acmeventures.io");
  const [companyBio, setCompanyBio] = useState(
    "Venture-backed Web3 innovation studio building decentralized infrastructure and next-generation mobile DApps."
  );

  const userInitials = companyName
    ? companyName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "AC";

  const handleSave = async () => {
    try {
      await updateProfileData({
        name: companyName,
        bio: companyBio,
      });
      setEditing(false);
      Alert.alert("Company Profile Saved ⚡", "Your company details have been updated.");
    } catch (err) {
      Alert.alert("Save Error", "Failed to update company profile.");
    }
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Company Profile</Text>
          <Text style={styles.headerSubtitle}>Verified Client Identity</Text>
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
        {/* Company Identity Header */}
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
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeTxt}>✓ VERIFIED CLIENT ENTERPRISE</Text>
              </View>
              <Text style={[styles.nameTxt, { color: colors.textPrimary }]}>{companyName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700" }}>
                Website: {websiteUrl}
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

        {/* Company Bio & Details Editor */}
        <GlassCard style={{ padding: 16, marginBottom: 14 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Company Overview</Text>
            <TouchableOpacity onPress={() => (editing ? handleSave() : setEditing(true))}>
              <Text style={{ color: colors.accentEmerald, fontSize: 12, fontWeight: "900" }}>
                {editing ? "Save Changes ✓" : "Edit Profile ✏️"}
              </Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Company Name</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Website URL</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Company Bio & Mission</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={companyBio}
                onChangeText={setCompanyBio}
                multiline
                numberOfLines={4}
              />
            </View>
          ) : (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.bioTxt, { color: colors.textSecondary }]}>{companyBio}</Text>
            </View>
          )}
        </GlassCard>
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
  verifiedBadge: { backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginBottom: 2 },
  verifiedBadgeTxt: { color: "#10b581", fontSize: 9, fontWeight: "900" },
  nameTxt: { fontSize: 17, fontWeight: "900" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "900" },
  label: { fontSize: 11, fontWeight: "800", marginTop: 8, marginBottom: 4 },
  bioTxt: { fontSize: 12, lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 10, height: 42, paddingHorizontal: 12, fontSize: 12, fontWeight: "600" },
  textArea: { height: 74, textAlignVertical: "top", paddingTop: 8 },
});
