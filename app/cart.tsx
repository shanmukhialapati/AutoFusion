import { useRouter } from "expo-router";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { orderApi } from "../axios/axiosInstance";

// 1. Updated Interfaces to perfectly match your JSON response
interface CartItem {
  id: number;
  productId: number; // 🔹 Updated from pid to match JSON
  uid?: string;
  pname: string;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  quantity: number;
}

interface CartResponse {
  cartItems: CartItem[];
  subTotal: number;
  deliveryCharge: number;
  grandTotal: number;
}

const CartPage = () => {
  const router = useRouter();

  // 2. Updated State to hold the new totals
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

      // Extract the new object structure into our state
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

    // 🔹 Find the targeted item so we can grab its productId for the payload
    const itemToUpdate = cartItems.find((item) => item.id === cartItemId);
    if (!itemToUpdate) return;

    // 🔹 Calculate the difference (will be 1 for Plus, -1 for Minus)
    const change = newQty - itemToUpdate.quantity;

    try {
      // Optimistically update UI so the number changes instantly
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQty } : item,
        ),
      );

      // 🔹 ACTUAL UPDATE API CALL using PATCH with query parameter
      await orderApi.patch(
        `/orders/cart/update/${itemToUpdate.id}?change=${change}`,
      );

      // Refresh to get the newly calculated grandTotals from the server
      fetchCart();
    } catch (error) {
      Alert.alert("Error", "Could not update quantity");
      fetchCart(); // Revert back on error
    }
  };

  const removeItem = (id: number) => {
    const action = async () => {
      // Optimistic delete
      setCartItems((prev) => prev.filter((item) => item.id !== id));

      try {
        // ACTUAL DELETE API CALL
        await orderApi.delete(`/orders/bag/remove/${id}`);

        fetchCart(); // Fetch to update the grand totals
      } catch (error) {
        Alert.alert("Error", "Could not remove item");
        fetchCart(); // Revert back on error
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

  // 🔹 NEW LOGIC: Clear entirely cart
  const clearCart = () => {
    const action = async () => {
      // Optimistic clear UI
      setCartItems([]);
      setSubTotal(0);
      setDeliveryCharge(0);
      setGrandTotal(0);

      try {
        await orderApi.delete(`/orders/cart/clear`);
        fetchCart(); // Fetch to sync with server
      } catch (error) {
        Alert.alert("Error", "Could not clear cart");
        fetchCart(); // Revert back on error
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

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/1973/1973636.png",
        }}
        style={styles.image}
      />
      <View style={styles.details}>
        <Text style={styles.itemName}>{item.pname}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>
            ₹{item.totalPrice.toLocaleString()}
          </Text>
          {item.discount > 0 && (
            <Text style={styles.actualPrice}>
              ₹{item.unitPrice.toLocaleString()}
            </Text>
          )}
        </View>

        <View style={styles.controls}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              style={styles.qtyBtn}
            >
              <Minus size={16} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <Plus size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Trash2 size={20} color="#FF453A" />
          </TouchableOpacity>
        </View>
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
      {/* 🔹 Added inline view to hold the title and clear button side-by-side */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.header}>SHOPPING CART</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Trash2 size={24} color="#FF453A" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        // Give enough padding at bottom so the last item isn't hidden by the larger footer
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F2A20C"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBag size={60} color="#333" />
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

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          {/* 3. New Detailed Price Breakdown */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ₹
              {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charge</Text>
            <Text
              style={[
                styles.summaryValue,
                deliveryCharge === 0 && styles.freeText,
              ]}
            >
              {deliveryCharge === 0
                ? "FREE"
                : `₹${deliveryCharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>
              ₹
              {grandTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutBtn}
            // 🔹 MODIFIED: Pass the item IDs to the checkout page as a comma-separated string
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A", paddingHorizontal: 20 },
  center: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 20,
    letterSpacing: 1,
  },
  list: { paddingBottom: 220 }, // Increased padding for the taller footer
  card: {
    flexDirection: "row",
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#333",
    tintColor: "#AAA",
    resizeMode: "contain",
  },
  details: { flex: 1, marginLeft: 15, justifyContent: "space-between" },
  itemName: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemPrice: { color: "#F2A20C", fontSize: 16, fontWeight: "800" },
  actualPrice: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 6,
    padding: 4,
  },
  qtyBtn: { padding: 6 },
  qtyText: { color: "#FFF", paddingHorizontal: 15, fontWeight: "700" },

  // Footer & Summary Styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#262626",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingBottom: Platform.OS === "ios" ? 30 : 20, // Extra padding for iPhone notch
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { color: "#888", fontSize: 14, fontWeight: "500" },
  summaryValue: { color: "#CCC", fontSize: 14, fontWeight: "600" },
  freeText: { color: "#34C759", fontWeight: "800" }, // Green color for "FREE"
  grandTotalRow: {
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#444",
    marginBottom: 12,
  },
  totalLabel: { color: "#AAA", fontSize: 14, fontWeight: "700" },
  totalValue: { color: "#FFF", fontSize: 20, fontWeight: "900" },

  checkoutBtn: {
    backgroundColor: "#F2A20C",
    height: 48,
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
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#666", fontSize: 18, marginTop: 20, marginBottom: 30 },
  shopBtn: {
    borderWidth: 1,
    borderColor: "#F2A20C",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 4,
  },
  shopBtnText: { color: "#F2A20C", fontWeight: "700" },
});

export default CartPage;
