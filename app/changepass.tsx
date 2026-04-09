import { loginApi } from "@/axios/axiosInstance";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const ChangePass = () => {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Basic Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      // Using loginApi since this is an auth route
      const response = await loginApi.post("/auth/change-password", {
        oldPassword,
        newPassword,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess("Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Optional: Route back after a short delay
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/");
          }
        }, 2000);
      }
    } catch (err: any) {
      console.log("Change Password Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to change password. Please check your old password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Lock color="#F2A20C" size={32} />
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>
            Enter your current and new password below.
          </Text>
        </View>

        {/* Status Messages */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {/* Old Password */}
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter current password"
            placeholderTextColor="#666"
            secureTextEntry={!showOldPass}
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TouchableOpacity
            onPress={() => setShowOldPass(!showOldPass)}
            style={styles.eyeIcon}
          >
            {showOldPass ? (
              <Eye color="#888" size={20} />
            ) : (
              <EyeOff color="#888" size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#666"
            secureTextEntry={!showNewPass}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            onPress={() => setShowNewPass(!showNewPass)}
            style={styles.eyeIcon}
          >
            {showNewPass ? (
              <Eye color="#888" size={20} />
            ) : (
              <EyeOff color="#888" size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Confirm New Password */}
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#666"
            secureTextEntry={!showNewPass}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangePass;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#262626",
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  label: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    height: 50,
  },
  input: {
    flex: 1,
    color: "#FFF",
    paddingHorizontal: 16,
    fontSize: 14,
    height: "100%",
    outlineStyle: "none" as any,
  },
  eyeIcon: {
    padding: 12,
  },
  submitButton: {
    backgroundColor: "#F2A20C",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: "#A67B27",
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF453A",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    padding: 10,
    borderRadius: 6,
  },
  successText: {
    color: "#32D74B",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
    backgroundColor: "rgba(50, 215, 75, 0.1)",
    padding: 10,
    borderRadius: 6,
  },
});
