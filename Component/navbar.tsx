import { useRouter } from "expo-router";
import {
  Bell,
  Heart,
  LogOut,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../Context/authcontext"; //

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setAuth } = useAuth(); //
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleProfilePress = () => {
    if (!user) {
      router.push("/login"); //
    } else {
      toggleMenu();
    }
  };

  const handleLogout = async () => {
    await setAuth(null); //
    setIsMenuOpen(false);
    router.replace("/login");
  };

  return (
    <View style={styles.navContainer}>
      {/* Top Section: Brand and Icons (Always in a row) */}
      <View style={styles.topSection}>
        <Text style={styles.brandName} onPress={() => router.push("/")}>
          AUTOFUSION
        </Text>

        {/* Search Box: Only rendered here for Web (inline) */}
        {Platform.OS === "web" && (
          <View style={styles.searchContainer}>
            <Search color="#888" size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH PARTS..."
              placeholderTextColor="#666"
            />
          </View>
        )}

        {/* Icons Group */}
        <View style={styles.iconGroup}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell color="#FFF" size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleProfilePress}>
            <User color={user ? "#F2A20C" : "#FFF"} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section: Search Box (Only rendered here for Android/iOS) */}
      {Platform.OS !== "web" && (
        <View style={styles.searchContainerMobile}>
          <Search color="#888" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH PARTS..."
            placeholderTextColor="#666"
          />
        </View>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={isMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleMenu}>
          <View style={styles.dropdownContent}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>ACCOUNT</Text>
              <TouchableOpacity onPress={toggleMenu}>
                <X color="#F2A20C" size={24} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.menuItem}>
              <User color="#FFF" size={20} />
              <Text style={styles.menuText}>MY PROFILE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/wishlist")}
            >
              <Heart color="#FFF" size={20} />
              <Text style={styles.menuText}>WISHLIST</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/cart")}
            >
              <ShoppingCart color="#FFF" size={20} />
              <Text style={styles.menuText}>CART</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/address")}
            >
              <ShoppingCart color="#FFF" size={20} />
              <Text style={styles.menuText}>ADDRESS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <LogOut color="#FF453A" size={20} />
              <Text style={[styles.menuText, { color: "#FF453A" }]}>
                LOGOUT
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 2,
    borderColor: "#333",
    paddingHorizontal: 20,
    justifyContent: "center",
    // Increased height for Android to accommodate two rows
    height: Platform.OS === "web" ? 70 : 120,
    ...Platform.select({
      web: { paddingHorizontal: 40 },
    }),
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  brandName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
  },
  // Style for Web (Inline)
  searchContainer: {
    flex: 1,
    maxWidth: 400,
    height: 40,
    backgroundColor: "#262626",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#444",
  },
  // Style for Mobile (Below Brand)
  searchContainerMobile: {
    width: "100%",
    height: 40,
    backgroundColor: "#262626",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 15,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#444",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: "#FFF", fontSize: 12, fontWeight: "600" },
  iconGroup: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBtn: { padding: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 20,
  },
  dropdownContent: {
    width: 200,
    backgroundColor: "#222",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#F2A20C",
    padding: 15,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 10,
  },
  dropdownTitle: { color: "#F2A20C", fontWeight: "900", fontSize: 16 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 15,
  },
  menuText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});

export default Navbar;
