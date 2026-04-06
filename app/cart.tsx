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
import axiosInstance from "../axios/axiosInstance";

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  productImage: string;
}

const CartPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      // Assuming GET /cart returns your list of items
      const response = await axiosInstance.get("/cart");
      setCartItems(Array.isArray(response.data) ? response.data : []);
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

  const updateQuantity = async (productId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      // Using your POST /api/cart/add endpoint
      await axiosInstance.post("/cart/add", {
        productId: productId,
        quantity: newQty,
      });
      fetchCart(); // Refresh to get updated totalPrices from server
    } catch (error) {
      Alert.alert("Error", "Could not update quantity");
    }
  };

  const removeItem = (id: number) => {
    const action = () => {
      // Optimistic delete
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      // Add your DELETE /cart/{id} call here if applicable
    };

    if (Platform.OS === "web") {
      if (window.confirm("Remove this item from cart?")) action();
    } else {
      Alert.alert("Remove Item", "Are you sure?", [
        { text: "Cancel" },
        { text: "Remove", style: "destructive", onPress: action },
      ]);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.productImage }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>

        <View style={styles.controls}>
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              style={styles.qtyBtn}
            >
              <Minus size={16} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
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
      <Text style={styles.header}>SHOPPING CART</Text>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
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
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>
              ₹{calculateSubtotal().toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn}>
            <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
            <ChevronRight size={20} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A", padding: 20 },
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
    marginTop: 40,
    marginBottom: 20,
    letterSpacing: 1,
  },
  list: { paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  image: { width: 90, height: 90, borderRadius: 8, backgroundColor: "#333" },
  details: { flex: 1, marginLeft: 15, justifyContent: "space-between" },
  itemName: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  itemPrice: { color: "#F2A20C", fontSize: 14, fontWeight: "600" },
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#262626",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  totalLabel: { color: "#AAA", fontSize: 14, fontWeight: "600" },
  totalValue: { color: "#FFF", fontSize: 20, fontWeight: "900" },
  checkoutBtn: {
    backgroundColor: "#F2A20C",
    height: 55,
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
