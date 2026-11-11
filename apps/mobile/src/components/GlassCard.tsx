import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "emerald" | "azure";
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = "default" }) => {
  const { colors, theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            variant === "emerald"
              ? theme === "dark" ? "rgba(16, 185, 129, 0.14)" : "rgba(16, 185, 129, 0.08)"
              : variant === "azure"
              ? theme === "dark" ? "rgba(59, 130, 246, 0.14)" : "rgba(59, 130, 246, 0.08)"
              : colors.cardBg,
          borderColor:
            variant === "emerald"
              ? "rgba(16, 185, 129, 0.4)"
              : variant === "azure"
              ? "rgba(59, 130, 246, 0.4)"
              : colors.cardBorder,
          shadowColor: colors.cardShadow,
        },
        variant === "elevated" && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    // Soft shadow for light and dark modes
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  elevated: {
    elevation: 6,
  },
});
