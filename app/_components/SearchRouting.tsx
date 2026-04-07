import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) return;

    const searchLow = query.toLowerCase().trim();

    /* LOGIC FLOW:
       1. If query matches a Category name -> Route to CategoryDetails
       2. If query matches a Product name -> Route to ProductDetails
       3. Default -> Route to a Search Results page
    */

    // Example routing logic:
    if (searchLow.includes("engine") || searchLow.includes("brake")) {
      router.push({
        pathname: "/_components/CategoryDetails",
        params: { categoryName: query, categoryId: "1" }, // Map IDs dynamically in production
      });
    } else {
      // Fallback to a general search results page
      router.push({
        pathname: "/_components/productsDetails",
        params: { q: query },
      });
    }
  };

  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#64748B" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search parts, brands, or categories..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch} // Triggers on "Enter" or "Search" key
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery("")}>
          <Ionicons name="close-circle" size={18} color="#CBD5E1" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    marginHorizontal: 20,
    marginTop: 10,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
  },
});
