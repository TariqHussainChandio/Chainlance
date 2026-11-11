import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";
import { StatusBadge } from "../StatusBadge";

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "client" | "admin" | "banned";
  kycStatus: "approved" | "pending" | "rejected";
  fraudScore: number;
  joinedDate: string;
  bio?: string;
  walletAddress?: string;
  stripeStatus?: string;
}

interface UserProfileDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  user?: AdminUserData | null;
  onToggleBanState?: (userId: string, isBanned: boolean) => void;
  onPromoteDemote?: (userId: string, newRole: "admin" | "freelancer") => void;
}

export const UserProfileDrawerModal: React.FC<UserProfileDrawerModalProps> = ({
  visible,
  onClose,
  user,
  onToggleBanState,
  onPromoteDemote,
}) => {
  const { colors, theme } = useTheme();

  if (!visible || !user) return null;

  const isBanned = user.role === "banned";
  const isAdmin = user.role === "admin";

  const handleBanToggle = () => {
    const actionText = isBanned ? "Restore Access" : "Restrict / Ban Account";
    Alert.alert(
      `${actionText}?`,
      `Are you sure you want to ${isBanned ? "restore platform access for" : "restrict access for"} ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          style: isBanned ? "default" : "destructive",
          onPress: () => {
            if (onToggleBanState) {
              onToggleBanState(user.id, !isBanned);
            }
            onClose();
            Alert.alert("Account Updated", `User ${user.name} state updated.`);
          },
        },
      ]
    );
  };

  const handlePromoteDemoteToggle = () => {
    const targetRole = isAdmin ? "freelancer" : "admin";
    const actionText = isAdmin ? "Demote from Admin" : "Promote to Admin";
    Alert.alert(
      `${actionText}?`,
      `Change role for ${user.name} to ${targetRole.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          onPress: () => {
            if (onPromoteDemote) {
              onPromoteDemote(user.id, targetRole);
            }
            onClose();
            Alert.alert("Role Updated ⚡", `${user.name} updated to ${targetRole.toUpperCase()}.`);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>{user.id} • USER PROFILE ROSTER</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{user.name}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>{user.email}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Account Overview Cards */}
              <GlassCard variant="emerald" style={{ marginBottom: 14, padding: 14 }}>
                <View style={styles.overviewRow}>
                  <View>
                    <Text style={{ color: colors.accentEmerald, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>ACCOUNT ROLE</Text>
                    <Text style={[styles.roleTxt, { color: colors.textPrimary }]}>{user.role.toUpperCase()}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <StatusBadge
                      status={user.kycStatus === "approved" ? "active" : "pending"}
                      text={`KYC ${user.kycStatus.toUpperCase()}`}
                    />
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "700", marginTop: 4 }}>
                      Risk Score: {user.fraudScore}/100
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Identity & Payment Details */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>IDENTITY & PAYMENT DESTINATIONS</Text>
              <GlassCard style={{ padding: 14, marginBottom: 14 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>WALLETS / BANK ACCOUNTS</Text>
                <Text style={[styles.val, { color: colors.textPrimary }]}>
                  {user.walletAddress || "0x71C...39A2 (EVM / Web3)"}
                </Text>

                <Text style={[styles.label, { color: colors.textMuted, marginTop: 10 }]}>STRIPE CONNECT STATUS</Text>
                <Text style={[styles.val, { color: colors.accentEmerald }]}>
                  {user.stripeStatus || "Verified & Connected (Express)"}
                </Text>

                <Text style={[styles.label, { color: colors.textMuted, marginTop: 10 }]}>REGISTERED DATE</Text>
                <Text style={[styles.val, { color: colors.textPrimary }]}>{user.joinedDate}</Text>
              </GlassCard>

              {/* Admin Privilege Actions */}
              <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ADMIN CONTROL ACTIONS</Text>

              <View style={styles.actionRow}>
                <CustomButton
                  title={isAdmin ? "Demote from Admin" : "Promote to Admin ⚡"}
                  variant="outline"
                  onPress={handlePromoteDemoteToggle}
                  style={{ flex: 1 }}
                />

                <CustomButton
                  title={isBanned ? "Restore Access" : "Restrict Account 🚫"}
                  variant="danger"
                  onPress={handleBanToggle}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </GlassCard>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    maxHeight: "88%",
  },
  card: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderRadius: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  badgeTxt: {
    color: "#10b581",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeTxt: {
    fontSize: 14,
    fontWeight: "bold",
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleTxt: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  val: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
});
