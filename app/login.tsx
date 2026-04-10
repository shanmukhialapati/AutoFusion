import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { Car, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginApi } from "../axios/axiosInstance";
import { useAuth } from "../Context/authcontext";

const LoginPage = () => {
  const { setAuth } = useAuth();
  const router = useRouter();
  const { height } = useWindowDimensions();

  // State Management
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (emailStr: string) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return gmailRegex.test(emailStr);
  };

  const handleAuth = async () => {
    setError("");
    setLoading(true);

    // Validation
    if (!email || !password || (!isLogin && (!username || !confirmPassword))) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Email must be a @gmail.com address.");
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // LOGIN API CALL
        const response = await loginApi.post("/auth/login", {
          email: email,
          password: password,
        });

        if (response.data.token) {
          try {
            // Decode the token to check the role inside it
            const decodedToken: any = jwtDecode(response.data.token);

            // Check if the role is exactly "USER"
            if (decodedToken.role !== "USER") {
              setError(
                "Access denied. Only standard users can log in to this app.",
              );
              setLoading(false);
              return; // Stop the login process here
            }

            // If role is correct, proceed with login
            await setAuth({ token: response.data.token });
            router.replace("/");
          } catch (decodeError) {
            setError("Error reading user credentials.");
            setLoading(false);
            return;
          }
        } else {
          setError("Invalid response from server.");
        }
      } else {
        // SIGNUP API CALL
        const response = await loginApi.post("/auth/signup", {
          username: username,
          email: email,
          password: password,
          confirmPassword: confirmPassword,
        });

        if (response.data.token) {
          await setAuth({ token: response.data.token });
          Alert.alert("Success", "Account created and logged in!");
          router.replace("/");
        } else {
          Alert.alert("Success", "Account created! Please sign in.");
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Authentication failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/automobile_bg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.inner}
            >
              <View style={styles.webCardWrapper}>
                <View
                  style={[
                    styles.contentContainer,
                    { maxHeight: height * 0.85 },
                  ]}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                  >
                    {/* Header Section */}
                    <View style={styles.headerContainer}>
                      <View style={styles.logoCircle}>
                        <Car color="#F2A20C" size={40} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.brandName}>AUTOFUSION</Text>
                      <Text style={styles.tagline}>PREMIUM SPARE PARTS</Text>
                    </View>

                    <View style={styles.formContainer}>
                      <Text style={styles.welcomeText}>
                        {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
                      </Text>

                      {error ? (
                        <View style={styles.errorBox}>
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      ) : null}

                      {/* Signup only field: Username */}
                      {!isLogin && (
                        <View style={styles.inputWrapper}>
                          <User color="#666" size={20} style={styles.icon} />
                          <TextInput
                            style={styles.input}
                            placeholder="USERNAME"
                            placeholderTextColor="#666"
                            value={username}
                            onChangeText={setUsername}
                          />
                        </View>
                      )}

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
                            setError("");
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
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff color="#666" size={20} />
                          ) : (
                            <Eye color="#666" size={20} />
                          )}
                        </TouchableOpacity>
                      </View>

                      {!isLogin && (
                        <View style={styles.inputWrapper}>
                          <Lock color="#666" size={20} style={styles.icon} />
                          <TextInput
                            style={styles.input}
                            placeholder="CONFIRM PASSWORD"
                            placeholderTextColor="#666"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                          />
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleAuth}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#1A1A1A" />
                        ) : (
                          <Text style={styles.loginButtonText}>
                            {isLogin ? "SIGN IN" : "REGISTER"}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.footer}
                        onPress={() => {
                          setIsLogin(!isLogin);
                          setError("");
                        }}
                      >
                        <Text style={styles.footerText}>
                          {isLogin
                            ? "Don't have an account? "
                            : "Already have an account? "}
                        </Text>
                        <Text style={styles.signUpText}>
                          {isLogin ? "SIGN UP" : "LOG IN"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
    paddingBottom: 50,
  },
  contentContainer: {
    width: "100%",
    overflow: "hidden",
    ...Platform.select({
      web: {
        maxWidth: 450,
        backgroundColor: "rgba(34, 34, 34, 0.9)",
        paddingHorizontal: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#444",
      },
      android: {
        backgroundColor: "rgba(26, 26, 26, 0.7)",
        borderRadius: 12,
        paddingHorizontal: 20,
      },
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
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: Platform.OS === "web" ? "fixed" : "absolute",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 4,
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
    marginBottom: 10,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "rgba(255, 69, 58, 0.15)",
    padding: 10,
    borderRadius: 4,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#FF453A",
  },
  errorText: { color: "#FF453A", fontSize: 12, fontWeight: "600" },
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
  inputErrorBorder: { borderColor: "#FF453A" },
  icon: { marginRight: 10 },
  input: { flex: 1, color: "#FFF", fontSize: 14 },
  loginButton: {
    backgroundColor: "#F2A20C",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#AAA", fontSize: 14 },
  signUpText: { color: "#F2A20C", fontSize: 14, fontWeight: "700" },
});

export default LoginPage;
