import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import {
  KYC_DOC_TYPES,
  KYC_DOC_TYPE_LABELS,
  type KycDocumentType,
} from "@chainwork/shared";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";
import { CustomButton } from "../../components/CustomButton";
import { db } from "../../config/firebase";

interface KycScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

const KYC_COLLECTION = "kycSubmissions";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Not Submitted", color: "#94a3b8" },
  submitted: { label: "Under Review", color: "#3b82f6" },
  approved: { label: "Approved", color: "#10b981" },
  rejected: { label: "Rejected", color: "#ef4444" },
};

export const KycScreen: React.FC<KycScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { profile, updateProfileData, user } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [docType, setDocType] = useState<KycDocumentType>("passport");
  const [docUrl, setDocUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const kycStatus = profile?.kycStatus ?? "pending";
  const statusMeta = STATUS_LABELS[kycStatus] ?? STATUS_LABELS.pending;
  const canSubmit = kycStatus === "pending" || kycStatus === "rejected";

  const handleSubmit = async () => {
    if (!docUrl.trim()) {
      Alert.alert("Missing Document", "Please enter a document URL.");
      return;
    }

    const url = docUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Alert.alert("Invalid URL", "Document URL must start with http:// or https://");
      return;
    }

    if (!user) {
      Alert.alert("Not signed in", "Please sign in before submitting KYC.");
      return;
    }

    setLoading(true);
    try {
      const publicId = url.split("/").pop()?.split("?")[0] || `kyc-${Date.now()}`;

      await addDoc(collection(db, KYC_COLLECTION), {
        userId: user.uid,
        userName: profile?.name || "Unknown",
        role: profile?.role || "freelancer",
        documentType: docType,
        documentUrl: url,
        documentPublicId: publicId,
        status: "submitted",
        createdAt: serverTimestamp(),
      });

      await updateProfileData({ kycStatus: "submitted" } as Parameters<typeof updateProfileData>[0]);

      Alert.alert(
        "KYC Submitted",
        "Your document has been submitted for review. We will notify you within 1–2 business days."
      );
    } catch (err) {
      Alert.alert("Submission Error", "Failed to submit KYC document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topHeader,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder },
        ]}
      >
        <TouchableOpacity style={styles.menuBtn} onPress={onOpenDrawer} activeOpacity={0.7}>
          <Text style={styles.menuTxt}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>KYC Verification</Text>
          <Text style={styles.headerSubtitle}>Identity Document Upload</Text>
        </View>

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <GlassCard variant={kycStatus === "approved" ? "emerald" : "default"} style={{ marginBottom: 14, padding: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
            KYC STATUS
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
            <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
          {kycStatus === "approved" && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
              Your identity has been verified. You have full access to the platform.
            </Text>
          )}
          {kycStatus === "submitted" && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
              Your document is under review. We typically respond within 1–2 business days.
            </Text>
          )}
          {kycStatus === "rejected" && (
            <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>
              Your submission was rejected. Please re-submit with a valid, legible document.
            </Text>
          )}
        </GlassCard>

        {canSubmit && (
          <>
            {/* Document Type Selector */}
            <GlassCard style={{ marginBottom: 14, padding: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Document Type
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 12 }}>
                Select the type of government-issued ID you are submitting.
              </Text>

              <View style={styles.docTypeRow}>
                {KYC_DOC_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.docTypeBtn,
                      { borderColor: colors.cardBorder },
                      docType === type && styles.docTypeBtnActive,
                    ]}
                    onPress={() => setDocType(type)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.docTypeTxt,
                        { color: docType === type ? "#ffffff" : colors.textMuted },
                      ]}
                    >
                      {KYC_DOC_TYPE_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* Document URL Input */}
            <GlassCard style={{ marginBottom: 14, padding: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Document URL
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 10 }}>
                Upload your document to a secure cloud storage service and paste the URL below.
                Accepted formats: JPEG, PNG, PDF.
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.inputBg,
                    borderColor: docUrl.trim() ? colors.accentEmerald : colors.inputBorder,
                  },
                ]}
                placeholder="https://storage.example.com/document.jpg"
                placeholderTextColor="#64748b"
                value={docUrl}
                onChangeText={setDocUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={{ color: "#94a3b8", fontSize: 10, marginTop: 8 }}>
                Note: Production builds support direct camera capture and device gallery upload.
              </Text>
            </GlassCard>

            {/* Submit Button */}
            <CustomButton
              title={kycStatus === "rejected" ? "Re-Submit KYC Document" : "Submit KYC Document"}
              onPress={handleSubmit}
              loading={loading}
            />
          </>
        )}

        {/* Info Box */}
        <GlassCard style={{ marginTop: 14, padding: 14 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 8 }}>
            WHY KYC IS REQUIRED
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
            ChainWork requires identity verification to prevent fraud, comply with international
            anti-money-laundering (AML) regulations, and protect all platform participants.
            Your data is encrypted and never shared with third parties.
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 36) + 16 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuTxt: { color: "#34d399", fontSize: 20, fontWeight: "bold" },
  headerTitle: { fontSize: 16, fontWeight: "900" },
  headerSubtitle: { color: "#10b581", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 90 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 16, fontWeight: "900" },
  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 4 },
  docTypeRow: { flexDirection: "row", gap: 8 },
  docTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  docTypeBtnActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  docTypeTxt: { fontSize: 11, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
});
