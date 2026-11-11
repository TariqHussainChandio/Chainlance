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

interface ArbitrationModalProps {
  visible: boolean;
  onClose: () => void;
  disputeId?: string;
  contractTitle?: string;
  clientName?: string;
  freelancerName?: string;
  escrowAmount?: string;
  onResolveDispute: (decision: "release_freelancer" | "refund_client", notes: string) => void;
}

export const ArbitrationModal: React.FC<ArbitrationModalProps> = ({
  visible,
  onClose,
  disputeId = "DISPUTE-802",
  contractTitle = "Solidity Staking Contract & Audit",
  clientName = "TechCorp Labs",
  freelancerName = "Alex Rivera",
  escrowAmount = "$2,500.00",
  onResolveDispute,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleResolve = (decision: "release_freelancer" | "refund_client") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onResolveDispute(decision, notes.trim());
      setNotes("");
      onClose();
      Alert.alert(
        "Dispute Resolved ⚖️",
        decision === "release_freelancer"
          ? `Escrow of ${escrowAmount} released to ${freelancerName}.`
          : `Escrow of ${escrowAmount} refunded to ${clientName}.`
      );
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
                <Text style={styles.badgeTxt}>ADMIN DISPUTE ARBITRATION</Text>
                <Text style={styles.title}>{disputeId}</Text>
                <Text style={styles.subtitle}>{contractTitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Escrow Details */}
              <View style={styles.escrowCard}>
                <Text style={styles.escrowLbl}>LOCKED ESCROW AMOUNT</Text>
                <Text style={styles.escrowVal}>{escrowAmount}</Text>

                <View style={styles.partiesRow}>
                  <View style={styles.partyBox}>
                    <Text style={styles.partyRole}>CLIENT</Text>
                    <Text style={styles.partyName}>{clientName}</Text>
                  </View>
                  <Text style={styles.vsTxt}>VS</Text>
                  <View style={styles.partyBox}>
                    <Text style={styles.partyRole}>FREELANCER</Text>
                    <Text style={styles.partyName}>{freelancerName}</Text>
                  </View>
                </View>
              </View>

              {/* Evidence Review */}
              <Text style={styles.sectionHeader}>EVIDENCE & DELIVERABLES REVIEW</Text>
              <View style={styles.evidenceCard}>
                <Text style={styles.evidenceTitle}>Milestone 1 Deliverable</Text>
                <Text style={styles.evidenceText}>
                  Freelancer submitted Github PR #14 containing completed Staking contract code & audit report. Client claims test coverage fell below 95%.
                </Text>
              </View>

              {/* Arbitration Notes */}
              <Text style={styles.label}>Arbitration Finding Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter official arbitration decision rationale..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              {/* Decision Buttons */}
              <View style={styles.btnCol}>
                <CustomButton
                  title={`Release Escrow to Freelancer (${freelancerName})`}
                  onPress={() => handleResolve("release_freelancer")}
                  loading={loading}
                  style={{ backgroundColor: "#10b581" }}
                />

                <CustomButton
                  title={`Refund Escrow to Client (${clientName})`}
                  variant="outline"
                  onPress={() => handleResolve("refund_client")}
                  loading={loading}
                  style={{ borderColor: "#ef4444" }}
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
    maxHeight: "92%",
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
    color: "#c084fc",
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
  subtitle: {
    color: "#94a3b8",
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
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  escrowCard: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  escrowLbl: {
    color: "#c084fc",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  escrowVal: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
    marginBottom: 10,
  },
  partiesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  partyBox: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  partyRole: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "800",
  },
  partyName: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  vsTxt: {
    color: "#c084fc",
    fontWeight: "900",
    fontSize: 12,
  },
  sectionHeader: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  evidenceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 12,
  },
  evidenceTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  evidenceText: {
    color: "#cbd5e1",
    fontSize: 11,
    lineHeight: 16,
  },
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
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
    height: 70,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  btnCol: {
    gap: 10,
    marginTop: 14,
    marginBottom: 20,
  },
});
