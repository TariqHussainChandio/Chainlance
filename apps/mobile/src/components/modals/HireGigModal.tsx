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

interface HireGigModalProps {
  visible: boolean;
  onClose: () => void;
  targetInfo: {
    title: string;
    freelancerName: string;
    price: string;
  } | null;
  onConfirmHire: (contract: {
    title: string;
    freelancerName: string;
    amount: string;
    requirements: string;
  }) => void;
}

export const HireGigModal: React.FC<HireGigModalProps> = ({
  visible,
  onClose,
  targetInfo,
  onConfirmHire,
}) => {
  const [amount, setAmount] = useState("");
  const [requirements, setRequirements] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"usdt" | "usdc" | "eth">("usdt");

  if (!targetInfo) return null;

  const handleHire = () => {
    const finalAmount = amount || targetInfo.price.replace("$", "");
    if (!finalAmount || !requirements.trim()) {
      Alert.alert("Missing Requirements", "Please specify the requirements note for the freelancer.");
      return;
    }

    onConfirmHire({
      title: targetInfo.title,
      freelancerName: targetInfo.freelancerName,
      amount: `$${finalAmount}`,
      requirements: requirements.trim(),
    });

    setRequirements("");
    setAmount("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Hire & Deposit to Escrow</Text>
              <Text style={styles.subtitle}>Freelancer: {targetInfo.freelancerName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <GlassCard style={styles.serviceSummary}>
              <Text style={styles.serviceLabel}>SELECTED SERVICE / PROJECT</Text>
              <Text style={styles.serviceTitle}>{targetInfo.title}</Text>
              <View style={styles.priceBadgeRow}>
                <Text style={styles.priceBadgeTxt}>Base Price: {targetInfo.price}</Text>
              </View>
            </GlassCard>

            <Text style={styles.label}>Agreed Contract Amount (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder={targetInfo.price.replace("$", "")}
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Select Escrow Funding Asset</Text>
            <View style={styles.tokenRow}>
              {(["usdt", "usdc", "eth"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tokenBtn, paymentMethod === t && styles.tokenBtnActive]}
                  onPress={() => setPaymentMethod(t)}
                >
                  <Text style={[styles.tokenTxt, paymentMethod === t && styles.tokenTxtActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Project Deliverable Requirements & Specs *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide repository link, design files, or specific acceptance criteria..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={requirements}
              onChangeText={setRequirements}
            />

            <GlassCard style={styles.escrowNotice}>
              <Text style={styles.escrowTitle}>🛡️ Smart Contract Escrow Lock</Text>
              <Text style={styles.escrowBody}>
                Funds are securely held in multi-sig escrow. The freelancer will only receive payment after you inspect and approve the submitted work.
              </Text>
            </GlassCard>

            <View style={styles.btnRow}>
              <CustomButton title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
              <CustomButton
                title="Fund Escrow & Send Contract"
                onPress={handleHire}
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
  serviceSummary: { padding: 14, marginBottom: 16, backgroundColor: "rgba(16, 185, 129, 0.08)" },
  serviceLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  serviceTitle: { color: "#ffffff", fontSize: 15, fontWeight: "800", marginTop: 4 },
  priceBadgeRow: { marginTop: 8 },
  priceBadgeTxt: { color: "#34d399", fontWeight: "900", fontSize: 13 },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 10 },
  tokenRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  tokenBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tokenBtnActive: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    borderColor: "#0ea5e9",
  },
  tokenTxt: { color: "#94a3b8", fontWeight: "700", fontSize: 12 },
  tokenTxtActive: { color: "#38bdf8", fontWeight: "900" },
  escrowNotice: { padding: 14, marginVertical: 14 },
  escrowTitle: { color: "#38bdf8", fontWeight: "800", fontSize: 13 },
  escrowBody: { color: "#94a3b8", fontSize: 11, marginTop: 4, lineHeight: 16 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
});
