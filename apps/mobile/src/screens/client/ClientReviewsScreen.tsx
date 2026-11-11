import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";

interface ClientReviewsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const ClientReviewsScreen: React.FC<ClientReviewsScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const clientReviews = [
    {
      id: "REV-CL-101",
      freelancerName: "Alex Rivers",
      project: "Full-Stack Smart Contract DApp",
      rating: 5.0,
      date: "Aug 02, 2026",
      feedback: "Exceptional developer! Implemented smart contract staking vault with flawless unit test suite and clear documentation.",
    },
    {
      id: "REV-CL-102",
      freelancerName: "Sarah Chen",
      project: "Cross-Chain Token Bridge UI",
      rating: 5.0,
      date: "Jul 28, 2026",
      feedback: "Top tier React Native mobile developer. Delivered clean mobile wallet integration ahead of schedule.",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Notification Bell */}
      <View
        style={[
          styles.topHeader,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        <TouchableOpacity style={styles.menuBtn} onPress={onOpenDrawer} activeOpacity={0.7}>
          <Text style={styles.menuTxt}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Feedback & Reviews</Text>
          <Text style={styles.headerSubtitle}>Ratings Submitted for Talent</Text>
        </View>

        {/* Notification Bell Button */}
        {onNavigateTab && (
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => onNavigateTab("notifications")}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeTxt}>3</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rating Hero Card */}
        <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 16 }}>
          <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>TALENT EVALUATION LEDGER</Text>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Client Feedback & Ratings</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
            4 Freelancers Rated • 5.0 Average Rating Submitted
          </Text>
        </GlassCard>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>SUBMITTED REVIEWS ({clientReviews.length})</Text>

        {clientReviews.map((rev) => (
          <GlassCard key={rev.id} style={{ marginBottom: 12, padding: 16 }}>
            <View style={styles.revHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{rev.project}</Text>
                <Text style={[styles.freelancerName, { color: colors.textPrimary }]}>{rev.freelancerName}</Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#eab308", fontSize: 14, fontWeight: "900" }}>★★★★★ {rev.rating.toFixed(1)}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>{rev.date}</Text>
              </View>
            </View>

            <Text style={[styles.feedbackTxt, { color: colors.textSecondary }]}>"{rev.feedback}"</Text>
          </GlassCard>
        ))}
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
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeTxt: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 90 },
  heroTitle: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  revHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  freelancerName: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  feedbackTxt: { fontSize: 12, lineHeight: 18, fontStyle: "italic", marginTop: 4 },
});
