import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../../components/GlassCard";

interface MessagesScreenProps {
  onOpenDrawer: () => void;
  onNavigateTab?: (tabKey: string) => void;
  contractId?: string;
  contractTitle?: string;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onOpenDrawer,
  onNavigateTab,
  contractId,
  contractTitle,
}) => {
  const { profile } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();

  const [activeChatId, setActiveChatId] = useState("CHAT-101");
  const [inputText, setInputText] = useState("");

  const chats = [
    { id: "CHAT-101", name: "TechCorp Labs (Client)", project: "Full-Stack Smart Contract DApp", lastMsg: "Looks great! Sending milestone escrow funds...", time: "10:42 AM", unread: true },
    { id: "CHAT-102", name: "Apex Financial", project: "Cross-Chain Token Bridge UI", lastMsg: "Thanks for submitting the repository link.", time: "Yesterday", unread: false },
  ];

  const contractMessages = contractId
    ? [
        { id: "CM1", sender: "client", text: `Hi! Regarding contract ${contractId} — ${contractTitle || "our contract"}: please confirm you've seen the latest milestone requirements.`, time: "9:00 AM" },
        { id: "CM2", sender: "me", text: "Yes, I've reviewed the requirements. I'll begin work today and update you on progress.", time: "9:15 AM" },
      ]
    : null;

  const [messages, setMessages] = useState([
    { id: "M1", sender: "client", text: "Hello! We reviewed your pitch for the Staking Contract. Can you deploy on Goerli first?", time: "10:30 AM" },
    { id: "M2", sender: "me", text: "Hi! Absolutely, I have automated Hardhat scripts ready for Sepolia and Goerli testnets.", time: "10:35 AM" },
    { id: "M3", sender: "client", text: "Looks great! Sending milestone escrow funds right now.", time: "10:42 AM" },
  ]);

  const displayMessages = contractMessages ?? messages;

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `M-${Date.now()}`, sender: "me", text: inputText.trim(), time: "Just now" },
    ]);
    setInputText("");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with Notification Bell */}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {contractTitle ? contractTitle : "Messages Chat"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {contractId ? `Contract ${contractId}` : "Real-Time Client Inbox"}
          </Text>
        </View>

        {/* Notification Bell Button */}
        {onNavigateTab && (
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => onNavigateTab("notifications")}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeTxt}>3</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{theme === "dark" ? "☀️" : "🌙"}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {/* Active Conversation Messages Stream */}
        {contractId && (
          <View style={[styles.contractBanner, { backgroundColor: "rgba(59,130,246,0.12)", borderColor: "rgba(59,130,246,0.3)" }]}>
            <Text style={{ color: "#60a5fa", fontSize: 11, fontWeight: "900" }}>
              💬 Contract Chat: {contractId}
            </Text>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.msgScroll} showsVerticalScrollIndicator={false}>
          {displayMessages.map((m) => {
            const isMe = m.sender === "me";
            return (
              <View
                key={m.id}
                style={[
                  styles.msgBubble,
                  isMe ? styles.myMsgBubble : styles.clientMsgBubble,
                  {
                    backgroundColor: isMe ? "rgba(16, 185, 129, 0.25)" : colors.cardBg,
                    borderColor: isMe ? "#10b581" : colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.msgTxt, { color: colors.textPrimary }]}>{m.text}</Text>
                <Text style={[styles.msgTime, { color: colors.textMuted }]}>{m.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Chat Input Field Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.headerBg, borderTopColor: colors.cardBorder }]}>
          <TextInput
            style={[styles.chatInput, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Type your message..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} activeOpacity={0.8}>
            <Text style={styles.sendBtnTxt}>Send ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeTxt: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  themeToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  msgScroll: { padding: 16, paddingBottom: 20 },
  msgBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  myMsgBubble: { alignSelf: "flex-end", borderBottomRightRadius: 2 },
  clientMsgBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 2 },
  msgTxt: { fontSize: 13, lineHeight: 18 },
  msgTime: { fontSize: 9, fontWeight: "700", marginTop: 4, textAlign: "right" },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
    alignItems: "center",
    marginBottom: Platform.OS === "android" ? 70 : 60,
  },
  chatInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  sendBtn: {
    backgroundColor: "#10b581",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendBtnTxt: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  contractBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});
