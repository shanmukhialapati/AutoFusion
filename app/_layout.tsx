import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Navbar from "../Component/navbar";
import { AuthProvider } from "../Context/authcontext"; //

function RootLayoutContent() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Navbar with notch protection */}
      <View style={{ paddingTop: insets.top, backgroundColor: "#1A1A1A" }}>
        <Navbar />
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#1A1A1A" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack>
      {/* <View style={{ paddingTop: insets.top, backgroundColor: "#1A1A1A" }}>
        <Footer />
      </View> */}
      <StatusBar style="light" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* 🔐 The AuthProvider MUST be here to wrap the entire app */}
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
});
