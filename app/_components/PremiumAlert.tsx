import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Added 'confirm' to the type definition
type AlertType = "success" | "warning" | "error" | "confirm";

interface Props {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const PremiumAlert: React.FC<Props> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "CANCEL",
}) => {
  
  const isConfirmType = type === "confirm";

  const getTheme = () => {
    switch (type) {
      case "success":
        return {
          color: "#10b981",
          btnBg: "#00b359",
          icon: "checkmark-circle",
          bgCircle: "#ecfdf5",
        };
      case "warning":
        return {
          color: "#f59e0b",
          btnBg: "#ffb300",
          icon: "warning",
          bgCircle: "#fffbeb",
        };
      case "error":
        return {
          color: "#f43f5e",
          btnBg: "#ff0000",
          icon: "alert-circle",
          bgCircle: "#fef2f2",
        };
      case "confirm":
        return {
          color: "#3b82f6", // Premium Blue for confirmation
          btnBg: "#3b82f6",
          icon: "help-circle",
          bgCircle: "#eff6ff",
        };
      default:
        return {
          color: "#64748b",
          btnBg: "#64748b",
          icon: "information-circle",
          bgCircle: "#f8fafc",
        };
    }
  };

  const theme = getTheme();

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.alertBox}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View
              style={[
                styles.mainCircle,
                { borderColor: theme.color, backgroundColor: theme.bgCircle },
              ]}
            >
              <Ionicons
                name={theme.icon as any}
                size={40}
                color={theme.color}
              />
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.divider} />

          <View
            style={[
              styles.buttonRow,
              !isConfirmType && { justifyContent: "center" },
            ]}
          >
            {/* Cancel button only shows for 'confirm' type */}
            {isConfirmType && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={[styles.btn, styles.cancelBtn]}
              >
                <Text style={styles.cancelText}>
                  {cancelText.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onConfirm || onClose}
              style={[
                styles.btn,
                { backgroundColor: theme.btnBg },
                !isConfirmType && { maxWidth: 200 }, // Center and constrain if single button
              ]}
            >
              <Text style={styles.confirmText}>
                {confirmText.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  alertBox: {
    width: Math.min(width - 40, 340),
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    paddingTop: 32,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  mainCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  textSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 5,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  confirmText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cancelText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

export default PremiumAlert;
