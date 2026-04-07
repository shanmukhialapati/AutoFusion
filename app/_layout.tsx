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
import { AuthProvider } from "../Context/authcontext";
import { NotificationProvider } from "../Context/notificationContext";

function RootLayoutContent() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.navbarWrapper, { paddingTop: insets.top }]}>
        <Navbar />
      </View>

      <View style={styles.content}>
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
      </View>

      <StatusBar style="light" />
    </View>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationProvider>
        {/* 🔐 The AuthProvider MUST be here to wrap the entire app */}
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </NotificationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },

  navbarWrapper: {
    backgroundColor: "#1A1A1A",
    zIndex: 1000,
    elevation: 20,
  },

  content: {
    flex: 1,
    zIndex: 1,
  },
});
