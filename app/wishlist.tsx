import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PremiumAlert from "../app/_components/PremiumAlert";
// 🔹 FIX: Imported orderApi to handle the specific bag/add endpoint
import { orderApi, wishlistApi } from "../axios/axiosInstance";
type AlertType = "success" | "warning" | "error";
const { width } = Dimensions.get("window");

// 🔹 FIX: Determine columns based on platform
const numColumns = Platform.OS === "web" ? 4 : 2;
// Mobile (2 cols): 40px padding + 1 gap (20px) = 60px subtracted
// Web (4 cols): 40px padding + 3 gaps (20px each) = 100px subtracted
const COLUMN_WIDTH =
  Platform.OS === "web" ? (width - 100) / 4 : (width - 60) / 2;

// 1. Updated Interface to match your new JSON response
interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  addedAt: string;
}

const WishlistPage = () => {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cartItemIds, setCartItemIds] = useState<number[]>([]); // 🔹 NEW: Track items in cart
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // 🔹 NEW: Fetch both wishlist and cart data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchWishlist(), fetchCart()]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchWishlist = async () => {
    try {
      const response = await wishlistApi.get("/wishlist");
      setWishlist(response.data.items || []);
    } catch (error) {
      console.error("Wishlist fetch error:", error);
    }
  };

  // 🔹 NEW: Fetch cart data to compare
  const fetchCart = async () => {
    try {
      const response = await orderApi.get("/orders/cart");
      const items = response.data?.cartItems || [];
      const ids = items.map((item: any) => item.productId);
      setCartItemIds(ids);
    } catch (error) {
      console.error("Cart fetch error:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // 🔹 Remove Single Item
  const removeFromWishlist = async (productId: number) => {
    // Optimistic UI update
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
    try {
      await wishlistApi.delete(`/wishlist/${productId}`);
      // 🔹 ADDED SUCCESS ALERT HERE
      showAlert("success", "Removed", "Item removed from wishlist.");
    } catch (error) {
      showAlert("error", "Error", "Could not remove item");
      fetchWishlist(); // Revert on failure
    }
  };

  // 🔹 Clear Entire Wishlist
  const clearWishlist = () => {
    const action = async () => {
      setWishlist([]); // Optimistically clear UI
      try {
        await wishlistApi.delete("/wishlist");
        // 🔹 ADDED SUCCESS ALERT HERE
        showAlert("success", "Cleared", "Wishlist cleared successfully.");
      } catch (error) {
        showAlert("error", "Error", "Could not clear wishlist");
        fetchWishlist(); // Revert on failure
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Clear your entire wishlist?")) action();
    } else {
      Alert.alert(
        "Clear Wishlist",
        "Are you sure you want to remove all items?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Clear All", style: "destructive", onPress: action },
        ],
      );
    }
  };

  // 🔹 FIX: Updated API endpoint and instance
  const addToCart = async (productId: number) => {
    try {
      // Pointing to your specific endpoint: /api/orders/bag/add
      await orderApi.post("/orders/bag/add", {
        productId: productId,
        quantity: 1, // Assumed standard payload, adjust if your API requires different keys
      });

      // 🔹 NEW: Optimistically update cart state so button changes to "ADDED"
      setCartItemIds((prev) => [...prev, productId]);

      if (Platform.OS === "web") {
        showAlert("success", "Success", "Added to Cart!");
      } else {
        showAlert("success", "Success", "Added to your cart!");
      }
    } catch (error) {
      console.error("Error adding to bag:", error);
      showAlert("error", "Error", "Failed to add to cart");
    }
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    const isInCart = cartItemIds.includes(item.productId); // 🔹 NEW: Check if item is in cart

    return (
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          {/* Placeholder added since your JSON provided a dummy image link */}
          <Image
            source={{
              uri:
                imageErrors[item.productId] || !item.productImage
                  ? "https://cdn-icons-png.flaticon.com/512/1973/1973636.png"
                  : item.productImage,
            }}
            style={styles.image}
            onError={() =>
              setImageErrors((prev) => ({ ...prev, [item.productId]: true }))
            }
          />
          <TouchableOpacity
            style={styles.removeIcon}
            onPress={() => removeFromWishlist(item.productId)} // Using productId based on your endpoint
          >
            <Trash2 size={16} color="#FF453A" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          {/* Updated to use productName */}
          <Text style={styles.itemName} numberOfLines={1}>
            {item.productName}
          </Text>
          <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>

          {/* 🔹 NEW: Conditionally render the button based on cart status */}
          {isInCart ? (
            <View style={[styles.cartBtn, styles.addedBtn]}>
              <ShoppingCart size={16} color="#166534" />
              <Text style={[styles.cartBtnText, styles.addedBtnText]}>
                ADDED
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => addToCart(item.productId)}
            >
              <ShoppingCart size={16} color="#1A1A1A" />
              <Text style={styles.cartBtnText}>ADD TO CART</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F2A20C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
        >
          <ArrowLeft color="#F2A20C" size={24} />
        </TouchableOpacity>

        <Text style={styles.header}>MY WISHLIST ({wishlist.length})</Text>

        {/* Clear Wishlist Button (Only shows if there are items) */}
        <View style={styles.headerRightAction}>
          {wishlist.length > 0 ? (
            <TouchableOpacity onPress={clearWishlist} style={styles.clearBtn}>
              <Trash2 color="#FF453A" size={22} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} /> /* Spacer to keep header centered */
          )}
        </View>
      </View>

      <FlatList
        data={wishlist}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns} // 🔹 FIX: Set to dynamic variable
        key={numColumns} // 🔹 FIX: Required by RN when columns change
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F2A20C"
            colors={["#F2A20C"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={60} color="#E0E0E0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Your wishlist is empty</Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/")}
            >
              <Text style={styles.shopBtnText}>EXPLORE PARTS</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <PremiumAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Light background matching Checkout
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 16,
  },
  headerIconBtn: {
    padding: 10,
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
  },
  headerRightAction: {
    width: 44, // Matches the spacing geometry of the back button for a centered title
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    padding: 10,
    backgroundColor: "#FFF0F0", // Soft red background for destruct action
    borderRadius: 12,
  },
  header: {
    color: "#1A1A1A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: "flex-start", // 🔹 FIX: Prevents items from spacing out to edges
    gap: 20, // 🔹 FIX: Ensures an exact 20px gap between all items
  },
  card: {
    backgroundColor: "#FFFFFF", // White cards
    width: COLUMN_WIDTH,
    borderRadius: 16, // Smoother corners like Checkout
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    position: "relative",
    backgroundColor: "#F8F9FA", // Light image background
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  removeIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF", // White background for visibility
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoContainer: {
    padding: 12,
  },
  itemName: {
    color: "#1A1A1A", // Dark text
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  itemPrice: {
    color: "#F2A20C", // Keep accent color for price
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  cartBtn: {
    backgroundColor: "#F2A20C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cartBtnText: {
    color: "#1A1A1A",
    fontSize: 12,
    fontWeight: "900",
  },

  // 🔹 NEW STYLES for the added state
  addedBtn: {
    backgroundColor: "#DCFCE7", // Soft green background
  },
  addedBtnText: {
    color: "#166534", // Dark green text
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#888", // Soft gray
    fontSize: 15,
    marginTop: 20,
    marginBottom: 30,
  },
  shopBtn: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "rgba(242, 162, 12, 0.3)",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopBtnText: {
    color: "#F2A20C",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default WishlistPage;
