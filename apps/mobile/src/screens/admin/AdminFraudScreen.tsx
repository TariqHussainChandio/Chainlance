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
import {
  computeFraudScore,
  bucketFromScore,
  BUCKET_COLOR,
  type SerializedUser,
  type FraudContext,
} from "@chainwork/shared";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { StatusBadge } from "../../components/StatusBadge";
import { AdminFraudReviewModal, FraudAlertItem } from "../../components/modals/AdminFraudReviewModal";

interface AdminFraudScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const AdminFraudScreen: React.FC<AdminFraudScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [scanning, setScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "open" | "reviewed" | "confirmed" | "dismissed">("open");
  const [selectedAlert, setSelectedAlert] = useState<FraudAlertItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [alerts, setAlerts] = useState<FraudAlertItem[]>([
    {
      id: "FRD-901",
      userName: "Marcus Vance",
      userEmail: "marcus@chainwork.io",
      riskScore: 88,
      detectedPattern: "Rapid proposal submission spamming (> 20 bids / 10 mins)",
      status: "open",
      timestamp: "Aug 04, 2026",
    },
    {
      id: "FRD-900",
      userName: "David Vance",
      userEmail: "david@chainwork.io",
      riskScore: 62,
      detectedPattern: "Repeated milestone contract cancellation attempt",
      status: "dismissed",
      timestamp: "Jul 31, 2026",
    },
  ]);

  const filteredAlerts = alerts.filter(
    (a) => selectedFilter === "all" || a.status === selectedFilter
  );

  const handleScanNow = () => {
    setScanning(true);
    setTimeout(() => {
      // Mock users for the fraud engine — representative of common suspicious patterns
      const mockUsers: Array<{ user: SerializedUser; ctx: FraudContext }> = [
        {
          user: {
            uid: "scan-001", email: "rapid@test.io", name: "RapidUser 7721",
            role: "freelancer", walletAddress: null, kycStatus: "pending",
            fraudScore: 0, profileImage: null, bio: null, skills: [],
            createdAt: Date.now() - 10 * 3_600_000,  // 10 hours old
            updatedAt: Date.now(),
          },
          ctx: {
            gigs: [
              { id: "g1", freelancerId: "scan-001", freelancerName: "RapidUser 7721", freelancerAvatar: null, freelancerRating: 0, title: "x", description: "x", category: "AI", pricingBasic: 100, pricingStandard: 200, pricingPremium: 300, deliveryDays: 1, status: "published", skills: [], thumbnailUrl: null, createdAt: Date.now() - 1800000, updatedAt: Date.now() },
              { id: "g2", freelancerId: "scan-001", freelancerName: "RapidUser 7721", freelancerAvatar: null, freelancerRating: 0, title: "y", description: "y", category: "AI", pricingBasic: 200, pricingStandard: 300, pricingPremium: 400, deliveryDays: 1, status: "published", skills: [], thumbnailUrl: null, createdAt: Date.now() - 900000, updatedAt: Date.now() },
              { id: "g3", freelancerId: "scan-001", freelancerName: "RapidUser 7721", freelancerAvatar: null, freelancerRating: 0, title: "z", description: "z", category: "AI", pricingBasic: 300, pricingStandard: 400, pricingPremium: 500, deliveryDays: 1, status: "published", skills: [], thumbnailUrl: null, createdAt: Date.now() - 600000, updatedAt: Date.now() },
              { id: "g4", freelancerId: "scan-001", freelancerName: "RapidUser 7721", freelancerAvatar: null, freelancerRating: 0, title: "w", description: "w", category: "AI", pricingBasic: 100, pricingStandard: 200, pricingPremium: 300, deliveryDays: 1, status: "published", skills: [], thumbnailUrl: null, createdAt: Date.now() - 300000, updatedAt: Date.now() },
              { id: "g5", freelancerId: "scan-001", freelancerName: "RapidUser 7721", freelancerAvatar: null, freelancerRating: 0, title: "v", description: "v", category: "AI", pricingBasic: 500, pricingStandard: 600, pricingPremium: 700, deliveryDays: 1, status: "published", skills: [], thumbnailUrl: null, createdAt: Date.now() - 100000, updatedAt: Date.now() },
            ],
            contractsAsFreelancer: [],
            contractsAsClient: [],
            reviewsReceived: [],
            reviewsGiven: [],
          },
        },
        {
          user: {
            uid: "scan-002", email: "sockpuppet@test.io", name: "SockPuppet Account",
            role: "client", walletAddress: null, kycStatus: "pending",
            fraudScore: 0, profileImage: null, bio: null, skills: [],
            createdAt: Date.now() - 48 * 3_600_000,  // 2 days old
            updatedAt: Date.now(),
          },
          ctx: {
            gigs: [],
            contractsAsFreelancer: [],
            contractsAsClient: [
              { id: "c1", clientId: "scan-002", freelancerId: "f1", clientName: "SockPuppet Account", clientAvatar: null, freelancerName: "F1", freelancerAvatar: null, gigId: null, gigTitle: null, title: "C1", totalAmount: 500, status: "cancelled", mockTxHash: null, escrowFunded: false, createdAt: Date.now() - 86400000, updatedAt: Date.now(), disputeOpenedAt: null },
              { id: "c2", clientId: "scan-002", freelancerId: "f2", clientName: "SockPuppet Account", clientAvatar: null, freelancerName: "F2", freelancerAvatar: null, gigId: null, gigTitle: null, title: "C2", totalAmount: 500, status: "disputed", mockTxHash: null, escrowFunded: false, createdAt: Date.now() - 43200000, updatedAt: Date.now(), disputeOpenedAt: null },
              { id: "c3", clientId: "scan-002", freelancerId: "f3", clientName: "SockPuppet Account", clientAvatar: null, freelancerName: "F3", freelancerAvatar: null, gigId: null, gigTitle: null, title: "C3", totalAmount: 500, status: "cancelled", mockTxHash: null, escrowFunded: false, createdAt: Date.now() - 21600000, updatedAt: Date.now(), disputeOpenedAt: null },
            ],
            reviewsReceived: [],
            reviewsGiven: [
              { id: "r1", reviewerId: "scan-002", reviewerName: "SockPuppet Account", reviewerAvatar: null, revieweeId: "f1", revieweeName: "F1", revieweeAvatar: null, contractId: "c1", contractTitle: "C1", gigId: null, rating: 5, comment: "great", createdAt: Date.now() - 100000 },
              { id: "r2", reviewerId: "scan-002", reviewerName: "SockPuppet Account", reviewerAvatar: null, revieweeId: "f2", revieweeName: "F2", revieweeAvatar: null, contractId: "c2", contractTitle: "C2", gigId: null, rating: 5, comment: "great", createdAt: Date.now() - 90000 },
              { id: "r3", reviewerId: "scan-002", reviewerName: "SockPuppet Account", reviewerAvatar: null, revieweeId: "f3", revieweeName: "F3", revieweeAvatar: null, contractId: "c3", contractTitle: "C3", gigId: null, rating: 5, comment: "great", createdAt: Date.now() - 80000 },
            ],
          },
        },
      ];

      const newAlerts: FraudAlertItem[] = [];
      const scanDate = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
      mockUsers.forEach(({ user, ctx }, i) => {
        const result = computeFraudScore(user, ctx);
        if (result.totalScore >= 10) {
          newAlerts.push({
            id: `FRD-${900 + alerts.length + i + 1}`,
            userName: user.name,
            userEmail: user.email,
            riskScore: result.totalScore,
            detectedPattern: result.detectedPatterns[0] ?? "Anomalous activity detected",
            status: "open",
            timestamp: scanDate,
            signals: result.signals,
          });
        }
      });

      setAlerts((prev) => [...newAlerts, ...prev]);
      setScanning(false);
      setSelectedFilter("open");
      Alert.alert(
        "AI Risk Scanner Complete 🪄",
        `Scanned 1,420 accounts. ${newAlerts.length} new threat${newAlerts.length !== 1 ? "s" : ""} detected.`
      );
    }, 800);
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Fraud Detection</Text>
          <Text style={styles.headerSubtitle}>Heuristic Scanner & Risk Scoring</Text>
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
        {/* Automated Scanner Hero Card */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
          <View style={styles.scanHeader}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>HEURISTIC PATTERN ENGINE</Text>
              <Text style={[styles.scanTitle, { color: colors.textPrimary }]}>AI Risk Scanner</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                Real-time Anomaly Detection Active
              </Text>
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={handleScanNow}
              disabled={scanning}
              activeOpacity={0.8}
            >
              <Text style={styles.scanBtnTxt}>{scanning ? "Scanning..." : "Scan Now 🪄"}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Fraud Risk Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {(["all", "open", "reviewed", "confirmed", "dismissed"] as const).map((fl) => (
              <TouchableOpacity
                key={fl}
                style={[
                  styles.tabPill,
                  { borderColor: colors.cardBorder },
                  selectedFilter === fl && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
                ]}
                onPress={() => setSelectedFilter(fl)}
              >
                <Text style={[styles.tabPillTxt, { color: selectedFilter === fl ? "#ffffff" : colors.textMuted }]}>
                  {fl.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          FLAGGED FRAUD ALERTS ({filteredAlerts.length})
        </Text>

        {filteredAlerts.map((al) => (
          <GlassCard key={al.id} style={{ marginBottom: 12, padding: 14 }}>
            <View style={styles.alHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "900" }}>{al.id} • {al.timestamp}</Text>
                <Text style={[styles.alUser, { color: colors.textPrimary }]}>{al.userName}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                  {al.detectedPattern}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <View style={[styles.riskPill, { backgroundColor: BUCKET_COLOR[bucketFromScore(al.riskScore)] }]}>
                  <Text style={styles.riskPillTxt}>{al.riskScore} RISK</Text>
                </View>
                <StatusBadge status={al.status === "dismissed" ? "pending" : "danger"} text={al.status.toUpperCase()} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => {
                setSelectedAlert(al);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewBtnTxt}>Review Risk Profile & Take Action ➔</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Fraud Risk Review Drawer Modal */}
      <AdminFraudReviewModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        alertItem={selectedAlert}
        onConfirmRestrict={(alertId) => {
          setAlerts(
            alerts.map((a) => (a.id === alertId ? { ...a, status: "confirmed", riskScore: 100 } : a))
          );
        }}
        onDismissAlert={(alertId) => {
          setAlerts(
            alerts.map((a) => (a.id === alertId ? { ...a, status: "dismissed" } : a))
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
  scanHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scanTitle: { fontSize: 17, fontWeight: "900", marginTop: 2 },
  scanBtn: { backgroundColor: "#10b581", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  scanBtnTxt: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  tabPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  alHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  alUser: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  riskPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  riskPillTxt: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  reviewBtn: { backgroundColor: "rgba(239, 68, 68, 0.15)", paddingVertical: 7, borderRadius: 8, alignItems: "center", marginTop: 10 },
  reviewBtnTxt: { color: "#ef4444", fontSize: 11, fontWeight: "900" },
});
