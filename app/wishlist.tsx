import { useRouter } from "expo-router";
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
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
// 🔹 Import your specific APIs
import { cartApi, wishlistApi } from "../axios/axiosInstance";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 60) / 2;

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistApi.get("/wishlist");
      // Your JSON returns an object with an "items" array inside it
      setWishlist(response.data.items || []);
    } catch (error) {
      console.error("Wishlist fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlist();
  }, []);

  // 🔹 Remove Single Item
  const removeFromWishlist = async (productId: number) => {
    // Optimistic UI update
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
    try {
      await wishlistApi.delete(`/wishlist/${productId}`);
    } catch (error) {
      Alert.alert("Error", "Could not remove item");
      fetchWishlist(); // Revert on failure
    }
  };

  // 🔹 Clear Entire Wishlist
  const clearWishlist = () => {
    const action = async () => {
      setWishlist([]); // Optimistically clear UI
      try {
        await wishlistApi.delete("/wishlist");
      } catch (error) {
        Alert.alert("Error", "Could not clear wishlist");
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

  const addToCart = async (productId: number) => {
    try {
      // Assuming you use the cartApi for this endpoint
      await cartApi.post("/cart/add", {
        productId: productId,
        quantity: 1,
      });
      if (Platform.OS === "web") {
        alert("Added to Cart!");
      } else {
        Alert.alert("Success", "Added to your cart!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add to cart");
    }
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
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

        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => addToCart(item.productId)}
        >
          <ShoppingCart size={16} color="#1A1A1A" />
          <Text style={styles.cartBtnText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          style={styles.headerIcon}
        >
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>

        <Text style={styles.header}>MY WISHLIST ({wishlist.length})</Text>

        {/* Clear Wishlist Button (Only shows if there are items) */}
        <View style={styles.headerIcon}>
          {wishlist.length > 0 ? (
            <TouchableOpacity onPress={clearWishlist}>
              <Trash2 color="#FF453A" size={22} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={wishlist}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
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
            <Heart size={60} color="#333" strokeWidth={1.5} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 20,
  },
  headerIcon: { width: 30, alignItems: "center" }, // Ensures the title stays perfectly centered
  header: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  columnWrapper: { justifyContent: "space-between" },
  card: {
    backgroundColor: "#262626",
    width: COLUMN_WIDTH,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  imageWrapper: { position: "relative", backgroundColor: "#333" },
  image: { width: "100%", height: 140, resizeMode: "cover" },
  removeIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 20,
  },
  infoContainer: { padding: 12 },
  itemName: { color: "#FFF", fontSize: 14, fontWeight: "700", marginBottom: 4 },
  itemPrice: {
    color: "#F2A20C",
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
    borderRadius: 6,
    gap: 6,
  },
  cartBtnText: { color: "#1A1A1A", fontSize: 12, fontWeight: "900" },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#666", fontSize: 16, marginTop: 20, marginBottom: 30 },
  shopBtn: {
    borderWidth: 1,
    borderColor: "#F2A20C",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 4,
  },
  shopBtnText: { color: "#F2A20C", fontWeight: "700", letterSpacing: 1 },
});

export default WishlistPage;
