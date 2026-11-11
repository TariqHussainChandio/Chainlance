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

interface CreateGigModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGig: (gig: {
    title: string;
    category: string;
    price: string;
    deliveryTime: string;
    description: string;
    features: string[];
  }) => void;
}

const CATEGORIES = [
  "Smart Contract Dev",
  "Security Audit",
  "UI/UX Design",
  "Fullstack dApp",
  "Consulting & Architecture",
];

export const CreateGigModal: React.FC<CreateGigModalProps> = ({
  visible,
  onClose,
  onCreateGig,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("3 Days");
  const [description, setDescription] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([
    "Source Code Delivery",
    "Comprehensive Test Suite",
    "Deployment Script included",
  ]);

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title.trim() || !price.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please enter title, price, and description.");
      return;
    }

    onCreateGig({
      title: title.trim(),
      category,
      price: price.startsWith("$") ? price.trim() : `$${price.trim()}`,
      deliveryTime,
      description: description.trim(),
      features,
    });

    setTitle("");
    setPrice("");
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Create New Service Gig</Text>
              <Text style={styles.subtitle}>List your expertise to global clients</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <Text style={styles.label}>Gig Service Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. I will write & audit your ERC-20 Staking Smart Contract"
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
                <Text style={styles.label}>Base Price (USD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 750"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Delivery Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5 Days"
                  placeholderTextColor="#64748b"
                  value={deliveryTime}
                  onChangeText={setDeliveryTime}
                />
              </View>
            </View>

            <Text style={styles.label}>Included Features / Deliverables</Text>
            <View style={styles.featureInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="e.g. Gas Optimization Report..."
                placeholderTextColor="#64748b"
                value={featureInput}
                onChangeText={setFeatureInput}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddFeature}>
                <Text style={styles.addTxt}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresList}>
              {features.map((f, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Text style={styles.featureTxt}>✓ {f}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFeature(idx)}>
                    <Text style={styles.removeTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <Text style={styles.label}>Detailed Description & Scope *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detail what clients will receive, prerequisites, tech stack, and revision terms..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <GlassCard style={styles.infoCard}>
              <Text style={styles.infoTitle}>⚡ Instant Escrow Order Ready</Text>
              <Text style={styles.infoDesc}>
                Once published, clients can immediately order your service. Funds will be deposited directly into ChainWork smart escrow.
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
                title="Publish Gig"
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
  featureInputRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  addBtn: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addTxt: { color: "#34d399", fontWeight: "800", fontSize: 13 },
  featuresList: { gap: 6, marginBottom: 8 },
  featureItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureTxt: { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },
  removeTxt: { color: "#ef4444", fontSize: 12, fontWeight: "bold" },
  infoCard: { padding: 14, marginVertical: 14 },
  infoTitle: { color: "#34d399", fontWeight: "800", fontSize: 13 },
  infoDesc: { color: "#94a3b8", fontSize: 11, marginTop: 4, lineHeight: 16 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 10 },
});
