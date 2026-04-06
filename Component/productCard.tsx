import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Product = {
  id: string;
  name: string;
  price: string;
  category: string;
  status: "Active" | "Low Stock" | "Out of Stock";
  stock: number;
  image: string | string[];
};

type Props = {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onView: (product: Product) => void;
};

const ProductCard: React.FC<Props> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onView,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onToggleWishlist(product);
  };

  const imageSource = Array.isArray(product.image)
    ? { uri: product.image[0] }
    : { uri: product.image };
  const isOutOfStock = product.status === "Out of Stock";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onView(product)}
      style={styles.card}
    >
      {/* IMAGE SECTION */}
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} />

        {/* TOP OVERLAYS */}
        <View style={styles.topRow}>
          {/* Status Badge */}
          <View style={[styles.badge, isOutOfStock && styles.outOfStockBadge]}>
            <Text style={styles.badgeText}>
              {isOutOfStock ? "SOLD OUT" : product.category.toUpperCase()}
            </Text>
          </View>

          {/* Wishlist Button */}
          <TouchableOpacity onPress={handleWishlist} style={styles.wishlistBtn}>
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={20}
              color={isWishlisted ? "#EF4444" : "#1A1A1A"}
            />
          </TouchableOpacity>
        </View>

        {/* PRICE TAG OVERLAY */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{product.price}</Text>
        </View>
      </View>

      {/* CONTENT SECTION */}
      <View style={styles.content}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>4.9 (120+ Reviews)</Text>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        {/* ACTION AREA */}
        <View style={styles.footer}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>EST. DELIVERY</Text>
            <Text style={styles.stockValue}>2-3 Days</Text>
          </View>

          <TouchableOpacity
            style={[styles.cartBtn, isOutOfStock && styles.disabledBtn]}
            onPress={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={18} color="#000" />
            <Text style={styles.cartBtnText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
      },
      android: { elevation: 6 },
    }),
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  imageContainer: {
    height: 170,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  topRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockBadge: {
    backgroundColor: "#EF4444",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 0.5,
  },
  wishlistBtn: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  priceTag: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderTopRightRadius: 16,
  },
  priceText: {
    color: "#F2A20C",
    fontWeight: "900",
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  stockInfo: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  stockValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22C55E",
  },
  cartBtn: {
    backgroundColor: "#F2A20C",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  cartBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
  },
  disabledBtn: {
    backgroundColor: "#E2E8F0",
    opacity: 0.6,
  },
});

export default ProductCard;
