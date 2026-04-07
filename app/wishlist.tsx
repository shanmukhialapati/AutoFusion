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
import axiosInstance from "../axios/axiosInstance";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 60) / 2; // Two columns with padding

interface Product {
  id: number;
  name: string;
  price: number;
  productImage: string;
  productStatus: string; // "IN" or "OUT"
}

const WishlistPage = () => {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await axiosInstance.get("/wishlist");
      setWishlist(Array.isArray(response.data) ? response.data : []);
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

  const removeFromWishlist = async (id: number) => {
    try {
      await axiosInstance.delete(`/wishlist/${id}`);
      setWishlist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      Alert.alert("Error", "Could not remove item");
    }
  };

  const addToCart = async (productId: number) => {
    try {
      await axiosInstance.post("/cart/add", {
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

  const renderWishlistItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.productImage }} style={styles.image} />
        <TouchableOpacity
          style={styles.removeIcon}
          onPress={() => removeFromWishlist(item.id)}
        >
          <Trash2 size={16} color="#FF453A" />
        </TouchableOpacity>
        {item.productStatus === "OUT" && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>

        <TouchableOpacity
          style={[
            styles.cartBtn,
            item.productStatus === "OUT" && styles.disabledBtn,
          ]}
          disabled={item.productStatus === "OUT"}
          onPress={() => addToCart(item.id)}
        >
          <ShoppingCart size={16} color="#1A1A1A" />
          <Text style={styles.cartBtnText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.header}>MY WISHLIST</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F2A20C" />
        </View>
      ) : (
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
      )}
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
  header: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
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
  imageWrapper: { position: "relative" },
  image: { width: "100%", height: 140, backgroundColor: "#333" },
  removeIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 20,
  },
  outOfStockBadge: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(255, 69, 58, 0.8)",
    paddingVertical: 4,
    alignItems: "center",
  },
  outOfStockText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
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
  disabledBtn: { backgroundColor: "#444" },
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
