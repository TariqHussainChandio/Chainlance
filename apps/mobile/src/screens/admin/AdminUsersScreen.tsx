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
import { UserProfileDrawerModal, AdminUserData } from "../../components/modals/UserProfileDrawerModal";

interface AdminUsersScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"all" | "freelancer" | "client" | "admin" | "banned">("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const [users, setUsers] = useState<AdminUserData[]>([
    { id: "USR-101", name: "Alex Rivers", email: "alex@chainwork.io", role: "freelancer", kycStatus: "approved", fraudScore: 5, joinedDate: "Jan 12, 2026", walletAddress: "0x71C...39A2" },
    { id: "USR-102", name: "Acme Web3 Ventures", email: "client@acme.io", role: "client", kycStatus: "approved", fraudScore: 12, joinedDate: "Feb 04, 2026", stripeStatus: "Verified Express" },
    { id: "USR-103", name: "Marcus Vance", email: "marcus@chainwork.io", role: "freelancer", kycStatus: "pending", fraudScore: 88, joinedDate: "Mar 19, 2026" },
    { id: "USR-104", name: "Sarah Chen", email: "sarah@chainwork.io", role: "admin", kycStatus: "approved", fraudScore: 0, joinedDate: "Nov 01, 2025" },
  ]);

  const filteredUsers = users.filter((u) => {
    const matchesFilter = selectedRoleFilter === "all" || u.role === selectedRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportCsv = () => {
    Alert.alert("Exporting CSV Ledger 📥", "Downloading chainwork-users-2026.csv to mobile downloads.");
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>User Management</Text>
          <Text style={styles.headerSubtitle}>User Roster & Account Restrictions</Text>
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
        {/* Search & Export Controls */}
        <GlassCard style={{ padding: 12, marginBottom: 12 }}>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Search users by name or email..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCsv} activeOpacity={0.8}>
            <Text style={styles.exportBtnTxt}>📥 Export CSV Roster</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Role Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {(["all", "freelancer", "client", "admin", "banned"] as const).map((rl) => (
              <TouchableOpacity
                key={rl}
                style={[
                  styles.tabPill,
                  { borderColor: colors.cardBorder },
                  selectedRoleFilter === rl && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
                ]}
                onPress={() => setSelectedRoleFilter(rl)}
              >
                <Text style={[styles.tabPillTxt, { color: selectedRoleFilter === rl ? "#ffffff" : colors.textMuted }]}>
                  {rl.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          PLATFORM USER ROSTER ({filteredUsers.length})
        </Text>

        {filteredUsers.map((u) => (
          <GlassCard key={u.id} style={{ marginBottom: 10, padding: 14 }}>
            <View style={styles.userRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{u.id} • {u.joinedDate}</Text>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>{u.name}</Text>
                <Text style={[styles.userEmail, { color: colors.textMuted }]}>{u.email}</Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge
                  status={u.role === "banned" ? "danger" : u.role === "admin" ? "active" : "pending"}
                  text={u.role.toUpperCase()}
                />
                <Text style={{ color: u.fraudScore >= 50 ? "#ef4444" : "#10b581", fontSize: 10, fontWeight: "900", marginTop: 4 }}>
                  Risk: {u.fraudScore}/100
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.inspectBtn}
              onPress={() => {
                setSelectedUser(u);
                setProfileModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.inspectBtnTxt}>Inspect Profile & Admin Actions ➔</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </ScrollView>

      {/* User Profile Inspection & Admin Control Modal */}
      <UserProfileDrawerModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={selectedUser}
        onToggleBanState={(userId, isBanned) => {
          setUsers(
            users.map((u) =>
              u.id === userId ? { ...u, role: isBanned ? "banned" : "freelancer" } : u
            )
          );
        }}
        onPromoteDemote={(userId, newRole) => {
          setUsers(
            users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
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
  searchInput: { borderWidth: 1, borderRadius: 12, height: 44, paddingHorizontal: 12, fontSize: 13, fontWeight: "600" },
  exportBtn: { backgroundColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 6, borderRadius: 8, alignItems: "center", marginTop: 8 },
  exportBtnTxt: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  userRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  userName: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  userEmail: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  inspectBtn: { backgroundColor: "rgba(16, 185, 129, 0.15)", paddingVertical: 7, borderRadius: 8, alignItems: "center", marginTop: 10 },
  inspectBtnTxt: { color: "#10b581", fontSize: 11, fontWeight: "900" },
});
