import { cartApi, categoryApi, wishlistApi } from "@/axios/axiosInstance";
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PremiumAlert from "./PremiumAlert";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isTablet = width >= 768;
const isDesktop = width >= 1100;

type AlertType = "success" | "warning" | "error";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [quantity, setQuantity] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "success" as AlertType,
    title: "",
    message: "",
  });

  const [reviewsData, setReviewsData] = useState({
    averageRating: null as number | null,
    totalReviews: 0,
    reviews: [] as any[],
  });

  const isOutOfStock =
    product?.status === "Out of Stock" || product?.stockQuantity <= 0;

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoryApi.get(`/products/${id}`);
      setProduct(res.data);
    } catch {
      Alert.alert("Error", "Product not found");
    } finally {
      setLoading(false);
    }
  }, [id]);
  // 3. SYNC CART STATUS
  useEffect(() => {
    const fetchCartStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token || !id) return;

        const res = await cartApi.get("/orders/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const items = res.data?.cartItems || res.data?.items || res.data || [];

        const cartItem = Array.isArray(items)
          ? items.find(
              (item: any) =>
                item.productId?.toString() === id.toString() ||
                item.product?.id?.toString() === id.toString(),
            )
          : null;

        if (cartItem) {
          setQuantity(cartItem.quantity);
        } else {
          setQuantity(0);
        }
      } catch (err) {
        console.log("Cart sync error:", err);
      }
    };

    fetchCartStatus();
  }, [id]);
  const fetchReviews = useCallback(async () => {
    try {
      const res = await cartApi.get(`/reviews/${id}`);
      setReviewsData(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetails();
      fetchReviews();
    }
  }, [id]);

  const updateCartAPI = async (newQty: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("warning", "Login Required", "Please login first.");
        return;
      }

      setAddingToCart(true);

      await cartApi.post(
        "/orders/bag/add",
        {
          productId: product.id,
          quantity: newQty,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setQuantity(newQty);
    } catch {
      showAlert("error", "Error", "Failed to update cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert("warning", "Login Required", "Please login first");
        return;
      }

      if (isWishlisted) {
        await wishlistApi.delete(`/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsWishlisted(false);
      } else {
        await wishlistApi.post(`/wishlist/${id}`, null, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsWishlisted(true);
      }
    } catch {
      showAlert("error", "Error", "Wishlist update failed");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="share-social-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View> */}
      <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#111827" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.pageWrap}>
          <View style={styles.galleryCard}>
            <Image
              source={{ uri: product.photoUrl }}
              style={styles.productImage}
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.categoryText}>
              {product.categoryName} • {product.subCategoryName}
            </Text>
            <Text style={styles.productTitle}>{product.name}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.price}</Text>
              {product.discount > 0 && (
                <View style={styles.discountPill}>
                  <Text style={styles.discountText}>
                    {product.discount}% OFF
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.stockText}>
              {product.stockQuantity > 0
                ? `${product.stockQuantity} In Stock`
                : "Out of Stock"}
            </Text>

            <View style={styles.specGrid}>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Brand</Text>
                <Text style={styles.specValue}>{product.company}</Text>
              </View>
              <View style={styles.specBox}>
                <Text style={styles.specLabel}>Part Number</Text>
                <Text style={styles.specValue}>{product.partNumber}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {addingToCart ? (
                <ActivityIndicator color="#7C3AED" />
              ) : quantity === 0 ? (
                <TouchableOpacity
                  style={[styles.cartBtn, isOutOfStock && styles.disabledBtn]}
                  onPress={() => updateCartAPI(1)}
                  disabled={isOutOfStock}
                >
                  <Ionicons name="cart-outline" size={18} color="#fff" />
                  <Text style={styles.cartBtnText}>Add to Cart</Text>
                </TouchableOpacity>
              ) : (
                // FIX: Replaced plus/minus counter with static ADDED view
                <View style={[styles.cartBtn, styles.addedBtn]}>
                  <Ionicons name="checkmark-circle" size={18} color="#166534" />
                  <Text style={[styles.cartBtnText, styles.addedBtnText]}>
                    ADDED
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.wishlistBtn}
                onPress={toggleWishlist}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={22}
                  color={isWishlisted ? "#EF4444" : "#111827"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionText}>{product.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compatible Vehicles</Text>
              <View style={styles.vehicleWrap}>
                {product.compatibleVehicles?.length ? (
                  product.compatibleVehicles.map((v: string, i: number) => (
                    <View key={i} style={styles.vehicleChip}>
                      <Ionicons name="car-sport" size={14} color="#475569" />
                      <Text style={styles.vehicleText}>{v}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    No compatibility data available
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Reviews ({reviewsData.totalReviews})
              </Text>
              {reviewsData.reviews.length ? (
                reviewsData.reviews.map((review, i) => (
                  <View key={i} style={styles.reviewCard}>
                    <Text style={styles.reviewUser}>{review.userName}</Text>
                    <Text style={styles.reviewStars}>
                      {"★".repeat(review.rating)}
                    </Text>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No reviews yet</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <PremiumAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    margin: isWeb ? 20 : 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  pageWrap: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    padding: 18,
    gap: 20,
  },
  galleryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    minHeight: Platform.OS === "web" ? 400 : 250,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: isDesktop ? 480 : 300,
    resizeMode: "cover",
    borderRadius: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontSize: 30, fontWeight: "900", color: "#F59E0B" },
  discountPill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  discountText: { color: "#92400E", fontWeight: "800", fontSize: 12 },
  stockText: {
    marginTop: 10,
    color: "#059669",
    fontWeight: "700",
    marginBottom: 18,
  },
  specGrid: { flexDirection: "row", gap: 12, marginBottom: 18 },
  specBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
  },
  specLabel: { color: "#64748B", fontSize: 11 },
  specValue: { fontWeight: "800", color: "#111827", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  cartBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#111827",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  cartBtnText: { color: "#fff", fontWeight: "800" },

  // NEW STYLES for the added state
  addedBtn: {
    backgroundColor: "#DCFCE7",
  },
  addedBtnText: {
    color: "#166534",
  },

  wishlistBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: "#FACC15",
    paddingHorizontal: 20,
    borderRadius: 16,
    height: 54,
  },
  qtyText: { fontWeight: "900", fontSize: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  sectionText: { color: "#475569", lineHeight: 22 },
  vehicleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
  },
  vehicleText: { fontWeight: "700", color: "#334155" },
  reviewCard: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  reviewUser: { fontWeight: "800", marginBottom: 4 },
  reviewStars: { color: "#F59E0B", marginBottom: 4 },
  reviewComment: { color: "#475569" },
  emptyText: { color: "#94A3B8" },
  disabledBtn: { backgroundColor: "#CBD5E1" },
});
