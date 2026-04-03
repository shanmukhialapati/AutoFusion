import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

const LoginRouteButton: React.FC = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8} // Adds a nice vintage "press" feel
      style={styles.button}
      // In Expo Router, if you use typed routes, this will autocomplete!
      onPress={() => router.push("/login")}
    >
      <Text style={styles.buttonText}>GO TO LOGIN</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#F2A20C",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#000",
    alignSelf: "center",
    marginTop: 20,
    // Add a small shadow for that "bold" look
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
  } as ViewStyle,
  buttonText: {
    color: "#1A1A1A",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 16,
    textTransform: "uppercase",
  },
});

export default LoginRouteButton;
