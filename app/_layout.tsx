// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Stack, usePathname, useRouter } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import React, { useEffect, useState } from "react";
// import { ActivityIndicator, View } from "react-native";
// import "react-native-reanimated";

// export default function RootLayout() {
//   const router = useRouter();
//   const pathname = usePathname();

//   const [loading, setLoading] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   // 🔐 Check Auth
//   useEffect(() => {
//     const checkAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");

//         if (token) {
//           setIsLoggedIn(true);
//         } else {
//           setIsLoggedIn(false);
//         }
//       } catch (err) {
//         console.log("Auth error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     checkAuth();
//   }, []);

//   // 🚦 Handle Routing
//   useEffect(() => {
//     if (loading) return;

//     if (isLoggedIn && pathname === "/login") {
//       router.replace("/");
//     }
//   }, [loading, isLoggedIn, pathname]);

//   // ⏳ Loader
//   if (loading) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="index" />
//         <Stack.Screen name="login" />
//       </Stack>

//       <StatusBar style="dark" />
//     </>
//   );
// }
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context"; //
import Navbar from "../Component/navbar";

function RootLayoutContent() {
  const insets = useSafeAreaInsets(); //

  return (
    <View style={styles.container}>
      {/* Apply top padding ONLY to the Navbar container to respect the notch */}
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

      <StatusBar style="light" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
});
