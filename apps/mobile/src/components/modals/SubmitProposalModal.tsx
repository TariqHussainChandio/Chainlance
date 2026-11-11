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
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";
import { useFees } from "../../hooks/useFees";
import { FREELANCER_FEE_PERCENTAGE, CLIENT_FEE_PERCENTAGE } from "@chainwork/shared";

interface SubmitProposalModalProps {
  visible: boolean;
  onClose: () => void;
  jobTitle?: string;
  defaultBudget?: string;
  onSubmitProposal: (proposal: {
    bidAmount: string;
    timeline: string;
    coverLetter: string;
    milestoneCount: string;
  }) => void;
}

export const SubmitProposalModal: React.FC<SubmitProposalModalProps> = ({
  visible,
  onClose,
  jobTitle = "Smart Contract DApp",
  defaultBudget = "$1,500",
  onSubmitProposal,
}) => {
  const [bidAmount, setBidAmount] = useState(defaultBudget.replace("$", ""));
  const [timeline, setTimeline] = useState("7 Days");
  const [coverLetter, setCoverLetter] = useState("");
  const [milestones, setMilestones] = useState("2");
  const [loading, setLoading] = useState(false);

  const { fee } = useFees(bidAmount);

  if (!visible) return null;

  const handleSubmit = () => {
    if (!bidAmount.trim() || !coverLetter.trim()) {
      Alert.alert("Missing Fields", "Please specify your bid amount and cover letter.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmitProposal({
        bidAmount: `$${bidAmount.trim()}`,
        timeline,
        coverLetter: coverLetter.trim(),
        milestoneCount: milestones,
      });
      setCoverLetter("");
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>PROPOSAL SUBMISSION</Text>
                <Text style={styles.title} numberOfLines={1}>
                  Pitch for: {jobTitle}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Bid Amount */}
              <Text style={styles.label}>Your Proposed Bid Amount (USD)</Text>
              <View style={styles.inputPrefixRow}>
                <Text style={styles.prefixTxt}>$</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="1500"
                  placeholderTextColor="#64748b"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Live Fee Breakdown */}
              {fee && (
                <View style={styles.feeBreakdown}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLbl}>Platform fee ({(FREELANCER_FEE_PERCENTAGE * 100).toFixed(0)}%)</Text>
                    <Text style={styles.feeVal}>−${fee.freelancerFee.toFixed(2)}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLbl}>Client pays ({(CLIENT_FEE_PERCENTAGE * 100).toFixed(0)}% fee)</Text>
                    <Text style={[styles.feeVal, { color: "#60a5fa" }]}>${fee.clientTotal.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.feeRow, styles.feeRowTotal]}>
                    <Text style={[styles.feeLbl, { color: "#34d399", fontWeight: "900" }]}>You earn</Text>
                    <Text style={[styles.feeVal, { color: "#34d399", fontSize: 15, fontWeight: "900" }]}>${fee.freelancerEarnings.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {/* Delivery Timeline */}
              <Text style={styles.label}>Estimated Delivery Timeline</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5 Days / 2 Weeks"
                placeholderTextColor="#64748b"
                value={timeline}
                onChangeText={setTimeline}
              />

              {/* Proposed Milestones */}
              <Text style={styles.label}>Number of Escrow Milestones</Text>
              <View style={styles.milestonePillRow}>
                {["1", "2", "3", "4"].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.mPill, milestones === m && styles.activeMPill]}
                    onPress={() => setMilestones(m)}
                  >
                    <Text style={[styles.mPillTxt, milestones === m && styles.activeMPillTxt]}>
                      {m} {m === "1" ? "Phase" : "Phases"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cover Letter */}
              <Text style={styles.label}>Cover Letter & Value Pitch</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Explain why you are the best fit for this project..."
                placeholderTextColor="#64748b"
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                numberOfLines={4}
              />

              {/* AI Guarantee Badge */}
              <View style={styles.guaranteeBadge}>
                <Text style={{ fontSize: 16 }}>🛡️</Text>
                <Text style={styles.guaranteeTxt}>
                  100% Guaranteed Escrow: Client funds are locked in smart contracts prior to commencement.
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.btnRow}>
                <CustomButton
                  title="Submit Proposal Pitch"
                  onPress={handleSubmit}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
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
    alignItems: "center",
    marginBottom: 16,
  },
  badgeTxt: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
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
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  inputPrefixRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingLeft: 14,
  },
  prefixTxt: {
    color: "#34d399",
    fontSize: 16,
    fontWeight: "900",
    marginRight: 4,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  milestonePillRow: {
    flexDirection: "row",
    gap: 8,
  },
  mPill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeMPill: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b581",
  },
  mPillTxt: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  activeMPillTxt: {
    color: "#ffffff",
    fontWeight: "900",
  },
  guaranteeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 12,
    padding: 10,
    gap: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  guaranteeTxt: {
    flex: 1,
    color: "#34d399",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  btnRow: {
    marginTop: 10,
    marginBottom: 20,
  },
  feeBreakdown: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 4,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeRowTotal: {
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.2)",
    marginTop: 4,
    paddingTop: 6,
  },
  feeLbl: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  feeVal: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
});
