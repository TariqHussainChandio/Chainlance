import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
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

export interface ClientProposalApplicant {
  id: string;
  freelancerName: string;
  freelancerAvatar?: string;
  freelancerRating: string;
  jobTitle: string;
  bidAmount: string;
  timeline: string;
  submittedDate: string;
  status: "pending" | "accepted" | "rejected";
  coverLetter: string;
  milestones?: { description: string; amount: string; days: number }[];
}

interface ClientHireModalProps {
  visible: boolean;
  onClose: () => void;
  proposal?: ClientProposalApplicant | null;
  onAcceptHire?: (proposalId: string, freelancerName: string, amount: string) => void;
  onDeclineProposal?: (proposalId: string) => void;
}

export const ClientHireModal: React.FC<ClientHireModalProps> = ({
  visible,
  onClose,
  proposal,
  onAcceptHire,
  onDeclineProposal,
}) => {
  const { colors, theme } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!visible || !proposal) return null;

  const handleHire = () => {
    Alert.alert(
      "Accept & Hire Freelancer?",
      `Fund escrow and create active contract with ${proposal.freelancerName} for ${proposal.bidAmount}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Fund & Hire Freelancer ⚡",
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              if (onAcceptHire) {
                onAcceptHire(proposal.id, proposal.freelancerName, proposal.bidAmount);
              }
              onClose();
              Alert.alert(
                "Freelancer Hired! 🎉",
                `Contract initialized with ${proposal.freelancerName}. Escrow funds locked in smart contract.`
              );
            }, 400);
          },
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert("Decline Proposal?", "Mark this applicant proposal as rejected?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => {
          if (onDeclineProposal) {
            onDeclineProposal(proposal.id);
          }
          onClose();
          Alert.alert("Proposal Declined", "Applicant notified of application decision.");
        },
      },
    ]);
  };

  const milestones = proposal.milestones || [
    { description: "Phase 1: Architecture & Core Implementation", amount: proposal.bidAmount, days: 5 },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>{proposal.id} • APPLICANT PROPOSAL</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{proposal.jobTitle}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Freelancer: {proposal.freelancerName} • ★ {proposal.freelancerRating}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Summary Rate Banner */}
              <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>PROPOSED BID AMOUNT</Text>
                    <Text style={[styles.bidAmount, { color: colors.textPrimary }]}>{proposal.bidAmount}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <StatusBadge
                      status={proposal.status === "accepted" ? "active" : proposal.status === "rejected" ? "danger" : "pending"}
                      text={proposal.status.toUpperCase()}
                    />
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "700", marginTop: 4 }}>
                      Timeline: {proposal.timeline}
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Cover Letter */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PROPOSAL COVER LETTER</Text>
              <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                <Text style={[styles.coverText, { color: colors.textSecondary }]}>
                  {proposal.coverLetter}
                </Text>
              </GlassCard>

              {/* Milestones Breakdown */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>PROPOSED MILESTONES</Text>
              {milestones.map((ms, idx) => (
                <GlassCard key={idx} style={{ padding: 12, marginBottom: 8 }}>
                  <View style={styles.msRow}>
                    <Text style={[styles.msTitle, { color: colors.textPrimary }]}>{ms.description}</Text>
                    <Text style={[styles.msAmount, { color: colors.accentEmerald }]}>{ms.amount}</Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 2 }}>
                    Delivery Target: {ms.days} Days
                  </Text>
                </GlassCard>
              ))}

              {/* Action Buttons */}
              {proposal.status === "pending" && (
                <View style={styles.actionRow}>
                  <CustomButton
                    title="Accept & Hire Freelancer ⚡"
                    onPress={handleHire}
                    loading={loading}
                    style={{ flex: 2 }}
                  />
                  <CustomButton
                    title="Decline"
                    variant="danger"
                    onPress={handleDecline}
                    style={{ flex: 1 }}
                  />
                </View>
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
  bidAmount: {
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
  coverText: {
    fontSize: 13,
    lineHeight: 19,
  },
  msRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  msTitle: {
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
    marginRight: 8,
  },
  msAmount: {
    fontSize: 13,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
});
