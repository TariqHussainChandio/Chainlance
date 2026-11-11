import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
} from "react-native";
import { BirdSvgLogo } from "../../components/BirdSvgLogo";
import { useTheme } from "../../context/ThemeContext";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#030d0a" }]}>
      <StatusBar barStyle="light-content" backgroundColor="#030d0a" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Graphical Bird Logo */}
        <View style={styles.logoWrapper}>
          <BirdSvgLogo size={130} />
        </View>

        <Text style={styles.brandTitle}>ChainWork</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.brandBadge}>⚡ NEXT-GEN WEB3 & AI MARKETPLACE</Text>
        </View>
        <Text style={styles.tagline}>Freelancing, Secured by Code.</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pulseDot} />
        <Text style={styles.footerTxt}>Secured On-Chain • 15% Platform Fee</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#030d0a",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoWrapper: {
    marginBottom: 22,
  },
  brandTitle: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1,
  },
  badgeContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b581",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  brandBadge: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tagline: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  footer: {
    position: "absolute",
    bottom: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#10b581",
  },
  footerTxt: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
  },
});
