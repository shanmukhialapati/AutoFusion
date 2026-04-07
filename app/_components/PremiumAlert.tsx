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

type AlertType = "success" | "warning" | "error";

interface Props {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

const PremiumAlert: React.FC<Props> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
}) => {
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
        {/* Backdrop */}
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        {/* Alert Container */}
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.alertBox}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#94a3b8" />
          </TouchableOpacity>

          {/* Icon Section */}
          <View style={styles.iconContainer}>
            <View />
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

          {/* Text Content */}
          <View style={styles.textSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.divider} />

          {/* Confirm Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onConfirm || onClose}
            style={[styles.confirmBtn, { backgroundColor: theme.btnBg }]}
          >
            <Text style={styles.confirmText}>{confirmText.toUpperCase()}</Text>
          </TouchableOpacity>
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
    backgroundColor: "rgba(15, 23, 42, 0.4)",
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
    borderWidth: 1,
    borderColor: "#f8fafc",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  blurBg: {
    position: "absolute",
    width: 80,
    height: 40,
    borderRadius: 40,
    opacity: 0.5,
    transform: [{ scale: 1.5 }],
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
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 20,
  },
  confirmBtn: {
    width: "100%",
    maxWidth: 220,
    paddingVertical: 14,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
});

export default PremiumAlert;
