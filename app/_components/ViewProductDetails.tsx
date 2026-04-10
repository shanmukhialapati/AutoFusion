import { cartApi, categoryApi, wishlistApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import PremiumAlert from "./PremiumAlert";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
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

  const showAlert = (type: AlertType, title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoryApi.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error("Product fetch error:", err);
      setProduct(null); 
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetails();
      fetchReviews();
      checkCartAndWishlist();
    }
  }, [id, fetchDetails]);

  const checkCartAndWishlist = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token || !id) return;

      const cartRes = await cartApi.get("/orders/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = cartRes.data?.cartItems || cartRes.data?.items || cartRes.data || [];
      const cartItem = Array.isArray(items) ? items.find(
        (item: any) => 
          item.productId?.toString() === id.toString() || 
          item.product?.id?.toString() === id.toString()
      ) : null;
      setQuantity(cartItem ? cartItem.quantity : 0);

      const wishRes = await wishlistApi.get("/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const wishlistItems = wishRes.data?.items || [];
      setIsWishlisted(wishlistItems.some((item: any) => item.productId?.toString() === id.toString()));
      
    } catch (err) {
      console.log("Status sync error:", err);
    }
  };

  const fetchReviews = useCallback(async () => {
    try {
      const res = await cartApi.get(`/reviews/${id}`);
      setReviewsData(res.data);
    } catch (err) {
      console.log("Reviews error:", err);
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
      await cartApi.post("/orders/bag/add", { productId: product.id, quantity: newQty }, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        await wishlistApi.delete(`/wishlist/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setIsWishlisted(false);
        showAlert("warning", "Wishlist Updated", `${product.name} removed.`);
      } else {
        await wishlistApi.post(`/wishlist/${id}`, null, { headers: { Authorization: `Bearer ${token}` } });
        setIsWishlisted(true);
        showAlert("success", "Wishlist Updated", `${product.name} added.`);
      }
    } catch (error: any) {
      showAlert("error", "Error", error.response?.data?.message || "Wishlist update failed");
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#F2A20C" />
      </View>
    );
  }


  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="search-outline" size={80} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The item you are looking for might have been removed or is currently unavailable.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/")}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOutOfStock = product?.status === "Out of Stock" || product?.stockQuantity <= 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#111827" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.pageWrap}>
          <View style={styles.galleryCard}>
            <Image source={{ uri: product.photoUrl }} style={styles.productImage} />
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
                  <Text style={styles.discountText}>{product.discount}% OFF</Text>
                </View>
              )}
            </View>

            <Text style={[styles.stockText, isOutOfStock && { color: "#EF4444" }]}>
              {product.stockQuantity > 0 ? `${product.stockQuantity} In Stock` : "Out of Stock"}
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
                <ActivityIndicator color="#F2A20C" style={{ flex: 1 }} />
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
                <View style={[styles.cartBtn, styles.addedBtn]}>
                  <Ionicons name="checkmark-circle" size={18} color="#166534" />
                  <Text style={[styles.cartBtnText, styles.addedBtnText]}>ADDED</Text>
                </View>
              )}

              <TouchableOpacity style={styles.wishlistBtn} onPress={toggleWishlist}>
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
                  <Text style={styles.emptyText}>No compatibility data available</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews ({reviewsData.totalReviews})</Text>
              {reviewsData.reviews.length ? (
                reviewsData.reviews.map((review, i) => (
                  <View key={i} style={styles.reviewCard}>
                    <Text style={styles.reviewUser}>{review.userName}</Text>
                    <Text style={styles.reviewStars}>{"★".repeat(review.rating)}</Text>
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
    width: 40, height: 40, borderRadius: 12, margin: 15,
    backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center",
  },
  pageWrap: {
    flexDirection: Platform.OS === "web" && width > 800 ? "row" : "column",
    maxWidth: 1280, width: "100%", alignSelf: "center", padding: 18, gap: 20,
  },
  galleryCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 24, padding: 20,
    minHeight: 300, justifyContent: "center", alignItems: "center",
  },
  productImage: { width: "100%", height: isDesktop ? 480 : 300, resizeMode: "contain", borderRadius: 16 },
  infoCard: { flex: 1, backgroundColor: "#fff", borderRadius: 24, padding: 22 },
  categoryText: { fontSize: 12, fontWeight: "700", color: "#7C3AED", marginBottom: 8 },
  productTitle: { fontSize: 24, fontWeight: "900", color: "#111827", marginBottom: 14 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontSize: 28, fontWeight: "900", color: "#F59E0B" },
  discountPill: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  discountText: { color: "#92400E", fontWeight: "800", fontSize: 12 },
  stockText: { marginTop: 10, color: "#059669", fontWeight: "700", marginBottom: 18 },
  specGrid: { flexDirection: "row", gap: 12, marginBottom: 18 },
  specBox: { flex: 1, backgroundColor: "#F8FAFC", padding: 14, borderRadius: 16 },
  specLabel: { color: "#64748B", fontSize: 11 },
  specValue: { fontWeight: "800", color: "#111827", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  cartBtn: { flex: 1, height: 54, borderRadius: 16, backgroundColor: "#111827", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  cartBtnText: { color: "#fff", fontWeight: "800" },
  addedBtn: { backgroundColor: "#DCFCE7" },
  addedBtnText: { color: "#166534" },
  wishlistBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 10 },
  sectionText: { color: "#475569", lineHeight: 22 },
  vehicleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vehicleChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F8FAFC" },
  vehicleText: { fontWeight: "700", color: "#334155" },
  reviewCard: { backgroundColor: "#F8FAFC", padding: 14, borderRadius: 16, marginBottom: 10 },
  reviewUser: { fontWeight: "800", marginBottom: 4 },
  reviewStars: { color: "#F59E0B", marginBottom: 4 },
  reviewComment: { color: "#475569" },
  emptyText: { color: "#94A3B8" },
  disabledBtn: { backgroundColor: "#CBD5E1" },

  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: "#FFF" },
  errorTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B", marginTop: 20 },
  errorSubtitle: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 10, lineHeight: 20 },
  backBtn: { marginTop: 30, backgroundColor: "#111827", paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  backBtnText: { color: "#FFF", fontWeight: "700" },
});