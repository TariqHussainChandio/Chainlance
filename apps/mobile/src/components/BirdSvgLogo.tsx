import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BirdSvgLogoProps {
  size?: number;
}

export const BirdSvgLogo: React.FC<BirdSvgLogoProps> = ({ size = 110 }) => {
  const fontSize = Math.round(size * 0.42);
  const borderRadius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      <Text style={{ fontSize, lineHeight: fontSize * 1.2 }}>🔗</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(16, 185, 129, 0.45)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
  },
});
