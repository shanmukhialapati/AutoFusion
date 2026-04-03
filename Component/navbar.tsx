import {
    Bell,
    Heart,
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

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <View style={styles.navContainer}>
      {/* Brand Name */}
      <Text style={styles.brandName}>AUTOFUSION</Text>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Search color="#888" size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH PARTS..."
          placeholderTextColor="#666"
        />
      </View>

      {/* Icons Container */}
      <View style={styles.iconGroup}>
        {Platform.OS === "web" ? (
          <>
            <TouchableOpacity style={styles.iconBtn}>
              <Heart color="#FFF" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <ShoppingCart color="#FFF" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell color="#FFF" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <User color="#F2A20C" size={24} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell color="#FFF" size={22} />
            </TouchableOpacity>
            {/* Profile icon triggers dropdown on Android */}
            <TouchableOpacity style={styles.iconBtn} onPress={toggleMenu}>
              <User color="#F2A20C" size={24} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Android Dropdown Modal */}
      {Platform.OS !== "web" && (
        <Modal
          visible={isMenuOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={toggleMenu}
        >
          <Pressable style={styles.modalOverlay} onPress={toggleMenu}>
            <View style={styles.dropdownContent}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>MENU</Text>
                <TouchableOpacity onPress={toggleMenu}>
                  <X color="#F2A20C" size={24} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.menuItem}>
                <Heart color="#FFF" size={20} />
                <Text style={styles.menuText}>WISHLIST</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <ShoppingCart color="#FFF" size={20} />
                <Text style={styles.menuText}>CART</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <User color="#FFF" size={20} />
                <Text style={styles.menuText}>PROFILE</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    height: 70,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderColor: "#333",
    ...Platform.select({
      web: {
        paddingHorizontal: 40,
      },
    }),
  },
  brandName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
  },
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
    ...Platform.select({
      android: {
        maxWidth: 150, // Smaller on mobile
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  iconBtn: {
    padding: 5,
  },
  // Modal Styles for Android
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
  dropdownTitle: {
    color: "#F2A20C",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 15,
  },
  menuText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default Navbar;
