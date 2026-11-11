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
import { AdminKycInspectorModal, KycSubmissionItem } from "../../components/modals/AdminKycInspectorModal";

interface AdminKycScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const AdminKycScreen: React.FC<AdminKycScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedTab, setSelectedTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedKyc, setSelectedKyc] = useState<KycSubmissionItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [submissions, setSubmissions] = useState<KycSubmissionItem[]>([
    {
      id: "KYC-701",
      userName: "Alex Rivers",
      userEmail: "alex@chainwork.io",
      role: "freelancer",
      docType: "Passport",
      docNumber: "P-99201482",
      submittedDate: "Aug 03, 2026",
      status: "pending",
    },
    {
      id: "KYC-700",
      userName: "Acme Web3 Ventures",
      userEmail: "client@acme.io",
      role: "client",
      docType: "National ID",
      docNumber: "ID-11029381",
      submittedDate: "Jul 29, 2026",
      status: "approved",
    },
  ]);

  const filteredSubmissions = submissions.filter((s) => s.status === selectedTab);

  const handleExportCsv = () => {
    Alert.alert("Exporting CSV Log 📥", "Downloading chainwork-kyc-2026.csv to mobile downloads.");
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>KYC Verification</Text>
          <Text style={styles.headerSubtitle}>Identity Document Inspection</Text>
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
        {/* CSV Export & Queue Filter Tabs */}
        <GlassCard style={{ padding: 12, marginBottom: 12 }}>
          <View style={styles.tabRow}>
            {(["pending", "approved", "rejected"] as const).map((tb) => (
              <TouchableOpacity
                key={tb}
                style={[
                  styles.tabPill,
                  { borderColor: colors.cardBorder },
                  selectedTab === tb && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
                ]}
                onPress={() => setSelectedTab(tb)}
              >
                <Text style={[styles.tabPillTxt, { color: selectedTab === tb ? "#ffffff" : colors.textMuted }]}>
                  {tb.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCsv} activeOpacity={0.8}>
            <Text style={styles.exportBtnTxt}>📥 Export KYC Audit Log CSV</Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          IDENTITY SUBMISSIONS ({filteredSubmissions.length})
        </Text>

        {filteredSubmissions.map((sub) => (
          <GlassCard key={sub.id} style={{ marginBottom: 12, padding: 14 }}>
            <View style={styles.kycHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{sub.id} • {sub.submittedDate}</Text>
                <Text style={[styles.kycName, { color: colors.textPrimary }]}>{sub.userName}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                  Document: {sub.docType} ({sub.docNumber})
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge
                  status={sub.status === "approved" ? "active" : sub.status === "rejected" ? "danger" : "pending"}
                  text={sub.status.toUpperCase()}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.inspectBtn}
              onPress={() => {
                setSelectedKyc(sub);
                setModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.inspectBtnTxt}>Inspect Document & Approve/Reject ➔</Text>
            </TouchableOpacity>
          </GlassCard>
        ))}
      </ScrollView>

      {/* KYC Inspector Modal */}
      <AdminKycInspectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        kycItem={selectedKyc}
        onApproveKyc={(kycId) => {
          setSubmissions(
            submissions.map((s) => (s.id === kycId ? { ...s, status: "approved" } : s))
          );
        }}
        onRejectKyc={(kycId) => {
          setSubmissions(
            submissions.map((s) => (s.id === kycId ? { ...s, status: "rejected" } : s))
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
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  tabPill: { flex: 1, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabPillTxt: { fontSize: 10, fontWeight: "900" },
  exportBtn: { backgroundColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 6, borderRadius: 8, alignItems: "center" },
  exportBtnTxt: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  kycHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  kycName: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  inspectBtn: { backgroundColor: "#10b581", paddingVertical: 8, borderRadius: 10, alignItems: "center", marginTop: 10 },
  inspectBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
});
