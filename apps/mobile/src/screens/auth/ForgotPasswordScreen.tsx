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
import { sendPasswordReset } from "@chainwork/core/auth/auth-helpers";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { CustomButton } from "../../components/CustomButton";
import { BirdSvgLogo } from "../../components/BirdSvgLogo";

interface ForgotPasswordScreenProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateLogin,
}) => {
  const { colors, theme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Invalid Email", "Please enter the email address you registered with.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(trimmed);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("too-many-requests")) {
        Alert.alert("Too Many Attempts", "Please wait a few minutes before trying again.");
      } else {
        // Do not reveal whether the email exists (account enumeration).
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={onNavigateLogin}>
            <Text style={styles.backBtnTxt}>← Back to Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <BirdSvgLogo size={90} />
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Reset your password</Text>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>
            We&apos;ll email you a secure reset link
          </Text>
        </View>

        <GlassCard style={{ padding: 18 }}>
          {sent ? (
            <View style={{ alignItems: "center", paddingVertical: 10 }}>
              <Text style={{ fontSize: 34 }}>📬</Text>
              <Text style={[styles.sentTitle, { color: colors.textPrimary }]}>Check your inbox</Text>
              <Text style={[styles.sentBody, { color: colors.textMuted }]}>
                If an account exists for {email.trim()}, a password reset link is on its way.
                Follow it, set a new password, then sign in here.
              </Text>
              <CustomButton title="Back to Sign In ➔" onPress={onNavigateLogin} style={{ marginTop: 16, alignSelf: "stretch" }} />
            </View>
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <CustomButton
                title="Send Reset Link ➔"
                onPress={handleReset}
                loading={loading}
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </GlassCard>
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
  logoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: { fontSize: 22, fontWeight: "900", marginTop: 10 },
  brandSub: { fontSize: 12, fontWeight: "600", marginTop: 4 },
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
  sentTitle: { fontSize: 16, fontWeight: "900", marginTop: 8 },
  sentBody: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
