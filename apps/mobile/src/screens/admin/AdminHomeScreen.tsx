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
import { CreateAdminModal } from "../../components/modals/CreateAdminModal";

interface AdminHomeScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const AdminHomeScreen: React.FC<AdminHomeScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [createAdminVisible, setCreateAdminVisible] = useState(false);

  const priorityQueues = {
    pendingKyc: 14,
    fraudAlerts: 3,
    activeDisputes: 2,
    totalUsers: 1420,
  };

  const weeklyVelocity = {
    volume: "$48,920.00",
    newUsers: "+128",
    newGigs: "+42",
    newContracts: "+19",
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin Control Suite</Text>
          <Text style={styles.headerSubtitle}>SUPER ADMIN OVERVIEW</Text>
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
        {/* Role Banner & Super Admin Quick Action */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
          <View style={styles.roleBannerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.superBadge}>
                <Text style={styles.superBadgeTxt}>⚡ SUPER ADMIN CONTROL</Text>
              </View>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>System Operations Hub</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                Platform Health: 100% Operational • Escrow SLA: Normal
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addAdminBtn}
              onPress={() => setCreateAdminVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addAdminBtnTxt}>+ Add Admin 🛡️</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 4 Priority Action Queue Tiles */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PRIORITY ACTION QUEUES</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.gridTileWrapper}
            onPress={() => onNavigateTab && onNavigateTab("admin_kyc")}
          >
            <GlassCard style={styles.gridTile}>
              <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900" }}>PENDING KYC</Text>
              <Text style={[styles.tileNum, { color: colors.textPrimary }]}>{priorityQueues.pendingKyc}</Text>
              <Text style={{ color: "#10b581", fontSize: 9, fontWeight: "800", marginTop: 2 }}>Review Identity Documents ➔</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridTileWrapper}
            onPress={() => onNavigateTab && onNavigateTab("admin_fraud")}
          >
            <GlassCard style={styles.gridTile}>
              <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "900" }}>OPEN FRAUD ALERTS</Text>
              <Text style={[styles.tileNum, { color: "#ef4444" }]}>{priorityQueues.fraudAlerts}</Text>
              <Text style={{ color: "#ef4444", fontSize: 9, fontWeight: "800", marginTop: 2 }}>High Risk Alerts ➔</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity
            style={styles.gridTileWrapper}
            onPress={() => onNavigateTab && onNavigateTab("admin_disputes")}
          >
            <GlassCard style={styles.gridTile}>
              <Text style={{ color: colors.accentAzure, fontSize: 10, fontWeight: "900" }}>ACTIVE DISPUTES</Text>
              <Text style={[styles.tileNum, { color: colors.accentAzure }]}>{priorityQueues.activeDisputes}</Text>
              <Text style={{ color: colors.accentAzure, fontSize: 9, fontWeight: "800", marginTop: 2 }}>Arbitrate Escrow ➔</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridTileWrapper}
            onPress={() => onNavigateTab && onNavigateTab("admin_users")}
          >
            <GlassCard style={styles.gridTile}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900" }}>REGISTERED USERS</Text>
              <Text style={[styles.tileNum, { color: colors.textPrimary }]}>{priorityQueues.totalUsers}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: "800", marginTop: 2 }}>Manage Roster ➔</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Weekly Velocity Stats Grid */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted, marginTop: 10 }]}>WEEKLY VELOCITY METRICS</Text>
        <GlassCard style={{ padding: 16, marginBottom: 14 }}>
          <View style={styles.velocityRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900" }}>ESCROW VOLUME</Text>
              <Text style={[styles.velVal, { color: colors.accentEmerald }]}>{weeklyVelocity.volume}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900" }}>NEW USERS</Text>
              <Text style={[styles.velVal, { color: colors.textPrimary }]}>{weeklyVelocity.newUsers}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "900" }}>NEW CONTRACTS</Text>
              <Text style={[styles.velVal, { color: colors.accentAzure }]}>{weeklyVelocity.newContracts}</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Super Admin Create Admin Modal */}
      <CreateAdminModal
        visible={createAdminVisible}
        onClose={() => setCreateAdminVisible(false)}
        onCreateAdmin={(name, email, level) => {
          // Onboarded admin user
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
  roleBannerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  superBadge: { backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginBottom: 2 },
  superBadgeTxt: { color: "#10b581", fontSize: 9, fontWeight: "900" },
  bannerTitle: { fontSize: 17, fontWeight: "900" },
  addAdminBtn: { backgroundColor: "#10b581", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addAdminBtnTxt: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  gridRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  gridTileWrapper: { flex: 1 },
  gridTile: { padding: 14 },
  tileNum: { fontSize: 24, fontWeight: "900", marginTop: 4 },
  velocityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  velVal: { fontSize: 15, fontWeight: "900", marginTop: 2 },
});
