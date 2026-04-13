import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { orderApi } from "../axios/axiosInstance";

interface CartItem {
  id: number;
  productId: number;
  pname: string;
  actualPrice: number;
  discount: number;
  price: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CartResponse {
  cartItems: CartItem[];
  subTotal: number;
  deliveryCharge: number;
  grandTotal: number;
}

// Helper to handle JS float precision issues
const formatPrice = (price: number) => {
  return Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const CartPage = () => {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await orderApi.get(`/orders/cart`);
      const data: CartResponse = response.data;

      setCartItems(data.cartItems || []);
      setSubTotal(data.subTotal || 0);
      setDeliveryCharge(data.deliveryCharge || 0);
      setGrandTotal(data.grandTotal || 0);
    } catch (error) {
      console.error("Cart fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart();
  }, []);

  const updateQuantity = async (cartItemId: number, newQty: number) => {
    if (newQty < 1) return;

    const itemToUpdate = cartItems.find((item) => item.id === cartItemId);
    if (!itemToUpdate) return;

    const change = newQty - itemToUpdate.quantity;

    try {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                quantity: newQty,
                totalPrice: item.price * newQty,
                unitPrice: item.actualPrice * newQty,
              }
            : item,
        ),
      );

      await orderApi.patch(
        `/orders/cart/update/${itemToUpdate.id}?change=${change}`,
      );

      fetchCart();
    } catch (error) {
      Alert.alert("Error", "Could not update quantity");
      fetchCart();
    }
  };

  const removeItem = (id: number) => {
    const action = async () => {
      setCartItems((prev) => prev.filter((item) => item.id !== id));

      try {
        await orderApi.delete(`/orders/bag/remove/${id}`);
        fetchCart();
      } catch (error) {
        Alert.alert("Error", "Could not remove item");
        fetchCart();
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Remove this item from cart?")) action();
    } else {
      Alert.alert("Remove Item", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: action },
      ]);
    }
  };

  const clearCart = () => {
    const action = async () => {
      setCartItems([]);
      setSubTotal(0);
      setDeliveryCharge(0);
      setGrandTotal(0);

      try {
        await orderApi.delete(`/orders/cart/clear`);
        fetchCart();
      } catch (error) {
        Alert.alert("Error", "Could not clear cart");
        fetchCart();
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Clear your entire cart?")) action();
    } else {
      Alert.alert("Clear Cart", "Are you sure you want to clear all items?", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear All", style: "destructive", onPress: action },
      ]);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const hasDiscount = item.actualPrice > item.price;
    const totalSavings = item.unitPrice - item.totalPrice;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.nameContainer}>
            <View style={styles.iconBox}>
              <Package size={20} color="#F2A20C" />
            </View>
            <View style={styles.nameAndPerUnit}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.pname}
              </Text>
              <View style={styles.perUnitRow}>
                <Text style={styles.perUnitText}>
                  ₹{formatPrice(item.price)} / unit
                </Text>
                {hasDiscount && (
                  <Text style={styles.perUnitStrikethrough}>
                    ₹{formatPrice(item.actualPrice)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => removeItem(item.id)}
            style={styles.deleteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.priceContainer}>
            <View style={styles.totalPriceRow}>
              <Text style={styles.itemPrice}>
                ₹{formatPrice(item.totalPrice)}
              </Text>
              {hasDiscount && (
                <Text style={styles.actualPrice}>
                  ₹{formatPrice(item.unitPrice)}
                </Text>
              )}
            </View>
            {hasDiscount && totalSavings > 0 && (
              <Text style={styles.savingsText}>
                You save ₹{formatPrice(totalSavings)}
              </Text>
            )}
          </View>

          <View style={styles.qtyContainer}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              style={styles.qtyBtn}
            >
              <Minus size={16} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <Plus size={16} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // 🔹 Move Summary into its own function so we can pass it to ListFooterComponent
  const renderSummary = () => {
    if (cartItems.length === 0) return null;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>ORDER SUMMARY</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{formatPrice(subTotal)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Charge</Text>
          <Text
            style={[
              styles.summaryValue,
              deliveryCharge === 0 && styles.freeText,
            ]}
          >
            {deliveryCharge === 0 ? "FREE" : `₹${formatPrice(deliveryCharge)}`}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.summaryRow, styles.grandTotalRow]}>
          <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.totalValue}>₹{formatPrice(grandTotal)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() =>
            router.push({
              pathname: "/checkout",
              params: {
                orderItemIds: cartItems.map((item) => item.id).join(","),
              },
            })
          }
        >
          <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
          <ChevronRight size={20} color="#1A1A1A" />
        </TouchableOpacity>
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
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.headerIconBtn}
        >
          <ArrowLeft color="#F2A20C" size={24} />
        </TouchableOpacity>
        <Text style={styles.header}>SHOPPING CART</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Trash2 size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderSummary} // 🔹 This makes it scroll below items!
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F2A20C"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBag size={60} color="#E0E0E0" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/")}
            >
              <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA", // Light off-white background
  },
  center: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: Platform.OS === "android" ? 10 : 20,
    // marginBottom: 20,
  },
  header: {
    color: "#1A1A1A", // Dark text
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
  },
  clearBtn: {
    padding: 8,
    backgroundColor: "#FFF2F0",
    borderRadius: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Reduced since summary scrolls now
  },

  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  headerIconBtn: {
    padding: 10,
  marginRight: 10,
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
  },
  iconBox: {
    backgroundColor: "#FFF8F0", 
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  nameAndPerUnit: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 2,
  },
  perUnitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  perUnitText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
  },
  perUnitStrikethrough: {
    color: "#999",
    fontSize: 11,
    fontWeight: "500",
    textDecorationLine: "line-through",
  },
  deleteBtn: {
    padding: 4,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priceContainer: {
    flexDirection: "column",
    gap: 2,
  },
  totalPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  itemPrice: {
    color: "#F2A20C",
    fontSize: 18,
    fontWeight: "900",
  },
  actualPrice: {
    color: "#999",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  savingsText: {
    color: "#34C759",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 2,
  },
  qtyBtn: { padding: 8 },
  qtyText: {
    color: "#1A1A1A",
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "800",
  },

  // Summary Card (Now Scrollable)
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: { color: "#666", fontSize: 14, fontWeight: "500" },
  summaryValue: { color: "#1A1A1A", fontSize: 14, fontWeight: "700" },
  freeText: { color: "#34C759", fontWeight: "800" },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  grandTotalRow: {
    marginTop: 4,
    marginBottom: 20,
  },
  totalLabel: { color: "#1A1A1A", fontSize: 15, fontWeight: "800" },
  totalValue: { color: "#F2A20C", fontSize: 20, fontWeight: "900" },

  checkoutBtn: {
    backgroundColor: "#F2A20C",
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  checkoutText: {
    color: "#1A1A1A",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },

  // Empty State
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    color: "#1A1A1A",
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
    fontWeight: "700",
  },
  shopBtn: {
    borderWidth: 1,
    borderColor: "#F2A20C",
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: { color: "#F2A20C", fontWeight: "800", letterSpacing: 0.5 },
});

export default CartPage;
