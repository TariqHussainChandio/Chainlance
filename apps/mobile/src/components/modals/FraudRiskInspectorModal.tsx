import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";

export interface FraudSignal {
  name: string;
  weight: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface FraudRiskInspectorModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  riskScore?: number;
  signals?: FraudSignal[];
  onToggleBan?: (userEmail: string, currentStatus: string) => void;
}

export const FraudRiskInspectorModal: React.FC<FraudRiskInspectorModalProps> = ({
  visible,
  onClose,
  userEmail = "suspicious_user@temp-mail.org",
  userName = "CryptoScout99",
  riskScore = 84,
  signals = [
    { name: "IP Velocity & Proxy Check", weight: "20%", status: "fail", detail: "5 distinct IP countries detected in 10 minutes." },
    { name: "Multi-Account Fingerprint", weight: "15%", status: "warn", detail: "Device canvas hash matches 2 banned accounts." },
    { name: "Rapid Job Posting Rate", weight: "15%", status: "fail", detail: "8 identical jobs created in 120 seconds." },
    { name: "Payment Method Anomaly", weight: "15%", status: "pass", detail: "Unflagged Web3 wallet signature verified." },
    { name: "Dispute History Ratio", weight: "10%", status: "warn", detail: "3 open disputes out of 4 total contracts." },
    { name: "KYC Document Verification", weight: "10%", status: "pass", detail: "Passport document facial match validated." },
    { name: "Review Score Consistency", weight: "10%", status: "pass", detail: "Client rating 4.8 stars across 12 projects." },
    { name: "Suspension Risk Level", weight: "5%", status: "fail", detail: "Account flagged for high arbitration risk." },
  ],
  onToggleBan,
}) => {
  if (!visible) return null;

  const isHighRisk = riskScore >= 70;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>AI RISK INSPECTOR</Text>
                <Text style={styles.title}>{userName}</Text>
                <Text style={styles.subtitle}>{userEmail}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Score Metric Card */}
              <View style={[styles.scoreBox, isHighRisk ? styles.highRiskBox : styles.lowRiskBox]}>
                <View>
                  <Text style={styles.scoreLbl}>COMPOSITE RISK SCORE</Text>
                  <Text style={[styles.scoreVal, { color: isHighRisk ? "#ef4444" : "#34d399" }]}>
                    {riskScore} / 100
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isHighRisk ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)" }]}>
                  <Text style={[styles.statusTxt, { color: isHighRisk ? "#f87171" : "#34d399" }]}>
                    {isHighRisk ? "HIGH RISK ALERT" : "LOW RISK VERIFIED"}
                  </Text>
                </View>
              </View>

              {/* 8 Security Signals */}
              <Text style={styles.sectionHeader}>WEIGHTED SECURITY SIGNALS</Text>
              {signals.map((sig, idx) => (
                <View key={idx} style={styles.signalRow}>
                  <View style={styles.signalHeader}>
                    <Text style={styles.signalName}>{sig.name}</Text>
                    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                      <Text style={styles.signalWeight}>{sig.weight}</Text>
                      <View
                        style={[
                          styles.dot,
                          sig.status === "fail"
                            ? styles.failDot
                            : sig.status === "warn"
                            ? styles.warnDot
                            : styles.passDot,
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.signalDetail}>{sig.detail}</Text>
                </View>
              ))}

              {/* Actions */}
              <View style={styles.actionRow}>
                {onToggleBan && (
                  <CustomButton
                    title={isHighRisk ? "Ban Account Access" : "Flag for Audit"}
                    variant={isHighRisk ? "danger" : "outline"}
                    onPress={() => {
                      onToggleBan(userEmail, isHighRisk ? "active" : "banned");
                      onClose();
                    }}
                    style={{ flex: 1 }}
                  />
                )}
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
    color: "#ef4444",
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
  scoreBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  highRiskBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  lowRiskBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  scoreLbl: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scoreVal: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: "900",
  },
  sectionHeader: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  signalRow: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    marginBottom: 8,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  signalName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  signalWeight: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  signalDetail: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  failDot: { backgroundColor: "#ef4444" },
  warnDot: { backgroundColor: "#f59e0b" },
  passDot: { backgroundColor: "#10b581" },
  actionRow: {
    marginTop: 14,
    marginBottom: 20,
  },
});
