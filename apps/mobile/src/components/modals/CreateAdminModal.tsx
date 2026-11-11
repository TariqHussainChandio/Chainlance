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

interface CreateAdminModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateAdmin: (name: string, email: string, level: "super_admin" | "support_admin") => void;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  visible,
  onClose,
  onCreateAdmin,
}) => {
  const { colors, theme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminLevel, setAdminLevel] = useState<"super_admin" | "support_admin">("support_admin");
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleCreate = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter name, email, and temporary password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onCreateAdmin(name.trim(), email.trim(), adminLevel);
      onClose();
      Alert.alert(
        "Admin Account Created 🛡️",
        `Onboarded ${name.trim()} as a verified ${adminLevel.toUpperCase()}.`
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
                <Text style={styles.badgeTxt}>SUPER ADMIN PRIVILEGES</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Create Admin Account</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Onboard New System Administrator</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Privilege Selection Cards */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>SELECT PRIVILEGE LEVEL</Text>
              <View style={styles.levelRow}>
                <TouchableOpacity
                  style={[
                    styles.levelCard,
                    { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                    adminLevel === "support_admin" && styles.activeLevelCard,
                  ]}
                  onPress={() => setAdminLevel("support_admin")}
                >
                  <Text style={{ fontSize: 20 }}>🛡️</Text>
                  <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>Support Admin</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "600", marginTop: 2 }}>Disputes, KYC, Fraud</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.levelCard,
                    { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                    adminLevel === "super_admin" && styles.activeLevelCard,
                  ]}
                  onPress={() => setAdminLevel("super_admin")}
                >
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>Super Admin</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "600", marginTop: 2 }}>Full System Control</Text>
                </TouchableOpacity>
              </View>

              {/* Form Inputs */}
              <GlassCard style={{ padding: 14, marginBottom: 16 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  placeholder="e.g. Jordan Miller"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>ADMIN EMAIL</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  placeholder="admin@chainwork.io"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>TEMPORARY PASSWORD</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  placeholder="••••••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </GlassCard>

              <CustomButton
                title="Onboard New Admin 🛡️"
                onPress={handleCreate}
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
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  levelCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  activeLevelCard: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b581",
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
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
});
