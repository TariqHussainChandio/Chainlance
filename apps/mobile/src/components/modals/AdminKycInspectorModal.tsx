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

export interface KycSubmissionItem {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  docType: "Passport" | "Driver's License" | "National ID";
  docNumber: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  docUrl?: string;
}

interface AdminKycInspectorModalProps {
  visible: boolean;
  onClose: () => void;
  kycItem?: KycSubmissionItem | null;
  onApproveKyc?: (kycId: string) => void;
  onRejectKyc?: (kycId: string, reason: string) => void;
}

export const AdminKycInspectorModal: React.FC<AdminKycInspectorModalProps> = ({
  visible,
  onClose,
  kycItem,
  onApproveKyc,
  onRejectKyc,
}) => {
  const { colors, theme } = useTheme();

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!visible || !kycItem) return null;

  const handleApprove = () => {
    Alert.alert(
      "Approve KYC Identity Verification?",
      `Mark ${kycItem.userName}'s identity document (${kycItem.docType}) as verified?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve Verification ✓",
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              if (onApproveKyc) {
                onApproveKyc(kycItem.id);
              }
              onClose();
              Alert.alert("KYC Approved! ✅", `User ${kycItem.userName} identity verified.`);
            }, 300);
          },
        },
      ]
    );
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      Alert.alert("Missing Reason", "Please provide a clear rejection reason for the applicant.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onRejectKyc) {
        onRejectKyc(kycItem.id, rejectReason.trim());
      }
      onClose();
      setShowRejectInput(false);
      setRejectReason("");
      Alert.alert("KYC Rejected", "Rejection notice sent to user email.");
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>{kycItem.id} • KYC INSPECTION</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{kycItem.userName}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {kycItem.userEmail} • Role: {kycItem.role.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Document Overview Hero Card */}
              <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
                <View style={styles.docRow}>
                  <View>
                    <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>DOCUMENT TYPE</Text>
                    <Text style={[styles.docTypeTxt, { color: colors.textPrimary }]}>{kycItem.docType}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700" }}>DOCUMENT NO</Text>
                    <Text style={{ color: colors.accentEmerald, fontSize: 13, fontWeight: "900", marginTop: 2 }}>{kycItem.docNumber}</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Embedded Document Preview Box */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>IDENTITY DOCUMENT PREVIEW</Text>
              <GlassCard style={{ padding: 16, marginBottom: 14, alignItems: "center" }}>
                <View style={styles.previewBox}>
                  <Text style={{ fontSize: 32 }}>📜</Text>
                  <Text style={[styles.previewTxt, { color: colors.textPrimary }]}>
                    {kycItem.docType} Image Preview
                  </Text>
                  <TouchableOpacity style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "900" }}>
                      Open Original Image ↗
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>

              {/* Rejection Reason Form */}
              {showRejectInput ? (
                <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                  <Text style={[styles.formTitle, { color: "#ef4444" }]}>Rejection Reason Notice</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    placeholder="e.g. Image blur or expired document date..."
                    placeholderTextColor="#64748b"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.actionRow}>
                    <CustomButton
                      title="Submit Rejection Notice"
                      variant="danger"
                      onPress={handleRejectSubmit}
                      loading={loading}
                      style={{ flex: 1 }}
                    />
                    <CustomButton
                      title="Cancel"
                      variant="outline"
                      onPress={() => setShowRejectInput(false)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </GlassCard>
              ) : (
                kycItem.status === "pending" && (
                  <View style={styles.actionRow}>
                    <CustomButton
                      title="Approve KYC Identity ✓"
                      onPress={handleApprove}
                      loading={loading}
                      style={{ flex: 2 }}
                    />
                    <CustomButton
                      title="Reject"
                      variant="danger"
                      onPress={() => setShowRejectInput(true)}
                      style={{ flex: 1 }}
                    />
                  </View>
                )
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
    maxHeight: "88%",
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
    fontSize: 18,
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
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docTypeTxt: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  previewBox: {
    alignItems: "center",
    paddingVertical: 12,
  },
  previewTxt: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
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
    height: 66,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
});
