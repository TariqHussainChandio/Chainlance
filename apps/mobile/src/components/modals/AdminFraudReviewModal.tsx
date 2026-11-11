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

import type { FraudSignal } from "@chainwork/shared";

export interface FraudAlertItem {
  id: string;
  userName: string;
  userEmail: string;
  riskScore: number;
  detectedPattern: string;
  status: "open" | "reviewed" | "confirmed" | "dismissed";
  timestamp: string;
  signals?: FraudSignal[];
}

interface AdminFraudReviewModalProps {
  visible: boolean;
  onClose: () => void;
  alertItem?: FraudAlertItem | null;
  onConfirmRestrict?: (alertId: string) => void;
  onDismissAlert?: (alertId: string) => void;
}

export const AdminFraudReviewModal: React.FC<AdminFraudReviewModalProps> = ({
  visible,
  onClose,
  alertItem,
  onConfirmRestrict,
  onDismissAlert,
}) => {
  const { colors, theme } = useTheme();

  if (!visible || !alertItem) return null;

  const handleRestrict = () => {
    Alert.alert(
      "Confirm Account Restriction?",
      `Set risk score to 100 and restrict platform access for ${alertItem.userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restrict Account 🚫",
          style: "destructive",
          onPress: () => {
            if (onConfirmRestrict) {
              onConfirmRestrict(alertItem.id);
            }
            onClose();
            Alert.alert("Account Restricted 🚫", `User ${alertItem.userName} restricted.`);
          },
        },
      ]
    );
  };

  const handleDismiss = () => {
    if (onDismissAlert) {
      onDismissAlert(alertItem.id);
    }
    onClose();
    Alert.alert("Alert Dismissed", "Fraud risk flag marked as false positive.");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>{alertItem.id} • AI FRAUD SCANNED</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{alertItem.userName}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>{alertItem.userEmail}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Score Gauge Hero Card */}
              <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreGaugeCircle}>
                    <Text style={styles.gaugeScoreTxt}>{alertItem.riskScore}</Text>
                    <Text style={{ color: "#ffffff", fontSize: 8, fontWeight: "900" }}>/ 100</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>AUTOMATED AI RISK GAUGING</Text>
                    <Text style={[styles.riskLevelTitle, { color: alertItem.riskScore >= 75 ? "#ef4444" : colors.textPrimary }]}>
                      {alertItem.riskScore >= 75 ? "CRITICAL HIGH RISK" : "MEDIUM ELEVATED RISK"}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                      Scanned: {alertItem.timestamp}
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Detected Heuristic Patterns */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>DETECTED HEURISTIC PATTERNS</Text>
              <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                <View style={styles.patternItem}>
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={[styles.patternTxt, { color: colors.textPrimary }]}>{alertItem.detectedPattern}</Text>
                </View>
                <View style={[styles.patternItem, { marginTop: 8 }]}>
                  <Text style={{ fontSize: 14 }}>🌐</Text>
                  <Text style={[styles.patternTxt, { color: colors.textPrimary }]}>Multiple IP Geolocation Switches in 2 Hours</Text>
                </View>
              </GlassCard>

              {/* Signal Breakdown (shown when computed by fraud engine) */}
              {alertItem.signals && alertItem.signals.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SIGNAL BREAKDOWN</Text>
                  <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                    {alertItem.signals.filter((s) => s.weight > 0).map((sig) => (
                      <View key={sig.name} style={styles.signalRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: sig.detected ? "#ef4444" : colors.textMuted, fontSize: 11, fontWeight: "800" }}>
                            {sig.detected ? "🔴" : "🟢"} {sig.name.replace(/_/g, " ")}
                          </Text>
                          {sig.description && (
                            <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "600", marginTop: 2 }}>
                              {sig.description}
                            </Text>
                          )}
                        </View>
                        <View style={styles.signalBar}>
                          <View style={[styles.signalFill, { width: `${Math.round(sig.value * 100)}%`, backgroundColor: sig.detected ? "#ef4444" : "#10b981" }]} />
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900", width: 32, textAlign: "right" }}>
                          {Math.round(sig.value * 100)}
                        </Text>
                      </View>
                    ))}
                  </GlassCard>
                </>
              )}

              {/* Action Buttons */}
              {alertItem.status === "open" && (
                <View style={styles.actionRow}>
                  <CustomButton
                    title="Restrict Account 🚫"
                    variant="danger"
                    onPress={handleRestrict}
                    style={{ flex: 1 }}
                  />
                  <CustomButton
                    title="Dismiss Alert"
                    variant="outline"
                    onPress={handleDismiss}
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
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  scoreGaugeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  gaugeScoreTxt: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  riskLevelTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  patternItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  patternTxt: {
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  signalBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  signalFill: {
    height: "100%",
    borderRadius: 3,
  },
});
