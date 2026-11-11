import React, { useState, useEffect } from "react";
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

export interface MilestoneItem {
  id: string;
  description: string;
  amount: string;
  deadlineDays: number;
  status: "pending" | "in_progress" | "delivered" | "completed" | "disputed";
  deliverableUrl?: string;
  deliverableNote?: string;
}

export interface ContractData {
  id: string;
  title: string;
  clientName: string;
  totalAmount: string;
  status: "active" | "delivered" | "completed" | "disputed" | "cancelled";
  createdAt: string;
  milestones: MilestoneItem[];
}

interface ContractDetailModalProps {
  visible: boolean;
  onClose: () => void;
  contract?: ContractData | null;
  onSubmitDeliverable?: (contractId: string, milestoneId: string, url: string, note: string) => void;
  onDisputeTrigger?: (contractId: string, reason: string) => void;
  onOpenChat?: (contractId: string, contractTitle: string) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  visible,
  onClose,
  contract,
  onSubmitDeliverable,
  onDisputeTrigger,
  onOpenChat,
}) => {
  const { colors, theme } = useTheme();

  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableNote, setDeliverableNote] = useState("");
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState("03d 14h 22m");

  if (!visible || !contract) return null;

  const handleWorkSubmit = () => {
    if (!deliverableUrl.trim()) {
      Alert.alert("Missing URL", "Please provide a valid deliverable repository or IPFS URL.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSubmitDeliverable && selectedMilestone) {
        onSubmitDeliverable(contract.id, selectedMilestone.id, deliverableUrl.trim(), deliverableNote.trim());
      }
      setShowSubmissionForm(false);
      setDeliverableUrl("");
      setDeliverableNote("");
      Alert.alert("Deliverable Submitted 🚀", "Milestone work sent to client for review and 72-hour clearance.");
    }, 400);
  };

  const handleDisputeSubmit = () => {
    if (!disputeReason.trim()) {
      Alert.alert("Missing Reason", "Please provide a clear dispute arbitration reason.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onDisputeTrigger) {
        onDisputeTrigger(contract.id, disputeReason.trim());
      }
      setShowDisputeForm(false);
      setDisputeReason("");
      Alert.alert("Dispute Escalated ⚖️", "Contract evidence submitted to Admin Arbitration SLA.");
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
                <Text style={styles.badgeTxt}>{contract.id} • CONTRACT DETAILS</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{contract.title}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Client: {contract.clientName}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Delivery Countdown Timer */}
              <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
                <View style={styles.timerRow}>
                  <View>
                    <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>DELIVERY DEADLINE TIMER</Text>
                    <Text style={[styles.timerValue, { color: colors.textPrimary }]}>⏱️ {timeLeft}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "800" }}>TOTAL ESCROW</Text>
                    <Text style={[styles.totalAmount, { color: colors.accentEmerald }]}>{contract.totalAmount}</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Milestone Progress Tracker */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>MILESTONE PROGRESS TRACKER</Text>

              {contract.milestones.map((ms, idx) => (
                <GlassCard key={ms.id} style={{ marginBottom: 10, padding: 12 }}>
                  <View style={styles.msRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.msTitle, { color: colors.textPrimary }]}>
                        Milestone {idx + 1}: {ms.description}
                      </Text>
                      <Text style={[styles.msDeadline, { color: colors.textMuted }]}>
                        Deadline: {ms.deadlineDays} Days • {ms.amount}
                      </Text>
                    </View>
                    <StatusBadge
                      status={ms.status === "completed" ? "active" : ms.status === "delivered" ? "pending" : "pending"}
                      text={ms.status.toUpperCase()}
                    />
                  </View>

                  {ms.status !== "completed" && (
                    <TouchableOpacity
                      style={styles.submitWorkPill}
                      onPress={() => {
                        setSelectedMilestone(ms);
                        setShowSubmissionForm(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.submitWorkPillTxt}>Submit Milestone Work ➔</Text>
                    </TouchableOpacity>
                  )}
                </GlassCard>
              ))}

              {/* Deliverable Work Submission Form */}
              {showSubmissionForm && selectedMilestone && (
                <GlassCard style={{ padding: 14, marginTop: 8, marginBottom: 14 }}>
                  <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
                    Submit Deliverable for Milestone
                  </Text>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Repository / IPFS Deliverable URL</Text>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    placeholder="https://github.com/org/repo or ipfs://..."
                    placeholderTextColor="#64748b"
                    value={deliverableUrl}
                    onChangeText={setDeliverableUrl}
                  />

                  <Text style={[styles.label, { color: colors.textSecondary }]}>Deliverable Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    placeholder="Describe completed features, test coverage..."
                    placeholderTextColor="#64748b"
                    value={deliverableNote}
                    onChangeText={setDeliverableNote}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.btnRow}>
                    <CustomButton
                      title="Submit Work"
                      onPress={handleWorkSubmit}
                      loading={loading}
                      style={{ flex: 1 }}
                    />
                    <CustomButton
                      title="Cancel"
                      variant="outline"
                      onPress={() => setShowSubmissionForm(false)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </GlassCard>
              )}

              {/* Dispute Resolution Trigger Form */}
              {showDisputeForm ? (
                <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                  <Text style={[styles.formTitle, { color: "#ef4444" }]}>Initiate Dispute Arbitration</Text>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Reason & Evidence</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                    placeholder="Describe why arbitration is requested..."
                    placeholderTextColor="#64748b"
                    value={disputeReason}
                    onChangeText={setDisputeReason}
                    multiline
                    numberOfLines={3}
                  />
                  <View style={styles.btnRow}>
                    <CustomButton
                      title="Escalate to Admin"
                      variant="danger"
                      onPress={handleDisputeSubmit}
                      loading={loading}
                      style={{ flex: 1 }}
                    />
                    <CustomButton
                      title="Cancel"
                      variant="outline"
                      onPress={() => setShowDisputeForm(false)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </GlassCard>
              ) : (
                <TouchableOpacity
                  style={styles.disputeTriggerBtn}
                  onPress={() => setShowDisputeForm(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.disputeTriggerTxt}>⚠️ Request Dispute Arbitration SLA</Text>
                </TouchableOpacity>
              )}

              {/* Contract Chat Link */}
              {onOpenChat && contract && (
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => {
                    onClose();
                    onOpenChat(contract.id, contract.title);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chatBtnTxt}>💬 Open Contract Chat</Text>
                </TouchableOpacity>
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
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  msRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  msTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  msDeadline: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  submitWorkPill: {
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    borderColor: "#10b581",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitWorkPillTxt: {
    color: "#10b581",
    fontSize: 11,
    fontWeight: "900",
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: "600",
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  disputeTriggerBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  disputeTriggerTxt: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "900",
  },
  chatBtn: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "rgba(59, 130, 246, 0.35)",
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  chatBtnTxt: {
    color: "#60a5fa",
    fontSize: 12,
    fontWeight: "900",
  },
});
