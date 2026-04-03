import { Car, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // State to hold validation messages
  const { height } = useWindowDimensions();

  // Regex to enforce: letters/numbers + @gmail.com
  const validateEmail = (emailStr: string) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(emailStr);
  };

  const handleLogin = () => {
    setError(""); // Clear previous errors

    // 1. Check for empty fields
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // 2. Validate Gmail format
    if (!validateEmail(email)) {
      setError("Email must be in the format: username@gmail.com");
      return;
    }

    // 3. Password length check (example validation)
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    console.log("Validation Successful. Logging in with:", email);
    // Proceed with your Auth API logic here
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1486006396113-ad7b3276bc21?q=80&w=2100",
        }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={10}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.inner}
            >
              <View style={styles.webCardWrapper}>
                <View
                  style={[styles.contentContainer, { maxHeight: height * 0.9 }]}
                >
                  {/* Header Section */}
                  <View style={styles.headerContainer}>
                    <View style={styles.logoCircle}>
                      <Car color="#F2A20C" size={40} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.brandName}>AUTOFUSION</Text>
                    <Text style={styles.tagline}>PREMIUM SPARE PARTS</Text>
                  </View>

                  {/* Form Section */}
                  <View style={styles.formContainer}>
                    <Text style={styles.welcomeText}>WELCOME BACK</Text>

                    {/* Error Message Display */}
                    {error ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.inputWrapper,
                        error.includes("Email") && styles.inputErrorBorder,
                      ]}
                    >
                      <Mail color="#666" size={20} style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="USERNAME@GMAIL.COM"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          setError(""); // Clear error while typing
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>

                    <View
                      style={[
                        styles.inputWrapper,
                        error.includes("Password") && styles.inputErrorBorder,
                      ]}
                    >
                      <Lock color="#666" size={20} style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="PASSWORD"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError("");
                        }}
                        secureTextEntry
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={handleLogin}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loginButtonText}>SIGN IN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A" },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)" },
  inner: { flex: 1, justifyContent: "center" },
  webCardWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  contentContainer: {
    width: "100%",
    ...Platform.select({
      web: {
        maxWidth: 450,
        backgroundColor: "rgba(34, 34, 34, 0.9)",
        padding: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#444",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
      },
      android: { backgroundColor: "transparent" },
    }),
  },
  headerContainer: { alignItems: "center", marginBottom: 30 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#F2A20C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-condensed",
  },
  tagline: {
    fontSize: 10,
    color: "#F2A20C",
    letterSpacing: 2,
    fontWeight: "600",
  },
  formContainer: { width: "100%" },
  welcomeText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 1,
  },

  // Validation Styles
  errorBox: {
    backgroundColor: "rgba(255, 69, 58, 0.15)",
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#FF453A",
  },
  errorText: { color: "#FF453A", fontSize: 12, fontWeight: "600" },
  inputErrorBorder: { borderColor: "#FF453A" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(38, 38, 38, 0.8)",
    borderWidth: 1,
    borderColor: "#444",
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 12,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: "#FFF", fontSize: 14, fontWeight: "600" },
  loginButton: {
    backgroundColor: "#F2A20C",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 8,
  },
  loginButtonText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  forgotPassword: { marginTop: 15, alignItems: "center" },
  forgotText: { color: "#AAA", fontSize: 12, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: "#AAA", fontSize: 12 },
  signUpText: { color: "#F2A20C", fontSize: 12, fontWeight: "700" },
});

export default LoginPage;
