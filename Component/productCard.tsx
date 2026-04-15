import { cartApi, wishlistApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
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
  rating?: number;
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
  initialQuantity?: number;
  onAddToCart?: (product: Product, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  onView: (product: Product) => void;
};

const ProductCard: React.FC<Props> = ({
  product,
  onToggleWishlist,
  initialQuantity = 0,
  onView,
}) => {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isAndroid = Platform.OS === "android";
  const cardBorderRadius = isAndroid ? 16 : 24;
  const imageHeight = isMobile ? (isAndroid ? 120 : 140) : 180;
  const titleSize = isMobile ? (isAndroid ? 13 : 14) : 18;
  const priceSize = isMobile ? (isAndroid ? 13 : 14) : 16;
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

  useEffect(() => {
    const fetchCartStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await cartApi.get("/orders/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const items = res.data?.cartItems || [];

        const cartItem = items.find(
          (item: any) => item.productId?.toString() === product.id.toString(),
        );

        if (cartItem) {
          setQuantity(cartItem.quantity);
        } else {
          setQuantity(0);
        }
      } catch (err) {
        console.log("Cart fetch error:", err);
      }
    };

    fetchCartStatus();
  }, [product.id, initialQuantity]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await wishlistApi.get("/wishlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const wishlistItems = res.data?.items || [];

        const exists = wishlistItems.some(
          (item: any) => item.productId?.toString() === product.id.toString(),
        );

        setIsWishlisted(exists);
      } catch (err) {
        console.log("Wishlist fetch error:", err);
      }
    };

    checkWishlistStatus();
  }, [product.id]);

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

      const payload = {
        productId: product.id,
        quantity: newQty,
      };

      const response = await cartApi.post("/orders/bag/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 201) {
        if (newQty === 1 && quantity === 0) {
          showAlert("success", "Success", `${product.name} added to bag!`);
        } else if (newQty === 0 && quantity === 1) {
          showAlert("warning", "Removed", `${product.name} removed from bag.`);
        }

        setQuantity(newQty);
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

  const handleWishlistToggle = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        showAlert(
          "warning",
          "Login Required",
          "Please log in to manage wishlist.",
        );
        return;
      }

      if (!isWishlisted) {
        await wishlistApi.post(`/wishlist/${product.id}`, null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsWishlisted(true);

        showAlert(
          "success",
          "Wishlist Updated",
          `${product.name} added to wishlist.`,
        );
      } else {
        await wishlistApi.delete(`/wishlist/${product.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsWishlisted(false);

        showAlert(
          "warning",
          "Wishlist Updated",
          `${product.name} removed from wishlist.`,
        );
      }

      onToggleWishlist?.(product);
    } catch (error: any) {
      console.log("Wishlist Error:", error?.response?.data || error);

      showAlert(
        "error",
        "Wishlist Error",
        error?.response?.data?.message || "Failed to update wishlist.",
      );
    }
  };

  const handlePress = () => {
    if (onView) onView(product);

    router.push({
      pathname: "/_components/ViewProductDetails",
      params: { id: product.id },
    });
  };

  const imageSource = Array.isArray(product.image)
    ? { uri: product.image[0] }
    : { uri: product.image };

  return (
    <View style={[styles.container, isMobile && { marginHorizontal: 4 }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[
          styles.card,
          { borderRadius: cardBorderRadius },
          isAndroid && styles.androidShadow,
        ]}
      >
        <View
          style={[
            styles.imageContainer,
            {
              height: imageHeight,
              borderTopLeftRadius: cardBorderRadius,
              borderTopRightRadius: cardBorderRadius,
            },
          ]}
        >
          <Image source={imageSource} style={styles.image} />
          <View style={styles.topRow}>
            <View
              style={[
                styles.badge,
                isOutOfStock ? styles.outOfStockBadge : styles.activeBadge,
                isAndroid && { minWidth: 55, paddingVertical: 2 },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isOutOfStock ? styles.outOfStockText : styles.activeText,
                  isAndroid && { fontSize: 7 },
                ]}
              >
                {isOutOfStock ? "OUT OF STOCK" : "Active"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleWishlistToggle}
              style={[
                styles.wishlistBtn,
                isAndroid && { width: 28, height: 28 },
              ]}
            >
              <Ionicons
                name={isWishlisted ? "heart" : "heart-outline"}
                size={20}
                color={isWishlisted ? "#EF4444" : "#1A1A1A"}
              />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.priceTag,
              isAndroid && { paddingHorizontal: 6, borderTopRightRadius: 12 },
            ]}
          >
            <Text style={styles.priceText}>{product.price}</Text>
          </View>
        </View>

        <View style={[styles.content, isAndroid && { padding: 8 }]}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>
              {product.rating != null
                ? Number(product.rating).toFixed(1)
                : "0.0"}
            </Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.catText}>{product.category.toUpperCase()}</Text>
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
              
              <View style={[styles.cartBtn, styles.addedBtn]}>
                <Ionicons name="checkmark-circle" size={18} color="#166534" />
                <Text style={[styles.cartBtnText, styles.addedBtnText]}>
                  ADDED
                </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1,width:Platform.OS==="web"? "95%":"73%" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    marginHorizontal: Platform.OS==="web"?8:2,
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
    justifyContent: "space-between",
  },
  wishlistBtn: {
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

  // NEW STYLES for the added state
  addedBtn: {
    backgroundColor: "#DCFCE7", // Soft green background
  },
  addedBtnText: {
    color: "#166534", // Dark green text
  },

  loaderContainer: { width: 80, alignItems: "center" },
  badge: {
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 85,
  },
  activeBadge: {
    backgroundColor: "#DCFCE7",
  },
  outOfStockBadge: {
    backgroundColor: "#FEE2E2",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#918f8f",
  },
  catText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#918f8f",
    paddingTop: 10,
  },
  activeText: {
    color: "#166534",
  },
  outOfStockText: {
    color: "#991B1B",
  },
  stockValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22C55E",
  },
  androidShadow: {
    elevation: 2,
  },
});

export default ProductCard;
