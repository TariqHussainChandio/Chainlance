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
import { FREELANCER_FEE_PERCENTAGE } from "@chainwork/shared";

interface FreelancerInvoicesScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

interface InvoiceItem {
  id: string;
  contractTitle: string;
  clientName: string;
  grossAmount: string;
  platformFee: string;
  netPayout: string;
  date: string;
  status: "paid" | "pending";
}

export const FreelancerInvoicesScreen: React.FC<FreelancerInvoicesScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const invoices: InvoiceItem[] = [
    { id: "INV-2026-001", contractTitle: "Full-Stack Smart Contract DApp", clientName: "Acme Crypto Ltd", grossAmount: "$1,250.00", platformFee: "$0.00", netPayout: "$1,250.00", date: "Aug 02, 2026", status: "paid" },
    { id: "INV-2026-002", contractTitle: "Cross-Chain Token Bridge UI", clientName: "Apex Financial", grossAmount: "$900.00", platformFee: "$0.00", netPayout: "$900.00", date: "Jul 28, 2026", status: "paid" },
    { id: "INV-2026-003", contractTitle: "AI Fraud Detection Risk Scoring Engine", clientName: "SecureChain Inc", grossAmount: "$1,850.00", platformFee: "$0.00", netPayout: "$1,850.00", date: "Jul 20, 2026", status: "pending" },
  ];

  const handleInspectInvoice = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setDetailModalVisible(true);
  };

  const handleDownloadPDF = () => {
    Alert.alert(
      "Receipt PDF Exported 📄",
      `Tax receipt for invoice ${selectedInvoice?.id} saved to your device downloads.`
    );
    setDetailModalVisible(false);
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Invoices & Receipts</Text>
          <Text style={styles.headerSubtitle}>Official Escrow Ledger</Text>
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
        {/* Ledger Header Card */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
          <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>TAX & AUDIT LEDGER</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Verified Escrow Receipts</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
            {(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}% Platform Fee • Instant PDF Receipts Export
          </Text>
        </GlassCard>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>INVOICE RECORDS ({invoices.length})</Text>

        {invoices.map((inv) => (
          <GlassCard key={inv.id} style={{ marginBottom: 12, padding: 16 }}>
            <View style={styles.invHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invId}>{inv.id} • {inv.date}</Text>
                <Text style={[styles.invTitle, { color: colors.textPrimary }]}>{inv.contractTitle}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600" }}>Client: {inv.clientName}</Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={inv.status === "paid" ? "active" : "pending"} text={inv.status.toUpperCase()} />
                <Text style={[styles.invAmount, { color: colors.accentEmerald }]}>{inv.netPayout}</Text>
              </View>
            </View>

            <View style={styles.invFooter}>
              <TouchableOpacity onPress={() => handleInspectInvoice(inv)}>
                <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "900" }}>
                  View Full Receipt & Download PDF 📄
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      {/* Invoice Detail Inspection Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <GlassCard variant="elevated" style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>OFFICIAL ESCROW RECEIPT</Text>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{selectedInvoice?.id}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModalVisible(false)}>
                  <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginVertical: 12 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>CONTRACT TITLE</Text>
                <Text style={[styles.val, { color: colors.textPrimary }]}>{selectedInvoice?.contractTitle}</Text>

                <Text style={[styles.label, { color: colors.textMuted, marginTop: 10 }]}>CLIENT NAME</Text>
                <Text style={[styles.val, { color: colors.textPrimary }]}>{selectedInvoice?.clientName}</Text>

                {/* Financial Itemized Breakdown Table */}
                <GlassCard style={{ padding: 12, marginTop: 14 }}>
                  <View style={styles.breakRow}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>Gross Milestone Escrow:</Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "900" }}>{selectedInvoice?.grossAmount}</Text>
                  </View>
                  <View style={styles.breakRow}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "700" }}>Platform Fee ({(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}%):</Text>
                    <Text style={{ color: colors.accentEmerald, fontSize: 13, fontWeight: "900" }}>{selectedInvoice?.platformFee}</Text>
                  </View>
                  <View style={[styles.breakRow, styles.totalBreakRow]}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "900" }}>Net Disbursed Payout:</Text>
                    <Text style={{ color: colors.accentEmerald, fontSize: 16, fontWeight: "900" }}>{selectedInvoice?.netPayout}</Text>
                  </View>
                </GlassCard>
              </View>

              <CustomButton
                title="Download Tax Receipt PDF 📄"
                onPress={handleDownloadPDF}
                style={{ marginTop: 10 }}
              />
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
  heroTitle: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  invHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  invId: { color: "#10b581", fontSize: 10, fontWeight: "900" },
  invTitle: { fontSize: 15, fontWeight: "900", marginTop: 2 },
  invAmount: { fontSize: 16, fontWeight: "900", marginTop: 4 },
  invFooter: { borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.06)", paddingTop: 10, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.8)", justifyContent: "center", padding: 20 },
  modalContent: { width: "100%" },
  modalCard: { padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255, 255, 255, 0.1)", justifyContent: "center", alignItems: "center" },
  closeTxt: { fontSize: 14, fontWeight: "bold" },
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  val: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  breakRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalBreakRow: { borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.1)", paddingTop: 8, marginTop: 4 },
});
