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

interface ArbitrateDisputeModalProps {
  visible: boolean;
  onClose: () => void;
  disputeInfo: {
    id: string;
    clientName: string;
    freelancerName: string;
    amount: string;
    reason: string;
    evidence: string;
  } | null;
  onResolveDispute: (disputeId: string, outcome: string, notes: string) => void;
}

export const ArbitrateDisputeModal: React.FC<ArbitrateDisputeModalProps> = ({
  visible,
  onClose,
  disputeInfo,
  onResolveDispute,
}) => {
  const [outcome, setOutcome] = useState<"freelancer" | "client" | "split">("freelancer");
  const [notes, setNotes] = useState("");

  if (!disputeInfo) return null;

  const handleResolve = () => {
    if (!notes.trim()) {
      Alert.alert("Reason Required", "Please enter arbitration resolution notes.");
      return;
    }

    let resultText = "100% Escrow Released to Freelancer";
    if (outcome === "client") resultText = "100% Escrow Refunded to Client";
    if (outcome === "split") resultText = "50% / 50% Escrow Split";

    onResolveDispute(disputeInfo.id, resultText, notes.trim());
    setNotes("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Arbitrate Contract Dispute</Text>
              <Text style={styles.subtitle}>Dispute Case ID: #{disputeInfo.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <GlassCard style={styles.disputeSummary}>
              <View style={styles.rowBetween}>
                <Text style={styles.partyTxt}>Client: {disputeInfo.clientName}</Text>
                <Text style={styles.partyTxt}>Freelancer: {disputeInfo.freelancerName}</Text>
              </View>
              <Text style={styles.amountTxt}>Disputed Escrow Amount: {disputeInfo.amount}</Text>

              <View style={styles.evidenceBox}>
                <Text style={styles.boxLabel}>DISPUTE REASON & CLAIM:</Text>
                <Text style={styles.boxText}>{disputeInfo.reason}</Text>

                <Text style={[styles.boxLabel, { marginTop: 8 }]}>SUBMITTED EVIDENCE:</Text>
                <Text style={styles.boxText}>{disputeInfo.evidence}</Text>
              </View>
            </GlassCard>

            <Text style={styles.label}>Arbitration Settlement Ruling</Text>
            <View style={styles.outcomeCol}>
              <TouchableOpacity
                style={[styles.outcomeOption, outcome === "freelancer" && styles.outcomeOptionActive]}
                onPress={() => setOutcome("freelancer")}
              >
                <Text style={styles.optionTitle}>Release 100% to Freelancer</Text>
                <Text style={styles.optionSub}>Deliverables satisfy contractual scope</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outcomeOption, outcome === "client" && styles.outcomeOptionActive]}
                onPress={() => setOutcome("client")}
              >
                <Text style={styles.optionTitle}>Refund 100% to Client</Text>
                <Text style={styles.optionSub}>Work non-compliant or abandoned</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outcomeOption, outcome === "split" && styles.outcomeOptionActive]}
                onPress={() => setOutcome("split")}
              >
                <Text style={styles.optionTitle}>50% / 50% Equal Split</Text>
                <Text style={styles.optionSub}>Partial milestone progress recognized</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Official Ruling Notes & Explanation *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="State rationale based on code review, audit findings, and communication history..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.btnRow}>
              <CustomButton title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
              <CustomButton
                title="Execute Binding Ruling"
                onPress={handleResolve}
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
  subtitle: { color: "#ef4444", fontSize: 12, fontWeight: "700", marginTop: 2 },
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
  disputeSummary: { padding: 14, marginBottom: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  partyTxt: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  amountTxt: { color: "#ef4444", fontSize: 14, fontWeight: "900", marginTop: 6 },
  evidenceBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  boxLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: "800" },
  boxText: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  outcomeCol: { gap: 8, marginBottom: 12 },
  outcomeOption: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  outcomeOptionActive: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#ef4444",
  },
  optionTitle: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  optionSub: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
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
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 14 },
});
