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
import { useAuth, formatAuthError } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { CustomButton } from "../../components/CustomButton";
import { BirdSvgLogo } from "../../components/BirdSvgLogo";

interface LoginScreenProps {
  onNavigateRegister: () => void;
  onNavigateWelcome: () => void;
  onNavigateForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateRegister,
  onNavigateWelcome,
  onNavigateForgotPassword,
}) => {
  const { signInEmail, signInGoogle } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your registered email address and password.");
      return;
    }
    setLoading(true);
    try {
      await signInEmail(email.trim(), password.trim());
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      Alert.alert("Login Failed", formatAuthError(e.code ?? e.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInGoogle("freelancer");
      Alert.alert("Google Auth Success 🌐", "Welcome to ChainWork Protocol!");
    } catch {
      Alert.alert("Google Auth Error", "Could not complete Google Sign-In.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Branding Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={onNavigateWelcome}>
            <Text style={styles.backBtnTxt}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme}>
            <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <BirdSvgLogo size={90} />
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>Sign in to ChainWork</Text>
        </View>

        {/* Login Form */}
        <GlassCard style={{ padding: 18, marginBottom: 16 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="freelancer@chainwork.io"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PASSWORD</Text>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={{ color: colors.accentAzure, fontSize: 11, fontWeight: "800" }}>
                {showPassword ? "Hide 👁️" : "Show 👁️"}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="••••••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <CustomButton
            title="Sign In Account ➔"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 16 }}
          />

          {onNavigateForgotPassword && (
            <TouchableOpacity
              onPress={onNavigateForgotPassword}
              style={{ alignSelf: "center", marginTop: 12 }}
            >
              <Text style={{ color: colors.accentAzure, fontSize: 12, fontWeight: "800" }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.dividerTxt, { color: colors.textMuted }]}>OR AUTHENTICATE WITH</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.googleBtnTxt}>🌐 Continue with Google</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>Don't have an account? </Text>
          <TouchableOpacity onPress={onNavigateRegister}>
            <Text style={{ color: colors.accentEmerald, fontSize: 13, fontWeight: "900" }}>Register Here ➔</Text>
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
  backBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  backBtnTxt: { color: "#10b581", fontSize: 12, fontWeight: "800" },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10,
  },
  brandSub: {
    fontSize: 12,
    fontWeight: "600",
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
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerTxt: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginHorizontal: 10,
  },
  googleBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  googleBtnTxt: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
});
