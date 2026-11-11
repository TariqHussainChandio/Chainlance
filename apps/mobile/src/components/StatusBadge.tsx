import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatusBadgeProps {
  status: string;
  text?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const s = status.toLowerCase();
  let bg = "rgba(148, 163, 184, 0.2)";
  let color = "#cbd5e1";

  if (["active", "completed", "approved", "verified", "released"].includes(s)) {
    bg = "rgba(16, 185, 129, 0.2)";
    color = "#34d399";
  } else if (["pending", "under_review", "submitted", "escrow"].includes(s)) {
    bg = "rgba(245, 158, 11, 0.2)";
    color = "#fbbf24";
  } else if (["disputed", "rejected", "banned"].includes(s)) {
    bg = "rgba(239, 68, 68, 0.2)";
    color = "#f87171";
  }

  const displayText = text || status.toUpperCase();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
