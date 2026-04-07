import { categoryApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Product } from "../../Component/productCard";

const { width } = Dimensions.get("window");

const ProductDetails = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [compatibility, setCompatibility] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const isWeb = Platform.OS === "web";

  const getToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Login Required", "Please login first.");
      return null;
    }
    return token;
  };

  const parsePrice = (price: string | number) =>
    typeof price === "string"
      ? parseFloat(price.replace(/[^0-9.]/g, ""))
      : price;

  const fetchAllDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [productRes, compatRes] = await Promise.all([
        categoryApi.get(`/products/${id}`),
        categoryApi.get(`/compatibility/${id}`),
      ]);

      setProduct(productRes.data);
      setCompatibility(compatRes.data);
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchAllDetails();
  }, [id, fetchAllDetails]);

  const handleAddToCart = async () => {
    if (!product) return;
    const token = await getToken();
    if (!token) return;

    setAddingToCart(true);
    try {
      await categoryApi.post(
        "/orders/bag/add",
        {
          pid: product.id,
          pname: product.name,
          price: parsePrice(product.price),
          quantity: 1,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Alert.alert("Success", "Added to your bag!");
    } catch (error) {
      Alert.alert("Error", "Could not add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = async () => {
    if (!product) return;
    const token = await getToken();
    if (!token) return;

    setWishlistLoading(true);
    try {
      await categoryApi.post(
        `/wishlist/toggle/${product.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsWishlisted((prev) => !prev);
    } catch (error) {
      Alert.alert("Error", "Wishlist update failed.");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F2A20C" />
      </View>
    );
  }

  if (!product) return null;

  const imageSource = Array.isArray(product.image)
    ? { uri: product.image[0] }
    : { uri: product.image };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={isWeb ? styles.webWrapper : styles.mobileWrapper}>
          <Image
            source={imageSource}
            style={isWeb ? styles.imageWeb : styles.imageMobile}
          />

          <View style={[styles.content, isWeb && styles.contentWeb]}>
            <View style={styles.row}>
              <Text style={styles.category}>{product.category}</Text>
              <View style={styles.rating}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>4.9</Text>
              </View>
            </View>

            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{product.price}</Text>

            {/* Actions Box - Internal to Details */}
            <View style={styles.actionBox}>
              <TouchableOpacity
                style={[
                  styles.buyBtn,
                  product.status === "Out of Stock" && styles.disabledBtn,
                ]}
                onPress={handleAddToCart}
                disabled={addingToCart || product.status === "Out of Stock"}
              >
                {addingToCart ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buyBtnText}>
                    {product.status === "Out of Stock"
                      ? "OUT OF STOCK"
                      : "ADD TO BAG"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.wishlistBtn,
                  isWishlisted && styles.wishlistedActive,
                ]}
                onPress={toggleWishlist}
                disabled={wishlistLoading}
              >
                {wishlistLoading ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <Ionicons
                    name={isWishlisted ? "heart" : "heart-outline"}
                    size={24}
                    color={isWishlisted ? "#EF4444" : "#1A1A1A"}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description || "No description available"}
            </Text>

            {compatibility && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionTitle}>Verified Fitment</Text>
                <View style={styles.compatCard}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <View>
                    <Text style={styles.compatMain}>
                      {compatibility.vehicleBrand} {compatibility.model}
                    </Text>
                    <Text style={styles.compatSub}>
                      {compatibility.year} • {compatibility.fuelType}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  backBtn: { padding: 8 },

  mobileWrapper: { flex: 1 },
  webWrapper: {
    flexDirection: "row",
    padding: 40,
    maxWidth: 1200,
    alignSelf: "center",
    gap: 50,
  },

  imageMobile: { width: width, height: 400, resizeMode: "cover" },
  imageWeb: {
    width: 500,
    height: 500,
    borderRadius: 20,
    resizeMode: "contain",
    backgroundColor: "#F8FAFC",
  },

  content: { padding: 20, backgroundColor: "#FFF" },
  contentWeb: { flex: 1, padding: 0 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  category: {
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontWeight: "600" },
  name: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  price: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F2A20C",
    marginBottom: 20,
  },

  actionBox: { flexDirection: "row", gap: 12, marginBottom: 10 },
  buyBtn: {
    flex: 1,
    height: 55,
    backgroundColor: "#F2A20C",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buyBtnText: { fontSize: 16, fontWeight: "800", color: "#000" },
  disabledBtn: { backgroundColor: "#E2E8F0" },

  wishlistBtn: {
    width: 55,
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistedActive: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  description: { fontSize: 15, color: "#64748B", lineHeight: 24 },

  compatCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 15,
    gap: 12,
    alignItems: "center",
  },
  compatMain: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  compatSub: { fontSize: 13, color: "#64748B" },
});

export default ProductDetails;
