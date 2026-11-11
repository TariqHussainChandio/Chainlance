import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { CATEGORIES, rankGigsForUser, type SerializedGig } from "@chainwork/shared";
import { searchGigs } from "@chainwork/core/firestore/gigs";
import { serializeGig } from "@chainwork/core/firestore/serialize";
import { api } from "@chainwork/core";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";

interface ClientBrowseScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
}

const POPULAR_SKILLS = ["React", "React Native", "TypeScript", "Python", "Solidity", "Firebase"];

export const ClientBrowseScreen: React.FC<ClientBrowseScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
}) => {
  const { profile } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All Services");
  const [aiMatchToggle, setAiMatchToggle] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [gigs, setGigs] = useState<SerializedGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiringGigId, setHiringGigId] = useState<string | null>(null);

  const categories = useMemo(() => ["All Services", ...CATEGORIES], []);

  const loadGigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchGigs({
        category: selectedCat === "All Services" ? undefined : selectedCat,
        sort: "newest",
        limit: 30,
      });
      setGigs(result.gigs.map(serializeGig));
    } catch (err) {
      console.warn("[ClientBrowse] searchGigs failed:", err);
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCat]);

  useEffect(() => {
    void loadGigs();
  }, [loadGigs]);

  // In-memory refinement (search text + skill chip) over the fetched page,
  // plus the shared AI ranking engine when the toggle is on.
  const displayGigs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = gigs.filter((g) => {
      const matchesSearch =
        q.length === 0 ||
        g.title.toLowerCase().includes(q) ||
        (g.skills ?? []).some((s) => s.toLowerCase().includes(q));
      const matchesSkill =
        !selectedSkill ||
        (g.skills ?? []).some((s) => s.toLowerCase() === selectedSkill.toLowerCase());
      return matchesSearch && matchesSkill;
    });

    if (aiMatchToggle && profile) {
      const ranked = rankGigsForUser(profile, filtered, { limit: filtered.length, minScore: 0 });
      const scoreById = new Map(ranked.map((r) => [r.gig.id, r.score]));
      return filtered
        .map((g) => ({ gig: g, score: scoreById.get(g.id) ?? 0 }))
        .sort((a, b) => b.score - a.score);
    }
    return filtered.map((g) => ({ gig: g, score: 0 }));
  }, [gigs, search, selectedSkill, aiMatchToggle, profile]);

  const handleHire = (gig: SerializedGig) => {
    const amount = gig.pricingBasic;
    Alert.alert(
      "Hire Freelancer",
      `Create a contract for "${gig.title}" with ${gig.freelancerName} at $${amount.toFixed(
        2
      )} (basic tier)? Escrow funding happens on the contract after creation.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create Contract",
          onPress: async () => {
            setHiringGigId(gig.id);
            try {
              const deadline = Date.now() + (gig.deliveryDays || 7) * 24 * 60 * 60 * 1000;
              await api.post<{ contractId: string }>("/api/v1/contracts", {
                gigId: gig.id,
                title: gig.title,
                totalAmount: amount,
                milestones: [
                  {
                    description: `Deliver: ${gig.title} (basic tier)`,
                    amount,
                    deadline,
                  },
                ],
              });
              Alert.alert(
                "Contract Created ✅",
                "Draft contract created. Open Contracts to fund the escrow and start work."
              );
              onNavigateTab?.("contracts");
            } catch (err) {
              Alert.alert(
                "Could not create contract",
                err instanceof Error ? err.message : "Please try again."
              );
            } finally {
              setHiringGigId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Notification Bell */}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Marketplace Talent</Text>
          <Text style={styles.headerSubtitle}>Browse & Hire Verified Freelancers</Text>
        </View>

        {onNavigateTab && (
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => onNavigateTab("notifications")}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Carousel Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, selectedCat === cat && styles.activeCatPill]}
                onPress={() => setSelectedCat(cat)}
              >
                <Text style={[styles.catTxt, selectedCat === cat && styles.activeCatTxt]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Filter Bar */}
        <GlassCard style={{ padding: 14, marginBottom: 14 }}>
          <Text style={styles.searchLabel}>SEARCH SERVICES & FREELANCERS</Text>
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
            ]}
            placeholder="Search by keyword, React, Solidity..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.aiToggleRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 16 }}>🪄</Text>
              <Text style={[styles.aiToggleTitle, { color: colors.textPrimary }]}>
                AI Match Recommendation Engine
              </Text>
            </View>
            <Switch
              value={aiMatchToggle}
              onValueChange={setAiMatchToggle}
              trackColor={{ false: "#334155", true: "#10b581" }}
              thumbColor="#ffffff"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {POPULAR_SKILLS.map((sk) => (
                <TouchableOpacity
                  key={sk}
                  style={[styles.skillTag, selectedSkill === sk && styles.activeSkillTag]}
                  onPress={() => setSelectedSkill(selectedSkill === sk ? null : sk)}
                >
                  <Text style={[styles.skillTagTxt, selectedSkill === sk && styles.activeSkillTagTxt]}>
                    {sk} {selectedSkill === sk ? "✕" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </GlassCard>

        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          VERIFIED MARKETPLACE GIGS ({displayGigs.length})
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#10b581" />
            <Text style={{ color: colors.textMuted, marginTop: 10, fontSize: 12, fontWeight: "700" }}>
              Loading marketplace gigs...
            </Text>
          </View>
        ) : displayGigs.length === 0 ? (
          <GlassCard style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 30 }}>🔍</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: "900", marginTop: 8 }}>
              No gigs match your filters
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 4, textAlign: "center" }}>
              Try a different category or clear the search and skill filters.
            </Text>
          </GlassCard>
        ) : (
          displayGigs.map(({ gig, score }) => (
            <GlassCard key={gig.id} style={{ marginBottom: 14, padding: 16 }}>
              <View style={styles.gigHeader}>
                <View style={{ flex: 1 }}>
                  {aiMatchToggle && score > 0 && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeTxt}>⚡ {Math.round(score * 100)}% AI Match</Text>
                    </View>
                  )}
                  <Text style={[styles.gigTitle, { color: colors.textPrimary }]}>{gig.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>
                    By {gig.freelancerName}
                    {gig.freelancerRating ? ` • ${gig.freelancerRating.toFixed(1)} ★` : ""}
                  </Text>
                </View>

                <Text style={[styles.gigPrice, { color: colors.accentEmerald }]}>
                  ${gig.pricingBasic.toFixed(2)}
                </Text>
              </View>

              <Text style={[styles.gigDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                {gig.description}
              </Text>

              <View style={styles.skillsRow}>
                {(gig.skills ?? []).slice(0, 6).map((s) => (
                  <View key={s} style={styles.skillPill}>
                    <Text style={styles.skillPillTxt}>{s}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.gigFooter}>
                <TouchableOpacity
                  style={[styles.hireBtn, hiringGigId === gig.id && { opacity: 0.6 }]}
                  onPress={() => handleHire(gig)}
                  disabled={hiringGigId !== null}
                  activeOpacity={0.8}
                >
                  <Text style={styles.hireBtnTxt}>
                    {hiringGigId === gig.id ? "Creating Contract..." : "Hire Freelancer ➔"}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
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
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 90 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activeCatPill: { backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "#10b581" },
  catTxt: { color: "#94a3b8", fontSize: 11, fontWeight: "700" },
  activeCatTxt: { color: "#ffffff", fontWeight: "900" },
  searchLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 6 },
  searchInput: { borderWidth: 1, borderRadius: 12, height: 44, paddingHorizontal: 12, fontSize: 13, fontWeight: "600" },
  aiToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  aiToggleTitle: { fontSize: 12, fontWeight: "800" },
  skillTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  activeSkillTag: { backgroundColor: "rgba(14, 165, 233, 0.2)", borderColor: "#0ea5e9" },
  skillTagTxt: { color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  activeSkillTagTxt: { color: "#0ea5e9", fontWeight: "900" },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 10 },
  gigHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  aiBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  aiBadgeTxt: { color: "#60a5fa", fontSize: 9, fontWeight: "900" },
  gigTitle: { fontSize: 16, fontWeight: "900" },
  gigPrice: { fontSize: 18, fontWeight: "900" },
  gigDesc: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  skillPill: { backgroundColor: "rgba(255, 255, 255, 0.05)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  skillPillTxt: { color: "#94a3b8", fontSize: 10, fontWeight: "700" },
  gigFooter: { borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.06)", paddingTop: 10 },
  hireBtn: { backgroundColor: "#10b581", paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  hireBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
});
