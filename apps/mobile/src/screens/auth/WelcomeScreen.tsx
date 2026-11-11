import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { PLATFORM_FEE_PERCENTAGE, FREELANCER_FEE_PERCENTAGE } from "@chainwork/shared";
import { GlassCard } from "../../components/GlassCard";

export const WelcomeScreen: React.FC<{
  onGetStarted: (role: "client" | "freelancer") => void;
  onLogin: () => void;
  onQuickDemo: (role: "client" | "freelancer" | "admin") => void;
}> = ({ onGetStarted, onLogin, onQuickDemo }) => {
  const platformFeePercent = (PLATFORM_FEE_PERCENTAGE * 100).toFixed(0);
  const freelancerKeepPercent = ((1 - FREELANCER_FEE_PERCENTAGE) * 100).toFixed(0);

  const steps = [
    { num: "01", title: "AI Matchmaking", body: "AI pairs your brief with verified talent instantly based on skill matrix and rating.", icon: "🧠" },
    { num: "02", title: "Smart Escrow", body: "Clients lock funds on-chain in smart contracts prior to contract commencement.", icon: "🔒" },
    { num: "03", title: "Proof of Delivery", body: "Milestones are delivered with verifiable code/design evidence.", icon: "⚡" },
    { num: "04", title: "Instant Payout", body: "Smart contracts release funds directly to freelancer wallets upon approval.", icon: "💸" },
  ];

  const features = [
    { icon: "🛡️", title: "Smart Escrow", body: "Zero-risk on-chain funds locking until milestone completion." },
    { icon: "🧠", title: "AI Matching", body: "TF-IDF similarity matrix matches high-value talent." },
    { icon: "⚡", title: "Real-Time Fraud Engine", body: "8 weighted security signals flag risk score in real-time." },
    { icon: "💬", title: "Contextual Contract Chat", body: "Direct messaging integrated inside contract milestones." },
    { icon: "📜", title: "Milestone Releases", body: "Flexible milestone payouts as each project phase delivers." },
    { icon: "⚖️", title: "Human Dispute SLA", body: "Fair admin arbitration backed by evidence review." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Navbar */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 16, lineHeight: 20 }}>🔗</Text>
          </View>
          <Text style={styles.brandTitle}>ChainWork</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <View style={styles.pulseDotOuter}>
              <View style={styles.pulseDotInner} />
            </View>
            <Text style={styles.heroBadgeText}>Next-Gen Web3 & AI Freelance Marketplace</Text>
          </View>
          <Text style={styles.heroTitle}>Freelancing,{"\n"}Secured by Code.</Text>
          <Text style={styles.heroBody}>
            Smart contract escrows secure payments. AI matches talent with briefs. You ship exceptional work.
          </Text>

          {/* Badge Pills - matching web */}
          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Text style={{ fontSize: 11 }}>🛡️</Text>
              <Text style={styles.metricPillTxt}>Escrow Secured</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={{ fontSize: 11 }}>⚡</Text>
              <Text style={styles.metricPillTxt}>Instant Settlement</Text>
            </View>
            <View style={styles.metricPill}>
              <Text style={{ fontSize: 11 }}>🪙</Text>
              <Text style={styles.metricPillTxt}>{platformFeePercent}% Platform Fee</Text>
            </View>
          </View>
        </View>

        {/* 4-Step Process Section */}
        <Text style={styles.sectionHeading}>How It Works</Text>
        <View style={styles.stepsGrid}>
          {steps.map((st) => (
            <GlassCard key={st.num} style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepIcon}>{st.icon}</Text>
                <Text style={styles.stepNum}>{st.num}</Text>
              </View>
              <Text style={styles.stepTitle}>{st.title}</Text>
              <Text style={styles.stepBody}>{st.body}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Core Protocol Features Grid */}
        <Text style={styles.sectionHeading}>Platform Capabilities</Text>
        <View style={styles.featuresGrid}>
          {features.map((feat, idx) => (
            <GlassCard key={idx} style={styles.featCard}>
              <Text style={styles.featIcon}>{feat.icon}</Text>
              <Text style={styles.featTitle}>{feat.title}</Text>
              <Text style={styles.featBody}>{feat.body}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Role Selection Options */}
        <Text style={styles.sectionHeading}>Get Started Today</Text>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.choiceCardWrapper}
          onPress={() => onGetStarted("client")}
        >
          <GlassCard style={styles.choiceCard}>
            <View style={styles.choiceHeaderRow}>
              <View style={[styles.choiceIconBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Text style={{ fontSize: 24 }}>💼</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>I Want to Hire Talent</Text>
                <Text style={styles.choiceSub}>Client & Business Portal</Text>
              </View>
              <Text style={styles.arrowIcon}>➔</Text>
            </View>
            <Text style={styles.choiceBody}>
              Post jobs, review proposals, lock milestone escrows, and manage contracts with AI-matched talent.
            </Text>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.choiceCardWrapper}
          onPress={() => onGetStarted("freelancer")}
        >
          <GlassCard style={styles.choiceCard}>
            <View style={styles.choiceHeaderRow}>
              <View style={[styles.choiceIconBadge, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                <Text style={{ fontSize: 24 }}>🚀</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>I Want to Work as Freelancer</Text>
                <Text style={styles.choiceSub}>Talent & Expert Portal</Text>
              </View>
              <Text style={styles.arrowIcon}>➔</Text>
            </View>
            <Text style={styles.choiceBody}>
              Set custom rates, keep {freelancerKeepPercent}% of earnings. Guaranteed payouts via smart contract escrow.
            </Text>
          </GlassCard>
        </TouchableOpacity>

        {/* Quick Demo Access */}
        <GlassCard style={styles.demoSection}>
          <Text style={styles.demoTitle}>⚡ Quick Demo Portals</Text>
          <Text style={styles.demoSub}>Explore mobile dashboards instantly:</Text>

          <View style={styles.demoBtnRow}>
            <TouchableOpacity
              style={[styles.demoPill, { borderColor: "#10b581" }]}
              onPress={() => onQuickDemo("client")}
            >
              <Text style={[styles.demoPillTxt, { color: "#34d399" }]}>Client Suite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { borderColor: "#3b82f6" }]}
              onPress={() => onQuickDemo("freelancer")}
            >
              <Text style={[styles.demoPillTxt, { color: "#60a5fa" }]}>Freelancer Suite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoPill, { borderColor: "#a855f7" }]}
              onPress={() => onQuickDemo("admin")}
            >
              <Text style={[styles.demoPillTxt, { color: "#c084fc" }]}>Admin Control</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Footer */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.loginRow} onPress={onLogin}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginHighlight}>Sign In Here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030d0a" },
  scrollContent: { padding: 18, paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 6, marginBottom: 20 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "rgba(16, 185, 129, 0.45)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: { color: "#ffffff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  heroCard: { marginBottom: 18, alignItems: "center" },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  pulseDotOuter: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00f5a0", justifyContent: "center", alignItems: "center" },
  pulseDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#00f5a0" },
  heroBadgeText: { color: "#34d399", fontSize: 10, fontWeight: "900", letterSpacing: 0.3 },
  heroTitle: { color: "#ffffff", fontSize: 32, fontWeight: "900", lineHeight: 38, marginBottom: 10, textAlign: "center" },
  heroBody: { color: "#94a3b8", fontSize: 13, lineHeight: 20, fontWeight: "600", marginBottom: 16, textAlign: "center" },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  metricPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metricPillTxt: { color: "#cbd5e1", fontSize: 11, fontWeight: "700" },
  sectionHeading: { color: "#f8fafc", fontSize: 16, fontWeight: "900", marginBottom: 10, marginTop: 8 },
  stepsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  stepCard: { width: "48%", padding: 12, borderRadius: 16 },
  stepHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  stepIcon: { fontSize: 18 },
  stepNum: { color: "#34d399", fontSize: 12, fontWeight: "900" },
  stepTitle: { color: "#ffffff", fontSize: 13, fontWeight: "900", marginBottom: 4 },
  stepBody: { color: "#94a3b8", fontSize: 10, lineHeight: 14 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  featCard: { width: "48%", padding: 12, borderRadius: 16 },
  featIcon: { fontSize: 20, marginBottom: 6 },
  featTitle: { color: "#ffffff", fontSize: 13, fontWeight: "900", marginBottom: 2 },
  featBody: { color: "#94a3b8", fontSize: 10, lineHeight: 14 },
  choiceCardWrapper: { marginBottom: 12 },
  choiceCard: { padding: 16, borderRadius: 18 },
  choiceHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 10 },
  choiceIconBadge: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  choiceTitle: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  choiceSub: { color: "#94a3b8", fontSize: 11, fontWeight: "600", marginTop: 1 },
  arrowIcon: { color: "#34d399", fontSize: 18, fontWeight: "900" },
  choiceBody: { color: "#cbd5e1", fontSize: 11, lineHeight: 16 },
  demoSection: { padding: 14, borderRadius: 18, marginTop: 4, marginBottom: 16 },
  demoTitle: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  demoSub: { color: "#94a3b8", fontSize: 10, fontWeight: "600", marginTop: 2, marginBottom: 10 },
  demoBtnRow: { flexDirection: "row", gap: 8 },
  demoPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  demoPillTxt: { fontSize: 10, fontWeight: "800" },
  bottomActions: { alignItems: "center", marginTop: 4 },
  loginRow: { paddingVertical: 8 },
  loginText: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  loginHighlight: { color: "#34d399", fontWeight: "900" },
});
