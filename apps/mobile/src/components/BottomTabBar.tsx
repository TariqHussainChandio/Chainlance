import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

export interface TabItem {
  key: string;
  label: string;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (key: string) => void;
}

const TAB_ICONS: Record<string, string> = {
  home: "🏠",
  gigs: "💼",
  contracts: "📜",
  proposals: "📝",
  invoices: "📄",
  earnings: "💸",
  messages: "💬",
  browse: "🔍",
  kyc: "🛡️",
  fraud: "⚠️",
  disputes: "⚖️",
  users: "👥",
  profile: "👤",
  reviews: "⭐",
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
}) => {
  const { colors, theme } = useTheme();

  return (
    <View style={styles.floatingContainer}>
      <View
        style={[
          styles.pillBar,
          {
            backgroundColor: theme === "dark" ? "rgba(15, 23, 42, 0.92)" : "#ffffff",
            borderColor: colors.cardBorder,
            shadowColor: colors.cardShadow,
          },
        ]}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          const icon = TAB_ICONS[t.key] || "📌";

          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabBtn,
                isActive && {
                  backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.22)" : "rgba(16, 185, 129, 0.12)",
                  borderColor: colors.accentEmerald,
                  borderWidth: 1,
                },
              ]}
              onPress={() => onSelectTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>{icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? colors.accentEmerald
                      : colors.textMuted,
                  },
                  isActive && { fontWeight: "900" },
                ]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 22 : 16,
    left: 12,
    right: 12,
    alignItems: "center",
    zIndex: 999,
  },
  pillBar: {
    flexDirection: "row",
    borderRadius: 32,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
});
