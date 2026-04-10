import { categoryApi } from "@/axios/axiosInstance";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Package,
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
} from "react-native";
import PremiumAlert from "../app/_components/PremiumAlert";
import { useAuth } from "../Context/authcontext";
import { useNotifications } from "../Context/notificationContext";
import NotificationDrawer from "./NotificationDrawer";

type AlertType = "success" | "warning" | "error" | "confirm";

const SearchBar = React.memo(
  ({
    selectedBrand,
    setSelectedBrand,
    selectedFuel,
    setSelectedFuel,
    selectedYear,
    setSelectedYear,
    selectedModel,
    setSelectedModel,
    fuels,
    years,
    models,
    searchQuery,
    setSearchQuery,
    handleSearchSubmit,
    brands,
  }: any) => {
    const router = useRouter();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeFilter, setActiveFilter] = useState<
      "brand" | "fuel" | "year" | "model" | null
    >(null);

    const closeAll = () => {
      setActiveFilter(null);
      setShowSuggestions(false);
    };
    useEffect(() => {
      const delay = setTimeout(async () => {
        if (!searchQuery.trim()) {
          setSuggestions([]);
          return;
        }
        try {
          const res = await categoryApi.get(
            "/compatibility/filter/productsearch",
            {
              params: {
                query: searchQuery,
                vehicleBrand: selectedBrand?.name || "",
                fuelType: selectedFuel || "",
                year: selectedYear || "",
                model: selectedModel || "",
                page: 0,
                size: 5,
              },
            },
          );
          setSuggestions(res.data.content || []);
          setShowSuggestions(true);
        } catch (err) {
          console.log("Search error", err);
        }
      }, 400);
      return () => clearTimeout(delay);
    }, [searchQuery, selectedBrand, selectedFuel, selectedYear, selectedModel]);

    // Auto-advance logic: When a selection is made, open the next step
    const handleSelect = (type: string, value: any) => {
      if (type === "brand") {
        setSelectedBrand(value);
        setActiveFilter("fuel"); // Move to next step
      } else if (type === "fuel") {
        setSelectedFuel(value);
        setActiveFilter("year");
      } else if (type === "year") {
        setSelectedYear(value.toString());
        setActiveFilter("model");
      } else if (type === "model") {
        setSelectedModel(value);
        setActiveFilter(null); // Finish
      }
    };

    // Determine what data to show in the single dropdown
    const getDropdownData = () => {
      if (activeFilter === "brand")
        return { title: "SELECT BRAND", data: brands };
      if (activeFilter === "fuel") return { title: "SELECT FUEL", data: fuels };
      if (activeFilter === "year") return { title: "SELECT YEAR", data: years };
      if (activeFilter === "model")
        return { title: "SELECT MODEL", data: models };
      return null;
    };

    const dropdownConfig = getDropdownData();

    return (
      <View style={{ zIndex: 100, flex: 1 }}>
        {/* {(activeFilter || (showSuggestions && suggestions.length > 0)) && (
          <Pressable style={styles.fullScreenOverlay} onPress={closeAll} />
        )} */}
        {(activeFilter || showSuggestions) && (
          <Pressable style={styles.fullScreenOverlay} onPress={closeAll} />
        )}
        <View style={styles.combinedSearchContainer}>
          <TouchableOpacity
            style={styles.unifiedSelector}
            onPress={() => setActiveFilter(activeFilter ? null : "brand")}
          >
            <Text style={styles.unifiedSelectorText} numberOfLines={1}>
              {selectedBrand
                ? `${selectedBrand.name}${selectedModel ? ` • ${selectedModel}` : ""}`
                : "SELECT VEHICLE"}
            </Text>
            <ChevronDown color="#F2A20C" size={14} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TextInput
            style={[styles.searchInput, { outline: "none" }]}
            placeholder="Search parts..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(true);
            }}
          />

          {/* <TouchableOpacity
            onPress={() => handleSearchSubmit()}
            style={styles.searchIconBtn}
          >
            <Search color="#F2A20C" size={20} />
          </TouchableOpacity> */}
        </View>

        {/* SINGLE UNIFIED DROPDOWN */}
        {activeFilter && dropdownConfig && (
          <View style={styles.singleDropdownOverlay}>
            <View style={styles.dropdownHeaderSmall}>
              <Text style={styles.dropdownHeaderText}>
                {dropdownConfig.title}
              </Text>
            </View>
            <FlatList
              data={dropdownConfig.data}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={() => (
        <View style={styles.noResultContainer}>
          <Text style={styles.noResultText}>
            No {activeFilter}s found 
          </Text>
        </View>
      )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.brandItem}
                  onPress={() => handleSelect(activeFilter, item)}
                >
                  <Text style={styles.brandItemText}>
                    {(activeFilter === "brand"
                      ? item.name
                      : item.toString()
                    ).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* SUGGESTIONS BOX */}
        {showSuggestions && searchQuery.trim().length > 0 && (
          <View style={styles.suggestionBox}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) =>
                item.productId?.toString() || Math.random().toString()
              }
              // This handles the "Empty" state
              ListEmptyComponent={() => (
                <View style={styles.noResultContainer}>
                  <Text style={styles.noResultText}>No products found</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setShowSuggestions(false);
                    setSearchQuery(item.productName);
                    router.push({
                      pathname: `/_components/ViewProductDetails`,
                      params: { id: item.productId },
                    });
                  }}
                >
                  <Text style={styles.suggestionText}>{item.productName}</Text>
                  <Text style={{ color: "#888", fontSize: 10 }}>
                    {item.vehicleBrand} • {item.partNumber}
                  </Text>
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

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const { user, setAuth } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [fuels, setFuels] = useState<string[]>([]);
  const [selectedFuel, setSelectedFuel] = useState("");
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { unreadCount } = useNotifications();

  useEffect(() => {
    categoryApi.get("/vehicles/brands").then((res) => {
      if (res.data?.brands)
        setBrands(
          res.data.brands.map((b: string, i: number) => ({ id: i, name: b })),
        );
    });
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      categoryApi
        .get(`/compatibility/filter/fuel-types?brand=${selectedBrand.name}`)
        .then((res) => setFuels(res.data.fuelTypes || []));
      setSelectedFuel("");
      setSelectedYear("");
      setSelectedModel("");
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedFuel) {
      categoryApi
        .get(
          `/compatibility/filter/years?brand=${selectedBrand.name}&fuelType=${selectedFuel}`,
        )
        .then((res) => setYears(res.data.years || []));
      setSelectedYear("");
      setSelectedModel("");
    }
  }, [selectedFuel]);

  useEffect(() => {
    if (selectedYear) {
      categoryApi
        .get(
          `/compatibility/filter/models?brand=${selectedBrand.name}&fuelType=${selectedFuel}&year=${selectedYear}`,
        )
        .then((res) => setModels(res.data.models || []));
      setSelectedModel("");
    }
  }, [selectedYear]);

  const handleSearchSubmit = (override?: string) => {
    router.push({
      pathname: "../app/_components/productsDetails",
      params: {
        q: override || searchQuery,
        brand: selectedBrand?.name || "",
        fuelType: selectedFuel,
        year: selectedYear,
        model: selectedModel,
        isSearch: "true",
      },
    });
  };
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (
    type: AlertType | "confirm",
    title: string,
    message: string,
    onConfirm?: () => void,
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm,
    });
  };
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleLogoutAction = async () => {
    await setAuth(null);
    setIsMenuOpen(false);
    setAlertConfig((prev) => ({ ...prev, visible: false }));
    router.replace("/login");
  };

  const triggerLogoutConfirm = () => {
    setIsMenuOpen(false);
    showAlert(
      "confirm",
      "Sign Out",
      "Are you sure you want to log out of Autofusion?",
      handleLogoutAction,
    );
  };

  return (
    <View
      style={[
        styles.navContainer,
        Platform.OS !== "web" && { height: "auto", paddingBottom: 15 }, // Allow height to grow on Mobile
      ]}
    >
      <View style={styles.topSection}>
        <Text style={styles.brandName} onPress={() => router.push("/")}>
          AUTO<Text style={styles.subbrandName}>FUSION</Text>
        </Text>

       
        {Platform.OS === "web" && (
          <View style={styles.webSearchWrapper}>
            <SearchBar
              {...{
                selectedBrand,
                setSelectedBrand,
                selectedFuel,
                setSelectedFuel,
                selectedYear,
                setSelectedYear,
                selectedModel,
                setSelectedModel,
                fuels,
                years,
                models,
                showBrandDropdown,
                setShowBrandDropdown,
                searchQuery,
                setSearchQuery,
                handleSearchSubmit,
                brands,
              }}
            />
          </View>
        )}

        <View style={styles.iconGroup}>
          <TouchableOpacity
            onPress={() =>
              !user
                ? showAlert("warning", "Login Required", "Please login.")
                : setIsNotifyOpen(true)
            }
          >
            <Bell color="white" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => (user ? setIsMenuOpen(true) : router.push("/login"))}
          >
            <User color={user ? "#F2A20C" : "#FFF"} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* MOBILE ONLY: Search moves below the brand text */}
      {Platform.OS !== "web" && (
        <View style={styles.mobileSearchWrapper}>
          <SearchBar
            {...{
              selectedBrand,
              setSelectedBrand,
              selectedFuel,
              setSelectedFuel,
              selectedYear,
              setSelectedYear,
              selectedModel,
              setSelectedModel,
              fuels,
              years,
              models,
              showBrandDropdown,
              setShowBrandDropdown,
              searchQuery,
              setSearchQuery,
              handleSearchSubmit,
              brands,
            }}
          />
        </View>
      )}
      <NotificationDrawer
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
      />
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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                router.push("/changepass");
              }}
            >
              <User color="#FFF" size={20} />
              <Text style={styles.menuText}>CHANGE PASSWORD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                router.push("/wishlist");
              }}
            >
              <Heart color="#FFF" size={20} />
              <Text style={styles.menuText}>WISHLIST</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                router.push("/cart");
              }}
            >
              <ShoppingCart color="#FFF" size={20} />
              <Text style={styles.menuText}>CART</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                router.push("/orders");
              }}
            >
              <Package color="#FFF" size={20} />
              <Text style={styles.menuText}>ORDER HISTORY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                router.push("/address");
              }}
            >
              <MapPin color="#FFF" size={20} />
              <Text style={styles.menuText}>ADDRESS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={triggerLogoutConfirm}
            >
              <LogOut color="#FF453A" size={20} />
              <Text style={[styles.menuText, { color: "#FF453A" }]}>
                LOGOUT
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <PremiumAlert
        visible={alertConfig.visible}
        type={alertConfig.type as any}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.type === "confirm" ? "LOGOUT" : "OK"}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={alertConfig.onConfirm} // Pass the dynamic confirm action
      />
    </View>
  );
};

const styles = StyleSheet.create({
  combinedSearchContainer: {
    flexDirection: "row",
    backgroundColor: "#262626",
    borderRadius: 6,
    height: 45,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
    paddingRight: 5,
    width: "100%",
  },
  brandSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    width: 65,
    justifyContent: "space-between",
  },
  brandSelectorText: { color: "#F2A20C", fontSize: 8, fontWeight: "800" },
  // suggestionBox: {
  //   position: "absolute",
  //   top: 50,
  //   left: 0,
  //   right: 0,
  //   backgroundColor: "#1E1E1E",
  //   borderRadius: 6,
  //   borderWidth: 1,
  //   borderColor: "#F2A20C",
  //   zIndex: 9999,
  //   maxHeight: 300,
  //   elevation: 5,
  // },
 navContainer: {
  backgroundColor: "#1A1A1A",
  borderBottomWidth: 2,
  borderColor: "#333",
  paddingHorizontal: 20,
  zIndex: 1000, 
  elevation: 10, 
  height: Platform.OS === "web" ? 80 : 130, 
  justifyContent: "center",
  overflow: "visible", // CRITICAL: Allows dropdowns to spill out of the nav
},

  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height:Platform.OS==="web"?60:80, 
  },

  webSearchWrapper: {
  
    width: 550,
    marginHorizontal: 20,
  },

  mobileSearchWrapper: {
    width: "100%",
    // marginTop: 10, // Adds space below AUTOFUSION text
    zIndex: 110, // Ensure dropdowns aren't clipped
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
  // webSearchWrapper: { flex: 1, marginHorizontal: 20 },
  // webSearchWrapper: {
  //   flex: 1,
  //   maxWidth: 600,
  //   marginHorizontal: 40,

  //   zIndex: 20,
  // },
  // mobileSearchWrapper: { marginTop: 15, zIndex: 1000 },
  divider: { width: 1, height: "50%", backgroundColor: "#444" },
  searchInput: {
    flex: 1,
    color: "#FFF",
    paddingHorizontal: 10,
    fontSize: 13,
    width: "50%",
  },
  searchIconBtn: { paddingHorizontal: 10 },
  // fullScreenOverlay: {
  //   position: "absolute",
  //   top: -500,
  //   left: -500,
  //   right: -500,
  //   bottom: -1000,
  //   backgroundColor: "transparent",
  //   zIndex: 5,
  // },
  // dropdownOverlay: {
  //   position: "absolute",
  //   top: 50,
  //   width: 150,
  //   backgroundColor: "#1E1E1E",
  //   borderRadius: 6,
  //   borderWidth: 1,
  //   borderColor: "#F2A20C",
  //   zIndex: 9999,
  // },
  brandItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#333" },
  brandItemText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  iconGroup: { flexDirection: "row", alignItems: "center", gap: 15 },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  suggestionText: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  badgeContainer: {
    position: "absolute",
    top: -10,
    right: -6,
    backgroundColor: "#ff0000",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 20,
  },
  iconBtn: { padding: 5 },
  fullScreenOverlay: {
    position: "fixed", // For Web
    // @ts-ignore
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: -500, // Large enough to cover header area
    left: -500,
    right: -500,
    bottom: -1000,
    width: 5000, // Ensure it covers the whole screen
    height: 5000,
    backgroundColor: "transparent",
    zIndex: 5, // Lower than dropdowns but higher than page content
  },

  // Ensure these have a higher zIndex than fullScreenOverlay
  dropdownOverlay: {
    position: "absolute",
    top: 50,
    left: 0,
    width: 200,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F2A20C",
    zIndex: 9999, // High
    elevation: 20,
  },
  suggestionBox: {
    position: "absolute",
    top: 50,
    left: 110,
    right: 0,
    backgroundColor: "#1E1E1E",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
    zIndex: 9999, // High
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
  dropdownContent: {
    width: 200,
    backgroundColor: "#222",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#F2A20C",
    padding: 15,
  },
  unifiedSelectorText: {
    color: "#F2A20C",
    fontSize: 10,
    fontWeight: "800",
    marginRight: 5,
   
    flex: 1,
  },
  singleDropdownOverlay: {
    position: "absolute",
    top: 55,
    left: 0,
    width: 220,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F2A20C",
    zIndex: 9999,
    elevation: 20,
    maxHeight: 300,
  },
  dropdownHeaderSmall: {
    padding: 10,
    backgroundColor: "rgb(38, 38, 38)",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dropdownHeaderText: {
    color: "#888",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  unifiedSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minWidth: 130,
    maxWidth: 160,
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#2a2a2a",
  },
  noResultContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
  },
});

export default Navbar;
