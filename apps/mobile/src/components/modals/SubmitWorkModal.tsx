import React, { useState } from "react";
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
import { GlassCard } from "../GlassCard";
import { CustomButton } from "../CustomButton";

interface SubmitWorkModalProps {
  visible: boolean;
  onClose: () => void;
  contractTitle?: string;
  milestoneTitle?: string;
  onSubmitWork: (deliverable: {
    workLink: string;
    description: string;
    attachments: string;
  }) => void;
}

export const SubmitWorkModal: React.FC<SubmitWorkModalProps> = ({
  visible,
  onClose,
  contractTitle = "Full-Stack Smart Contract DApp",
  milestoneTitle = "Milestone 1: Smart Contract Audit & Deployment",
  onSubmitWork,
}) => {
  const [workLink, setWorkLink] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState("");
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert("Missing Details", "Please provide a description of the completed work.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmitWork({
        workLink: workLink.trim() || "https://github.com/chainwork/deliverable-v1",
        description: description.trim(),
        attachments: attachments.trim() || "audit_report_signed.pdf",
      });
      setWorkLink("");
      setDescription("");
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
                <Text style={styles.badgeTxt}>SUBMIT DELIVERABLE WORK</Text>
                <Text style={styles.title} numberOfLines={1}>
                  {contractTitle}
                </Text>
                <Text style={styles.subtitle}>{milestoneTitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Work Repository / Live Link */}
              <Text style={styles.label}>Live Repository / Deliverable URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://github.com/myorg/project or IPFS CID"
                placeholderTextColor="#64748b"
                value={workLink}
                onChangeText={setWorkLink}
                autoCapitalize="none"
              />

              {/* Work Summary */}
              <Text style={styles.label}>Summary of Completed Work & Deliverables</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what was accomplished in this milestone phase..."
                placeholderTextColor="#64748b"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              {/* Attachments */}
              <Text style={styles.label}>Proof Documents / File Links</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. documentation.pdf, test_report.zip"
                placeholderTextColor="#64748b"
                value={attachments}
                onChangeText={setAttachments}
              />

              {/* Information Banner */}
              <View style={styles.infoBanner}>
                <Text style={{ fontSize: 16 }}>📜</Text>
                <Text style={styles.infoTxt}>
                  Submitting this deliverable will notify the client to review your work and trigger escrow release.
                </Text>
              </View>

              {/* Submit Button */}
              <CustomButton
                title="Submit Work & Request Escrow Release"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 14, marginBottom: 20 }}
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    marginBottom: 16,
  },
  badgeTxt: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
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
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 14,
  },
  infoTxt: {
    flex: 1,
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
});
