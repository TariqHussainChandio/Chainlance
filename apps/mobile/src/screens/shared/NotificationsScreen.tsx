import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";

interface NotificationsScreenProps {
  onOpenDrawer: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onOpenDrawer }) => {
  const { colors, theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([
    {
      id: "NOTIF-1",
      title: "Escrow Milestone Released 💸",
      message: "TechCorp Labs approved Milestone 1. $1,250.00 has been released to your available balance.",
      time: "10 mins ago",
      type: "payment",
      read: false,
    },
    {
      id: "NOTIF-2",
      title: "New Proposal Received 📝",
      message: "Sarah Jenkins submitted a proposal for 'Cross-Chain Token Bridge UI'.",
      time: "1 hour ago",
      type: "proposal",
      read: false,
    },
    {
      id: "NOTIF-3",
      title: "Dispute Update ⚖️",
      message: "Admin started evidence review for DISPUTE-801. Finding rationale pending.",
      time: "3 hours ago",
      type: "dispute",
      read: true,
    },
    {
      id: "NOTIF-4",
      title: "KYC Identity Verified ✓",
      message: "Your passport document and facial match verification succeeded.",
      time: "1 day ago",
      type: "system",
      read: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    Alert.alert("Notifications Updated 🔔", "All notifications marked as read.");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with generous top padding to clear camera notch */}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Real-Time Platform Alerts</Text>
        </View>

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.rowBetween}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            SYSTEM ALERTS ({notifications.filter((n) => !n.read).length} UNREAD)
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ color: colors.accentEmerald, fontSize: 12, fontWeight: "800" }}>
              Mark All Read ✓
            </Text>
          </TouchableOpacity>
        </View>

        {notifications.map((notif) => (
          <GlassCard
            key={notif.id}
            style={{
              marginBottom: 12,
              padding: 14,
              opacity: notif.read ? 0.75 : 1,
            }}
          >
            <View style={styles.notifRow}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 18 }}>
                  {notif.type === "payment"
                    ? "💸"
                    : notif.type === "proposal"
                    ? "📝"
                    : notif.type === "dispute"
                    ? "⚖️"
                    : "🔔"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>{notif.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "600" }}>{notif.time}</Text>
                </View>
                <Text style={[styles.notifBody, { color: colors.textSecondary }]}>{notif.message}</Text>
              </View>
            </View>
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
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { padding: 16, paddingBottom: 90 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionHeader: { fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  notifRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: { fontSize: 14, fontWeight: "900" },
  notifBody: { fontSize: 12, lineHeight: 17, marginTop: 2 },
});
