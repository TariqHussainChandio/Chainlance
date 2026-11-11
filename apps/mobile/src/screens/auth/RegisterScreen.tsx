import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useAuth, UserRole, formatAuthError } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { CustomButton } from "../../components/CustomButton";

interface RegisterScreenProps {
  onNavigateLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateLogin }) => {
  const { signUpEmail, signInGoogle } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("freelancer");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please complete all registration fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signUpEmail(email.trim(), password.trim(), name.trim(), selectedRole);
      Alert.alert("Account Created! 🚀", `Welcome to ChainWork as a verified ${selectedRole}.`);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      Alert.alert("Registration Failed", formatAuthError(e.code ?? e.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInGoogle(selectedRole);
      Alert.alert("Google Registration 🌐", `Signed up as a verified ${selectedRole}.`);
    } catch {
      Alert.alert("Google Auth Failed", "Could not complete Google Registration.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Create Account</Text>
          <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme}>
            <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
        </View>

        {/* Role Selection Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SELECT ACCOUNT ROLE</Text>
        <View style={styles.roleGrid}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              selectedRole === "freelancer" && styles.activeRoleCard,
            ]}
            onPress={() => setSelectedRole("freelancer")}
          >
            <Text style={{ fontSize: 24 }}>💼</Text>
            <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>Freelancer</Text>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "600", marginTop: 2 }}>Publish Gigs & Earn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              selectedRole === "client" && styles.activeRoleCard,
            ]}
            onPress={() => setSelectedRole("client")}
          >
            <Text style={{ fontSize: 24 }}>🏢</Text>
            <Text style={[styles.roleTitle, { color: colors.textPrimary }]}>Client</Text>
            <Text style={{ color: colors.textMuted, fontSize: 9, fontWeight: "600", marginTop: 2 }}>Hire & Fund Escrow</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME / COMPANY</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Alex Rivers"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>EMAIL ADDRESS</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="alex@chainwork.io"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 10 }]}>PASSWORD (MIN 6 CHARACTERS)</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="••••••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <CustomButton
            title="Create Verified Account ➔"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 16 }}
          />

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignUp} activeOpacity={0.8}>
            <Text style={styles.googleBtnTxt}>🌐 Continue with Google</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateLogin}>
            <Text style={{ color: colors.accentEmerald, fontSize: 13, fontWeight: "900" }}>Sign In Here ➔</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 36) + 12 : 16,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandTitle: { fontSize: 24, fontWeight: "900" },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 8 },
  roleGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  roleCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  activeRoleCard: { backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "#10b581" },
  roleTitle: { fontSize: 13, fontWeight: "900", marginTop: 4 },
  inputLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, height: 46, paddingHorizontal: 14, fontSize: 13, fontWeight: "600" },
  googleBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  googleBtnTxt: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 10 },
});
