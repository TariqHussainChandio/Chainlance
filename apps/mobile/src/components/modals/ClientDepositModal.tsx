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
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";

interface ClientDepositModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmDeposit: (amount: string) => void;
}

export const ClientDepositModal: React.FC<ClientDepositModalProps> = ({
  visible,
  onClose,
  onConfirmDeposit,
}) => {
  const { colors, theme } = useTheme();

  const [depositAmount, setDepositAmount] = useState("500.00");
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleDeposit = () => {
    const numericAmt = parseFloat(depositAmount.replace("$", "").replace(",", ""));
    if (isNaN(numericAmt) || numericAmt < 10) {
      Alert.alert("Invalid Amount", "Minimum escrow deposit requirement is $10.00 USD.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConfirmDeposit(`$${numericAmt.toFixed(2)}`);
      onClose();
      Alert.alert(
        "Escrow Funds Deposited! 💳",
        `$${numericAmt.toFixed(2)} added to your client wallet via 256-bit Stripe encryption.`
      );
    }, 500);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>STRIPE 256-BIT ENCRYPTION</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Add Escrow Funds</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Fund Client Wallet for Milestone Hiring</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Deposit Amount Input */}
              <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>DEPOSIT AMOUNT ($ USD)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  placeholder="500.00"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                />
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 4 }}>
                  Minimum deposit: $10.00 USD
                </Text>
              </GlassCard>

              {/* Stripe Credit Card Form */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>CARD DETAILS</Text>
              <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Card Number</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  placeholder="•••• •••• •••• 4242"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry (MM/YY)</Text>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                      placeholder="12/28"
                      placeholderTextColor="#64748b"
                      value={expiry}
                      onChangeText={setExpiry}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>CVC</Text>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                      placeholder="123"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      secureTextEntry
                      value={cvc}
                      onChangeText={setCvc}
                    />
                  </View>
                </View>
              </GlassCard>

              {/* Notice Banner */}
              <GlassCard variant="azure" style={{ padding: 12, marginBottom: 16 }}>
                <Text style={{ color: "#38bdf8", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>🛡️ SECURE SMART CONTRACT ESCROW</Text>
                <Text style={[styles.noticeTxt, { color: colors.textSecondary }]}>
                  Funds deposited remain securely locked in smart contract escrow until you review and approve completed milestones.
                </Text>
              </GlassCard>

              <CustomButton
                title="Deposit & Lock Escrow 💳"
                onPress={handleDeposit}
                loading={loading}
                style={{ marginBottom: 20 }}
              />
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  noticeTxt: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});
