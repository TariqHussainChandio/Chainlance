import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";

interface ReviewWorkModalProps {
  visible: boolean;
  onClose: () => void;
  contractInfo: {
    title: string;
    freelancerName: string;
    amount: string;
    notes?: string;
    link?: string;
  } | null;
  onApproveAndRelease: (rating: number, review: string) => void;
  onRequestRevision: (reason: string) => void;
}

export const ReviewWorkModal: React.FC<ReviewWorkModalProps> = ({
  visible,
  onClose,
  contractInfo,
  onApproveAndRelease,
  onRequestRevision,
}) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [mode, setMode] = useState<"approve" | "revision">("approve");

  if (!contractInfo) return null;

  const handleAction = () => {
    if (mode === "approve") {
      if (!review.trim()) {
        Alert.alert("Review Required", "Please leave a short review rating for the freelancer.");
        return;
      }
      onApproveAndRelease(rating, review.trim());
    } else {
      if (!revisionReason.trim()) {
        Alert.alert("Reason Required", "Please describe what revision changes are required.");
        return;
      }
      onRequestRevision(revisionReason.trim());
    }

    setReview("");
    setRevisionReason("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Review Deliverable</Text>
              <Text style={styles.subtitle}>Freelancer: {contractInfo.freelancerName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <GlassCard style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{contractInfo.title}</Text>
              <Text style={styles.summaryAmount}>Escrow Amount: {contractInfo.amount}</Text>

              {contractInfo.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesHeader}>FREELANCER SUBMISSION NOTE:</Text>
                  <Text style={styles.notesText}>{contractInfo.notes}</Text>
                </View>
              )}

              {contractInfo.link && (
                <Text style={styles.linkText}>🔗 Link: {contractInfo.link}</Text>
              )}
            </GlassCard>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "approve" && styles.modeBtnApprove]}
                onPress={() => setMode("approve")}
              >
                <Text style={[styles.modeTxt, mode === "approve" && styles.modeTxtActive]}>
                  ✓ Approve & Release Funds
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, mode === "revision" && styles.modeBtnRevision]}
                onPress={() => setMode("revision")}
              >
                <Text style={[styles.modeTxt, mode === "revision" && styles.modeTxtActive]}>
                  ↺ Request Revision
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "approve" ? (
              <>
                <Text style={styles.label}>Rate Freelancer (1 - 5 Stars)</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starBtn}
                    >
                      <Text style={[styles.starIcon, rating >= star && styles.starIconActive]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Public Review Feedback *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Great communication, clean code, delivered ahead of deadline..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  value={review}
                  onChangeText={setReview}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Revision Instructions for Freelancer *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Specify code modifications, missing features, or test failures..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                  value={revisionReason}
                  onChangeText={setRevisionReason}
                />
              </>
            )}

            <View style={styles.btnRow}>
              <CustomButton title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
              <CustomButton
                title={mode === "approve" ? "Release Escrow Funds" : "Submit Revision Request"}
                onPress={handleAction}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0d1f17",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "#34d399", fontSize: 12, fontWeight: "700", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeTxt: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  scrollBody: { padding: 20 },
  summaryCard: { padding: 14, marginBottom: 16 },
  summaryTitle: { color: "#ffffff", fontWeight: "800", fontSize: 14 },
  summaryAmount: { color: "#34d399", fontWeight: "900", fontSize: 13, marginTop: 4 },
  notesBox: {
    marginTop: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 10,
    borderRadius: 8,
  },
  notesHeader: { color: "#94a3b8", fontSize: 10, fontWeight: "800" },
  notesText: { color: "#e2e8f0", fontSize: 12, marginTop: 4 },
  linkText: { color: "#38bdf8", fontSize: 12, marginTop: 8, fontWeight: "600" },
  modeToggle: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  modeBtnApprove: { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10b581" },
  modeBtnRevision: { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "#f59e0b" },
  modeTxt: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  modeTxtActive: { color: "#ffffff", fontWeight: "900" },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  starRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 28, color: "#475569" },
  starIconActive: { color: "#fbbf24" },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 10 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 16 },
});
