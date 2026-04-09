import Stack from "expo-router/stack";
import React from "react";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="CategoryDetails" options={{ headerShown: false }} />
      <Stack.Screen name="productsDetails" options={{ headerShown: false }} />
      <Stack.Screen
        name="ViewProductDetails"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
