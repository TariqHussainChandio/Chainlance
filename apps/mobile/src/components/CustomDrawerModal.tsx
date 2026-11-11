import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { UserProfile } from "../context/AuthContext";
import { GlassCard } from "./GlassCard";

export interface DrawerLink {
  key: string;
  label: string;
  iconName: string;
}

interface CustomDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  links: DrawerLink[];
  activeKey: string;
  onSelectLink: (key: string) => void;
  onSignOut: () => void;
}

export const CustomDrawerModal: React.FC<CustomDrawerModalProps> = ({
  visible,
  onClose,
  profile,
  links,
  activeKey,
  onSelectLink,
  onSignOut,
}) => {
  const { colors, theme, toggleTheme } = useTheme();

  if (!visible) return null;

  const displayName = profile?.name || "Freelancer Pro";
  const userRole = profile?.role || "freelancer";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "FL";

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "home": return "🏠";
      case "briefcase": return "💼";
      case "scroll": return "📜";
      case "file": return "📝";
      case "wallet": return "💸";
      case "receipt": return "📄";
      case "bell": return "🔔";
      case "star": return "⭐";
      case "user": return "👤";
      case "message": return "💬";
      case "search": return "🔍";
      case "shield": return "🛡️";
      case "user-check": return "✅";
      case "alert-triangle": return "⚠️";
      case "scale": return "⚖️";
      case "users": return "👥";
      default: return "📌";
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <SafeAreaView style={[styles.drawerContainer, { backgroundColor: colors.drawerBg }]}>
          {/* Top User Profile Header */}
          <View style={[styles.userHeader, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.userRow}>
              {profile?.profileImage ? (
                <Image source={{ uri: profile.profileImage }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarTxt}>{initials}</Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>{displayName}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeTxt}>⚡ {userRole.toUpperCase()} PORTAL</Text>
                </View>
              </View>
            </View>

            {/* Theme Toggle Button */}
            <TouchableOpacity style={styles.themeRow} onPress={toggleTheme} activeOpacity={0.7}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "800" }}>
                Theme: {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Links */}
          <ScrollView contentContainerStyle={styles.linksScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              {userRole.toUpperCase()} WORKSPACE
            </Text>

            {links.map((link) => {
              const isActive = activeKey === link.key;
              return (
                <TouchableOpacity
                  key={link.key}
                  style={[
                    styles.linkItem,
                    isActive && { backgroundColor: "rgba(16, 185, 129, 0.18)", borderColor: "#10b581" },
                  ]}
                  onPress={() => {
                    onSelectLink(link.key);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkIcon}>{getIcon(link.iconName)}</Text>
                  <Text
                    style={[
                      styles.linkLabel,
                      { color: isActive ? colors.accentEmerald : colors.textPrimary },
                      isActive && styles.activeLinkLabel,
                    ]}
                  >
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer Sign Out */}
          <View style={[styles.drawerFooter, { borderTopColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => {
                onClose();
                onSignOut();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutTxt}>🚪 Sign Out Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  backdrop: {
    width: "22%",
    height: "100%",
  },
  drawerContainer: {
    width: "78%",
    height: "100%",
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  userHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#10b581",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10b581",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTxt: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  userName: {
    fontSize: 15,
    fontWeight: "900",
  },
  roleBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  roleBadgeTxt: {
    color: "#10b581",
    fontSize: 9,
    fontWeight: "900",
  },
  themeRow: {
    marginTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  linksScroll: {
    padding: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  linkIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  linkLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  activeLinkLabel: {
    fontWeight: "900",
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  signOutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutTxt: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "900",
  },
});
