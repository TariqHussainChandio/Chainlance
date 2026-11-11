import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";
import { StatusBadge } from "../StatusBadge";

export interface DisputeItem {
  id: string;
  contractTitle: string;
  clientName: string;
  freelancerName: string;
  totalAmount: string;
  status: "active" | "resolved";
  openedDate: string;
  slaDaysRemaining: number;
  reason: string;
  evidenceUrl?: string;
}

interface AdminDisputeArbitrationModalProps {
  visible: boolean;
  onClose: () => void;
  dispute?: DisputeItem | null;
  onResolveDispute?: (disputeId: string, resolution: "refund_client" | "release_freelancer", explanation: string) => void;
}

export const AdminDisputeArbitrationModal: React.FC<AdminDisputeArbitrationModalProps> = ({
  visible,
  onClose,
  dispute,
  onResolveDispute,
}) => {
  const { colors, theme } = useTheme();

  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  if (!visible || !dispute) return null;

  const handleArbitration = (action: "refund_client" | "release_freelancer") => {
    if (explanation.trim().length < 8) {
      Alert.alert("Missing Explanation", "Please provide a clear arbitration resolution statement (min 8 characters).");
      return;
    }

    const actionText = action === "refund_client" ? "Refund Escrow to Client" : "Release Escrow to Freelancer";
    Alert.alert(
      "Confirm Arbitration Decision",
      `Execute ${actionText} for ${dispute.totalAmount}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Execute Arbitrated Decision ⚖️",
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              if (onResolveDispute) {
                onResolveDispute(dispute.id, action, explanation.trim());
              }
              onClose();
              Alert.alert(
                "Dispute Resolved ⚖️",
                `Escrow funds of ${dispute.totalAmount} successfully processed.`
              );
            }, 400);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>{dispute.id} • ARBITRATION CASE</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{dispute.contractTitle}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Client: {dispute.clientName} vs Freelancer: {dispute.freelancerName}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SLA & Escrow Hero Card */}
              <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>DISPUTED ESCROW AMOUNT</Text>
                    <Text style={[styles.amountTxt, { color: colors.textPrimary }]}>{dispute.totalAmount}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <StatusBadge status={dispute.slaDaysRemaining <= 2 ? "pending" : "active"} text={`SLA: ${dispute.slaDaysRemaining} DAYS`} />
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 4 }}>
                      Opened: {dispute.openedDate}
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Raised Dispute Reason & Evidence */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SUBMITTED EVIDENCE & REASON</Text>
              <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                <Text style={[styles.reasonTxt, { color: colors.textSecondary }]}>"{dispute.reason}"</Text>
                <TouchableOpacity style={styles.evidenceBtn}>
                  <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "900", marginTop: 8 }}>
                    View Attached Evidence File ↗
                  </Text>
                </TouchableOpacity>
              </GlassCard>

              {/* Official Arbitration Statement Input */}
              {dispute.status === "active" && (
                <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Official Resolution Statement</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    placeholder="State technical justification for escrow disbursal..."
                    placeholderTextColor="#64748b"
                    value={explanation}
                    onChangeText={setExplanation}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.actionRow}>
                    <CustomButton
                      title="Refund Client 💸"
                      variant="danger"
                      onPress={() => handleArbitration("refund_client")}
                      loading={loading}
                      style={{ flex: 1 }}
                    />
                    <CustomButton
                      title="Release to Freelancer 💸"
                      onPress={() => handleArbitration("release_freelancer")}
                      loading={loading}
                      style={{ flex: 1 }}
                    />
                  </View>
                </GlassCard>
              )}
            </ScrollView>
          </GlassCard>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    maxHeight: "90%",
  },
  card: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderRadius: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  badgeTxt: {
    color: "#10b581",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeTxt: {
    fontSize: 14,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountTxt: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  reasonTxt: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  evidenceBtn: {
    marginTop: 4,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
});
