import { categoryApi } from "@/axios/axiosInstance";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../Context/authcontext";
import { useNotifications } from "../Context/notificationContext";
import NotificationDrawer from "./NotificationDrawer";

const SearchBar = React.memo(
  ({
    selectedBrand,
    setSelectedBrand,
    showBrandDropdown,
    setShowBrandDropdown,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    brands,
  }: any) => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
      const delay = setTimeout(async () => {
        if (!searchQuery.trim()) {
          setSuggestions([]);
          return;
        }

        try {
          const res = await fetch(
            `http://192.168.0.157:8080/api/products/search?q=${searchQuery}`,
          );
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        } catch (err) {
          console.log("Search error", err);
        }
      }, 400);

      return () => clearTimeout(delay);
    }, [searchQuery]);

    return (
      <View style={{ position: "relative" }}>
        <View style={styles.combinedSearchContainer}>
          <TouchableOpacity
            style={styles.brandSelector}
            onPress={() => setShowBrandDropdown(!showBrandDropdown)}
          >
            <Text style={styles.brandSelectorText} numberOfLines={1}>
              {selectedBrand ? selectedBrand.name.toUpperCase() : "ALL BRANDS"}
            </Text>
            <ChevronDown color="#888" size={14} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search parts..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(true);
            }}
            onSubmitEditing={handleSearchSubmit}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            onPress={handleSearchSubmit}
            style={styles.searchIconBtn}
          >
            <Search color="#F2A20C" size={20} />
          </TouchableOpacity>
        </View>

        {showBrandDropdown && (
          <View style={styles.dropdownOverlay}>
            <FlatList
              data={[{ id: "null", name: "All Brands" }, ...brands]}
              keyExtractor={(item, index) =>
                item?.id ? `brand-${item.id}` : `index-${index}`
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.brandItem}
                  onPress={() => {
                    setSelectedBrand(item.id === "null" ? null : item);
                    setShowBrandDropdown(false);
                  }}
                >
                  <Text style={styles.brandItemText}>
                    {item?.name?.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) =>
                item?.id ? `s-${item.id}` : `i-${index}`
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery(item.name);
                    setShowSuggestions(false);
                    handleSearchSubmit();
                  }}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    );
  },
);
interface NavbarProps {
  title?: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  isScrolled?: boolean;
}
const Navbar = ({ onNotificationsPress }: NavbarProps) => {
  const router = useRouter();
  const { user, setAuth } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const { deactivateDevice, unreadCount } = useNotifications();
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogout = async () => {
    await setAuth(null);
    setIsMenuOpen(false);
    router.replace("/login");
  };
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await categoryApi.get("/vehicles/brands");

        const data = res.data;

        if (data?.brands && Array.isArray(data.brands)) {
          const formatted = data.brands.map((b: string, index: number) => ({
            id: index.toString(),
            name: b,
          }));
          setBrands(formatted);
        } else {
          setBrands([]);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    fetchBrands();
  }, []);

  const handleSearchSubmit = (overrideQuery?: string) => {
    // const finalQuery = (overrideQuery || searchQuery).trim();

    // If nothing is selected and query is empty, do nothing
    if (!overrideQuery && !selectedBrand) return;
    router.push({
      pathname: "../app/_components/productsDetails",
      params: {
        q: overrideQuery || searchQuery,
        brandId: selectedBrand?.id || "",
        brandName: selectedBrand?.name || "All Brands",
        isSearch: "true",
      },
    });
    setShowSuggestions(false);
  };

  return (
    <View style={styles.navContainer}>
      <View style={styles.topSection}>
        <Text style={styles.brandName} onPress={() => router.push("/")}>
          AUTO<span style={styles.subbrandName}>FUSION</span>
        </Text>

        {Platform.OS === "web" && (
          <View style={styles.webSearchWrapper}>
            <SearchBar
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              showBrandDropdown={showBrandDropdown}
              setShowBrandDropdown={setShowBrandDropdown}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearchSubmit={handleSearchSubmit}
              brands={brands}
            />
          </View>
        )}

        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsNotifyOpen(true)}
          >
            <Bell color="white" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {/* {unreadCount > 9 ? "9+" : unreadCount} */}
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <NotificationDrawer
            isOpen={isNotifyOpen}
            onClose={() => setIsNotifyOpen(false)}
          />

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => (user ? setIsMenuOpen(true) : router.push("/login"))}
          >
            <User color={user ? "#F2A20C" : "#FFF"} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {Platform.OS !== "web" && (
        <View style={styles.mobileSearchWrapper}>
          <SearchBar
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            showBrandDropdown={showBrandDropdown}
            setShowBrandDropdown={setShowBrandDropdown}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearchSubmit={handleSearchSubmit}
            brands={brands}
          />
        </View>
      )}
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
              onPress={() => router.push("/orders")}
            >
              <Package color="#FFF" size={20} />
              <Text style={styles.menuText}>ORDER HISTORY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/address")}
            >
              <MapPin color="#FFF" size={20} />
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

    position: "relative",
    zIndex: 10,
    overflow: "visible",

    height: Platform.OS === "web" ? 80 : 140,
    justifyContent: "center",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
  },
  subbrandName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F2A20C",
    letterSpacing: 2,
  },

  webSearchWrapper: {
    flex: 1,
    maxWidth: 600,
    marginHorizontal: 40,

    zIndex: 20,
  },

  mobileSearchWrapper: { marginTop: 15, zIndex: 1000 },

  combinedSearchContainer: {
    flexDirection: "row",
    backgroundColor: "#262626",
    borderRadius: 6,
    height: 45,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",

    position: "relative",
    zIndex: 30,
  },
  brandSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    width: 110,
    justifyContent: "space-between",
  },
  brandSelectorText: { color: "#F2A20C", fontSize: 10, fontWeight: "800" },
  divider: { width: 1, height: "60%", backgroundColor: "#444" },
  searchInput: {
    flex: 1,
    color: "#FFF",
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",

    outlineStyle: "none" as any,
  },
  searchIconBtn: { paddingHorizontal: 12 },

  brandDropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    width: 200,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F2A20C",

    // 🔥 FIX layering
    zIndex: 999,
    elevation: 20,
  },
  brandItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  brandItemText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

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
  dropdownOverlay: {
    position: "absolute",
    top: 50,
    left: 0,
    width: 200,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F2A20C",
    zIndex: 9999,
    elevation: 20,
  },

  suggestionBox: {
    position: "absolute",
    top: 50,
    left: 110, // after brand selector
    right: 0,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
    zIndex: 9999,
  },

  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },

  suggestionText: {
    color: "#FFF",
    fontSize: 13,
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#ff0000",
    borderRadius: 10,
    minWidth: 19,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    padding: 3,
    paddingHorizontal: 4,
  },
  iconButton: { padding: 8, marginHorizontal: 4 },
});

export default Navbar;
