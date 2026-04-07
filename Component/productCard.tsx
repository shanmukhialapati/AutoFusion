import { cartApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PremiumAlert from "../app/_components/PremiumAlert";

type AlertType = "success" | "warning" | "error";

export type Product = {
  id: string;
  name: string;
  price: string;
  actualPrice?: number;
  discount?: number;
  category: string;
  status: "Active" | "Low Stock" | "Out of Stock";
  stock: number;
  image: string | string[];
  description?: string;
  compatibility?: {
    brand: string;
    model: string;
    year: string;
    fuelType: string;
  }[];
};

type Props = {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onView: (product: Product) => void;
};

const ProductCard: React.FC<Props> = ({
  product,
  onToggleWishlist,
  onView,
}) => {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);

  const isOutOfStock = product.status === "Out of Stock";

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

  const updateCartAPI = async (newQty: number) => {
    if (newQty < 0) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showAlert(
          "warning",
          "Login Required",
          "Please log in to add items to your cart.",
        );
        setLoading(false);
        return;
      }

      const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, ""));
      const payload = {
        pid: product.id,
        pname: product.name,
        actualPrice: product.actualPrice || numericPrice,
        discount: product.discount || 0,
        price: numericPrice,
        quantity: newQty,
      };

      const response = await cartApi.post("/orders/bag/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 201) {
        setQuantity(newQty);
        if (newQty === 1)
          showAlert("success", "Success", `${product.name} added to bag!`);
      }
    } catch (error: any) {
      showAlert(
        "error",
        "Error",
        error.response?.data?.message || "Connection failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (onView) onView(product);

    router.push({
      pathname: "./ViewProductDetails", // Replace with your actual route path
      params: { id: product.id },
    });
  };

  const imageSource = Array.isArray(product.image)
    ? { uri: product.image[0] }
    : { uri: product.image };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} />
          <View style={styles.topRow}>
            {/* <View
              style={[styles.badge, isOutOfStock && styles.outOfStockBadge]}
            >
              <Text style={styles.badgeText}>
                {isOutOfStock ? "SOLD OUT" : product.category.toUpperCase()}
              </Text>
            </View> */}
            <TouchableOpacity
              onPress={() => {
                setIsWishlisted(!isWishlisted);
                onToggleWishlist(product);
              }}
              style={styles.wishlistBtn}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? "#EF4444" : "#1A1A1A"}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{product.price}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>4.9 (120+ Reviews)</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.badgeText}>
            {isOutOfStock ? "SOLD OUT" : product.category.toUpperCase()}
          </Text>
          <View style={styles.footer}>
            <View style={styles.stockInfo}>
              <Text style={styles.stockValue}>Stock:{product.stock}</Text>
            </View>

            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#F2A20C" />
              </View>
            ) : quantity === 0 ? (
              <TouchableOpacity
                style={[styles.cartBtn, isOutOfStock && styles.disabledBtn]}
                onPress={() => updateCartAPI(1)}
                disabled={isOutOfStock}
              >
                <Ionicons name="cart-outline" size={18} color="#000" />
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
          </View>
        </View>
      </TouchableOpacity>

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

// ... Styles remain the same (excluding Modal specific styles)
const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  imageContainer: {
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  topRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  badge: {
    width: 80,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(221, 219, 219, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 12,
  },
  outOfStockBadge: { backgroundColor: "#FCA5A5" },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8b8b8b",
    paddingTop: 10,
  },
  wishlistBtn: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  viewBtn: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  priceTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#1a1a1afb",
    paddingHorizontal: 13,
    paddingVertical: 3,
    borderTopRightRadius: 20,
  },
  priceText: { color: "#F2A20C", fontWeight: "700", fontSize: 16 },
  content: { padding: 16 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ratingText: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  name: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  stockInfo: { flex: 1 },
  stockLabel: { fontSize: 9, fontWeight: "800", color: "#94A3B8" },
  stockValue: { fontSize: 13, fontWeight: "700", color: "#22C55E" },
  cartBtn: {
    backgroundColor: "#F2A20C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
  },
  cartBtnText: { fontSize: 14, fontWeight: "800", color: "#000" },
  disabledBtn: { backgroundColor: "#E2E8F0", opacity: 0.7 },
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
});

export default ProductCard;
