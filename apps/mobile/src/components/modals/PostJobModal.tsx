import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";

interface PostJobModalProps {
  visible: boolean;
  onClose: () => void;
  onPostJob: (job: {
    title: string;
    category: string;
    budget: string;
    deadline: string;
    description: string;
    skills: string[];
  }) => void;
}

const CATEGORIES = [
  "Smart Contracts & Web3",
  "UI/UX & Mobile Design",
  "DeFi & Security Audits",
  "Fullstack Web3 App",
  "Tokenomics & Strategy",
];

export const PostJobModal: React.FC<PostJobModalProps> = ({
  visible,
  onClose,
  onPostJob,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("7 Days");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(["Solidity", "React Native"]);

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim() || !budget.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required job fields.");
      return;
    }

    onPostJob({
      title: title.trim(),
      category,
      budget: budget.startsWith("$") ? budget.trim() : `$${budget.trim()}`,
      deadline,
      description: description.trim(),
      skills,
    });

    // Reset
    setTitle("");
    setBudget("");
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Post a New Job</Text>
              <Text style={styles.subtitle}>Hire verified Web3 & Blockchain experts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Audit ERC20 Smart Contract & Staking Vault"
              placeholderTextColor="#64748b"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catTxt, category === cat && styles.catTxtActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Budget (USD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2500"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Timeline</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 14 Days"
                  placeholderTextColor="#64748b"
                  value={deadline}
                  onChangeText={setDeadline}
                />
              </View>
            </View>

            <Text style={styles.label}>Required Skills & Tech Stack</Text>
            <View style={styles.skillInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Add skill (e.g. Ethers.js)..."
                placeholderTextColor="#64748b"
                value={skillInput}
                onChangeText={setSkillInput}
              />
              <TouchableOpacity style={styles.addSkillBtn} onPress={handleAddSkill}>
                <Text style={styles.addSkillTxt}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.skillsContainer}>
              {skills.map((s, idx) => (
                <View key={idx} style={styles.skillTag}>
                  <Text style={styles.skillTagTxt}>{s}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSkill(idx)}>
                    <Text style={styles.removeSkillTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>Project Scope & Requirements *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe deliverables, milestone expectations, and code repository links..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>🔒 Smart Contract Escrow Guarantee</Text>
              <Text style={styles.infoDesc}>
                Posting is free. Funds are only deposited into Escrow once you select and hire a freelancer.
              </Text>
            </GlassCard>

            <View style={styles.btnRow}>
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <CustomButton
                title="Publish Job Posting"
                onPress={handleSubmit}
                style={{ flex: 1.5 }}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0d1f17",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: { color: "#ffffff", fontSize: 18, fontWeight: "900" },
  subtitle: { color: "#34d399", fontSize: 12, fontWeight: "600", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeTxt: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  scrollBody: { padding: 20 },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  twoCol: { flexDirection: "row", gap: 12 },
  catRow: { flexDirection: "row", marginBottom: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b581",
  },
  catTxt: { color: "#94a3b8", fontSize: 12, fontWeight: "600" },
  catTxtActive: { color: "#34d399", fontWeight: "800" },
  skillInputRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  addSkillBtn: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addSkillTxt: { color: "#34d399", fontWeight: "800", fontSize: 13 },
  skillsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  skillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  skillTagTxt: { color: "#38bdf8", fontSize: 12, fontWeight: "700" },
  removeSkillTxt: { color: "#ef4444", fontSize: 12, fontWeight: "bold" },
  infoCard: { padding: 14, marginVertical: 14 },
  infoTitle: { color: "#34d399", fontWeight: "800", fontSize: 13 },
  infoDesc: { color: "#94a3b8", fontSize: 11, marginTop: 4, lineHeight: 16 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 10 },
});
