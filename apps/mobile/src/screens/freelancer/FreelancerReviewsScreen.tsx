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

interface FreelancerReviewsScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

export const FreelancerReviewsScreen: React.FC<FreelancerReviewsScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  const reviews = [
    {
      id: "REV-501",
      clientName: "TechCorp Labs",
      project: "Full-Stack Smart Contract DApp",
      rating: 5.0,
      date: "Aug 02, 2026",
      comment: "Exceptional developer! Built our staking vault with immaculate unit test coverage and deployed flawlesly to mainnet.",
    },
    {
      id: "REV-502",
      clientName: "Apex Financial",
      project: "Cross-Chain Token Bridge UI",
      rating: 5.0,
      date: "Jul 28, 2026",
      comment: "Top tier React Native mobile developer. Delivered clean cross-chain wallet connectors on time and under budget.",
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Client Reviews</Text>
          <Text style={styles.headerSubtitle}>Verified Reputation Score</Text>
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
          <View style={styles.heroRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreTxt}>5.0</Text>
              <Text style={styles.scoreStars}>★★★★★</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>PERFECT REPUTATION</Text>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>100% Client Satisfaction</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                12 Completed Contracts • 0 Disputes
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Star Rating Distribution */}
        <GlassCard style={{ padding: 14, marginBottom: 14 }}>
          <Text style={[styles.distHeader, { color: colors.textMuted }]}>RATING DISTRIBUTION</Text>

          <View style={styles.barRow}>
            <Text style={[styles.barLabel, { color: colors.textPrimary }]}>5 Stars</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: "100%" }]} />
            </View>
            <Text style={[styles.barPercent, { color: colors.accentEmerald }]}>100%</Text>
          </View>

          <View style={styles.barRow}>
            <Text style={[styles.barLabel, { color: colors.textMuted }]}>4 Stars</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: "0%" }]} />
            </View>
            <Text style={[styles.barPercent, { color: colors.textMuted }]}>0%</Text>
          </View>
        </GlassCard>

        {/* Client Testimonials */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>CLIENT FEEDBACK & REVIEWS ({reviews.length})</Text>

        {reviews.map((rev) => (
          <GlassCard key={rev.id} style={{ marginBottom: 12, padding: 16 }}>
            <View style={styles.revHeader}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#10b581", fontSize: 10, fontWeight: "900" }}>{rev.project}</Text>
                <Text style={[styles.clientName, { color: colors.textPrimary }]}>{rev.clientName}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#eab308", fontSize: 14, fontWeight: "900" }}>★★★★★ 5.0</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>{rev.date}</Text>
              </View>
            </View>

            <Text style={[styles.commentTxt, { color: colors.textSecondary }]}>"{rev.comment}"</Text>
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
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  scoreBox: { backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, alignItems: "center" },
  scoreTxt: { color: "#10b581", fontSize: 26, fontWeight: "900" },
  scoreStars: { color: "#eab308", fontSize: 11, fontWeight: "900" },
  heroTitle: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  distHeader: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 3 },
  barLabel: { width: 50, fontSize: 11, fontWeight: "800" },
  track: { flex: 1, height: 6, backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#10b581" },
  barPercent: { width: 40, fontSize: 11, fontWeight: "900", textAlign: "right" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  revHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  clientName: { fontSize: 14, fontWeight: "900", marginTop: 2 },
  commentTxt: { fontSize: 12, lineHeight: 18, fontStyle: "italic", marginTop: 4 },
});
