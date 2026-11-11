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

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  availableBalance: string;
  onConfirmWithdraw: (amount: string, method: string, destination: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  onClose,
  availableBalance,
  onConfirmWithdraw,
}) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"crypto" | "bank">("crypto");
  const [destination, setDestination] = useState("");

  const handleWithdraw = () => {
    if (!amount.trim() || !destination.trim()) {
      Alert.alert("Missing Fields", "Please specify withdrawal amount and payout address/account.");
      return;
    }

    onConfirmWithdraw(
      amount.startsWith("$") ? amount : `$${amount}`,
      method === "crypto" ? "USDT (BEP-20 / ERC-20)" : "Direct Bank Wire",
      destination.trim()
    );

    setAmount("");
    setDestination("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Withdraw Payout</Text>
              <Text style={styles.subtitle}>Available Balance: {availableBalance}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <GlassCard style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>AVAILABLE FOR INSTANT CASHOUT</Text>
              <Text style={styles.balanceVal}>{availableBalance}</Text>
            </GlassCard>

            <Text style={styles.label}>Withdrawal Method</Text>
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[styles.methodBtn, method === "crypto" && styles.methodBtnActive]}
                onPress={() => setMethod("crypto")}
              >
                <Text style={[styles.methodTxt, method === "crypto" && styles.methodTxtActive]}>
                  🌐 Crypto Wallet (USDT / USDC)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodBtn, method === "bank" && styles.methodBtnActive]}
                onPress={() => setMethod("bank")}
              >
                <Text style={[styles.methodTxt, method === "bank" && styles.methodTxtActive]}>
                  🏦 Bank Account Transfer
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Withdrawal Amount (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>
              {method === "crypto" ? "Wallet Address (0x... or BNB)" : "Bank IBAN / Account Number"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={method === "crypto" ? "0x71C...392A" : "PK36MEZN0000..."}
              placeholderTextColor="#64748b"
              value={destination}
              onChangeText={setDestination}
            />

            <View style={styles.btnRow}>
              <CustomButton title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
              <CustomButton title="Confirm Withdrawal" onPress={handleWithdraw} style={{ flex: 2 }} />
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
    maxHeight: "85%",
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
  balanceCard: { padding: 14, marginBottom: 16, backgroundColor: "rgba(16, 185, 129, 0.1)" },
  balanceLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "800" },
  balanceVal: { color: "#34d399", fontSize: 22, fontWeight: "900", marginTop: 4 },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  methodRow: { gap: 8, marginBottom: 8 },
  methodBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  methodBtnActive: { backgroundColor: "rgba(14, 165, 233, 0.15)", borderColor: "#0ea5e9" },
  methodTxt: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  methodTxtActive: { color: "#38bdf8", fontWeight: "900" },
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
  btnRow: { flexDirection: "row", gap: 12, marginTop: 16 },
});
