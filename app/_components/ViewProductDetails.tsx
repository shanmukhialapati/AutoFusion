import { cartApi, categoryApi } from "@/axios/axiosInstance";
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
type AlertType = "success" | "warning" | "error";
export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const [quantity, setQuantity] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const isOutOfStock =
    product?.status === "Out of Stock" || product?.stockQuantity <= 0;
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
  const getToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Login Required", "Please login first.");
      return null;
    }
    return token;
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

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, fetchDetails]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!product) return null;
  const parsePrice = (price: string | number) =>
    typeof price === "string"
      ? parseFloat(price.replace(/[^0-9.]/g, ""))
      : price;
  const updateCartAPI = async (newQty: number) => {
    if (newQty < 0) return;

    setAddingToCart(true);

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        showAlert("warning", "Login Required", "Please log in first.");
        return;
      }

      const numericPrice = parsePrice(product.price);

      const payload = {
        pid: product.id,
        pname: product.name,
        actualPrice: product.actualPrice || numericPrice,
        discount: product.discount || 0,
        price: numericPrice,
        quantity: newQty,
      };

      console.log("Posting to cart:", payload);

      const response = await cartApi.post("/orders/bag/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if ([200, 201].includes(response.status)) {
        const previousQty = quantity;
        setQuantity(newQty);

        if (previousQty === 0 && newQty === 1) {
          showAlert(
            "success",
            "Added to Cart",
            `${product.name} added to bag!`,
          );
        } else if (newQty === 0) {
          showAlert("warning", "Removed", `${product.name} removed from bag.`);
        } else if (newQty > previousQty) {
          showAlert(
            "success",
            "Quantity Increased",
            `${product.name} quantity increased to ${newQty}.`,
          );
        } else if (newQty < previousQty) {
          showAlert(
            "warning",
            "Quantity Decreased",
            `${product.name} quantity decreased to ${newQty}.`,
          );
        }
      }
    } catch (error: any) {
      console.log(error?.response?.data || error);
      showAlert(
        "error",
        "Error",
        error.response?.data?.message || "Connection failed.",
      );
    } finally {
      setAddingToCart(false);
    }
  };
  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.iconCircle}>
          <Ionicons name="share-social-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={isWeb ? styles.webLayout : styles.mobileLayout}>
          <View>
            <View
              style={
                isWeb ? styles.imageContainerWeb : styles.imageContainerMobile
              }
            >
              <Image
                source={{ uri: product.photoUrl }}
                style={styles.mainImage}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>

              {[1, 2, 3].map((item) => (
                <View key={item} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>User {item}</Text>
                    <Text style={styles.reviewRating}>★★★★★</Text>
                  </View>
                  <Text style={styles.reviewText}>
                    Excellent product quality, perfect fit and delivery was
                    fast. Highly recommended for automobile enthusiasts.
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View
            style={
              isWeb ? styles.detailsContainerWeb : styles.detailsContainerMobile
            }
          >
            <Text style={styles.categoryLabel}>
              {product.categoryName} • {product.subCategoryName}
            </Text>
            <Text style={styles.title}>{product.name}</Text>

            <View style={styles.specGrid}>
              <View style={styles.specCard}>
                <Text style={styles.specTitle}>Brand</Text>
                <Text style={styles.specValue}>{product.company}</Text>
              </View>
              <View style={styles.specCard}>
                <Text style={styles.specTitle}>Part No</Text>
                <Text style={styles.specValue}>{product.partNumber}</Text>
              </View>
            </View>

            <View style={styles.priceCard}>
              <Text style={styles.price}>${product.price.toFixed(2)}</Text>
              {product.discount > 0 && (
                <View style={styles.discountRow}>
                  <Text style={styles.actualPrice}>
                    ${product.actualPrice.toFixed(2)}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {product.discount}% OFF
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.stockBadge}>
              {product.stockQuantity > 0
                ? `In Stock (${product.stockQuantity})`
                : "Out of Stock"}
            </Text>

            <View style={styles.actionRow}>
              {/* <TouchableOpacity style={styles.cartBtn}>
                <Text style={styles.cartBtnText}>ADD TO CART</Text>
              </TouchableOpacity> */}
              {addingToCart ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color="#F2A20C" />
                </View>
              ) : quantity === 0 ? (
                <TouchableOpacity
                  style={[styles.cartBtn, isOutOfStock && styles.disabledBtn]}
                  onPress={() => updateCartAPI(1)}
                  disabled={isOutOfStock}
                >
                  <Ionicons name="cart-outline" size={18} color="#ffffff" />
                  <Text style={styles.cartBtnText}>ADD</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => updateCartAPI(quantity - 1)}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="remove" size={18} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateCartAPI(quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="add" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={styles.wishBtn}>
                <Ionicons name="heart-outline" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compatible Vehicles</Text>

              {product.compatibleVehicles?.length > 0 ? (
                <View style={styles.vehicleGrid}>
                  {product.compatibleVehicles.map((v: string, i: number) => (
                    <View key={i} style={styles.vehicleChip}>
                      <Ionicons name="car-sport" size={14} color="#475569" />
                      <Text style={styles.vehicleText}>{v}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCompatibilityBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#94A3B8"
                  />
                  <Text style={styles.emptyCompatibilityText}>
                    No compatible vehicles available
                  </Text>
                </View>
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
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: { paddingBottom: 28 },
  mobileLayout: { flexDirection: "column" },
  webLayout: {
    flexDirection: "row",
    padding: 20,
    gap: 20,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  imageContainerMobile: {
    width: "100%",
    height: width * 0.72,
    backgroundColor: "#FFF",
  },
  imageContainerWeb: {
    flex: 1,
    height: 480,
    backgroundColor: "#FFF",
    borderRadius: 18,
    overflow: "hidden",
  },
  mainImage: { width: "100%", height: "100%", resizeMode: "contain" },
  detailsContainerMobile: { padding: 16 },
  detailsContainerWeb: { flex: 1 },
  categoryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F59E0B",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 14,
  },
  specGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  specCard: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
  },
  specTitle: { fontSize: 10, color: "#94A3B8" },
  specValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 4,
  },
  priceCard: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  price: { fontSize: 28, fontWeight: "900", color: "#F59E0B" },
  discountRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    alignItems: "center",
  },
  actualPrice: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
    fontSize: 13,
  },
  badge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: "#DC2626", fontWeight: "800", fontSize: 11 },
  stockBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    color: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 14,
  },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  cartBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBtnText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  wishBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  descText: { color: "#475569", lineHeight: 22, fontSize: 14 },
  vehicleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  vehicleText: { fontWeight: "700", color: "#334155", fontSize: 12 },
  reviewCard: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewerName: {
    fontWeight: "800",
    color: "#0F172A",
    fontSize: 13,
  },
  reviewRating: {
    color: "#F59E0B",
    fontWeight: "700",
    fontSize: 12,
  },
  reviewText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 20,
  },
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
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2A20C",
    borderRadius: 16,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    paddingHorizontal: 10,
  },
  loaderContainer: { width: 80, alignItems: "center" },
  emptyCompatibilityBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
  },

  emptyCompatibilityText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
});
