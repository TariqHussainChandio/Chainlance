import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";

export interface GigData {
  id: string;
  title: string;
  category: string;
  price: string;
  status: "published" | "draft" | "unpublished";
  description: string;
  skills: string;
}

interface EditGigModalProps {
  visible: boolean;
  onClose: () => void;
  gig?: GigData | null;
  onSaveGig: (updated: GigData) => void;
}

export const EditGigModal: React.FC<EditGigModalProps> = ({
  visible,
  onClose,
  gig,
  onSaveGig,
}) => {
  const { colors, theme } = useTheme();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Smart Contracts");
  const [price, setPrice] = useState("$1,500");
  const [status, setStatus] = useState<"published" | "draft" | "unpublished">("published");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gig) {
      setTitle(gig.title);
      setCategory(gig.category);
      setPrice(gig.price);
      setStatus(gig.status);
      setDescription(gig.description);
      setSkills(gig.skills);
    }
  }, [gig]);

  if (!visible) return null;

  const handleSave = () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert("Missing Fields", "Gig title and starting price are required.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSaveGig({
        id: gig?.id || `gig_${Date.now()}`,
        title: title.trim(),
        category,
        price: price.trim(),
        status,
        description: description.trim(),
        skills: skills.trim(),
      });
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <GlassCard variant="elevated" style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeTxt}>MANAGE SERVICE GIG</Text>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Gig Details</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={[styles.closeTxt, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Gig Title</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Full-Stack Smart Contract DApp"
                placeholderTextColor="#64748b"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Starting Price ($)</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={price}
                onChangeText={setPrice}
                placeholder="$1,500"
                placeholderTextColor="#64748b"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Publication Status</Text>
              <View style={styles.statusRow}>
                {(["published", "draft", "unpublished"] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusPill,
                      { borderColor: colors.cardBorder },
                      status === st && { backgroundColor: colors.accentEmerald, borderColor: colors.accentEmerald },
                    ]}
                    onPress={() => setStatus(st)}
                  >
                    <Text
                      style={[
                        styles.statusPillTxt,
                        { color: status === st ? "#ffffff" : colors.textMuted },
                      ]}
                    >
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Describe your service deliverables..."
                placeholderTextColor="#64748b"
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Skills & Tags</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={skills}
                onChangeText={setSkills}
                placeholder="Solidity, React Native, Hardhat"
                placeholderTextColor="#64748b"
              />

              <CustomButton
                title="Save Gig Modifications"
                onPress={handleSave}
                loading={loading}
                style={{ marginTop: 16, marginBottom: 20 }}
              />
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    width: "100%",
    maxHeight: "90%",
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
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  statusPillTxt: {
    fontSize: 10,
    fontWeight: "900",
  },
});
