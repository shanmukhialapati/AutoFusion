import { orderApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface OrderItem {
  id: number;
  productId: number;
  pname: string;
  quantity: number;
  totalPrice: number;
}

interface Order {
  orderId: number;
  orderStatus: string;
  paymentMode: string;
  deliveryCost: number;
  finalAmount: number;
  orderItems: OrderItem[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PLACED: {
    label: "Order Placed",
    color: "#3B82F6",
    icon: "cube-outline",
  },
  DISPATCHED: {
    label: "Dispatched",
    color: "#F59E0B",
    icon: "car-outline",
  },
  DELIVERED: {
    label: "Delivered",
    color: "#10B981",
    icon: "checkmark-done-circle-outline",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#EF4444",
    icon: "close-circle-outline",
  },
};

const FILTERS = ["All", "PLACED", "DISPATCHED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [deliveringOrderId, setDeliveringOrderId] = useState<number | null>(
    null,
  );

  const fetchOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await orderApi.get("/orders/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(res.data || []);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
      Alert.alert("Error", "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleMarkDelivered = async (orderId: number) => {
    try {
      setDeliveringOrderId(orderId);

      const token = await AsyncStorage.getItem("token");

      await orderApi.patch(
        `/orders/deliver/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert("Success", "Order marked as delivered.");
      fetchOrders();
    } catch (error) {
      console.error("Deliver Update Error:", error);
      Alert.alert("Error", "Failed to mark order as delivered.");
    } finally {
      setDeliveringOrderId(null);
    }
  };

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a rating.");
      return;
    }

    Alert.alert(
      "Review Submitted",
      `Order #${selectedOrder?.orderId}\nRating: ${rating}\nReview: ${
        reviewText || "No Comment"
      }`,
    );

    closeReviewModal();
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedOrder(null);
    setRating(0);
    setReviewText("");
  };

  const filteredOrders = useMemo(() => {
    return activeFilter === "All"
      ? orders
      : orders.filter((o) => o.orderStatus === activeFilter);
  }, [activeFilter, orders]);

  const renderStars = () => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => setRating(star)}>
          <Ionicons
            name={rating >= star ? "star" : "star-outline"}
            size={30}
            color="#F2A20C"
          />
        </Pressable>
      ))}
    </View>
  );

  const renderOrderCard = ({ item }: { item: Order }) => {
    const config = STATUS_CONFIG[item.orderStatus] || {
      label: item.orderStatus,
      color: "#94A3B8",
      icon: "help-circle-outline" as keyof typeof Ionicons.glyphMap,
    };

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderIdText}>Order #{item.orderId}</Text>
            <Text style={styles.paymentTag}>{item.paymentMode}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${config.color}15` },
            ]}
          >
            <Ionicons
              name={config.icon}
              size={14}
              color={config.color}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.productsSection}>
          {item.orderItems.map((prod) => (
            <View key={prod.id} style={styles.productRow}>
              <Text style={styles.productName} numberOfLines={1}>
                {prod.quantity}x {prod.pname}
              </Text>
              <Text style={styles.productPrice}>
                ${prod.totalPrice.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.totalsRow}>
          <View>
            <Text style={styles.feeText}>
              Delivery: ${item.deliveryCost.toFixed(2)}
            </Text>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.finalPrice}>
              ${item.finalAmount.toFixed(2)}
            </Text>
          </View>

          {item.orderStatus === "DISPATCHED" && (
            <Pressable
              style={styles.deliverBtn}
              onPress={() => handleMarkDelivered(item.orderId)}
            >
              {deliveringOrderId === item.orderId ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.deliverBtnText}>Received</Text>
              )}
            </Pressable>
          )}

          {item.orderStatus === "DELIVERED" && (
            <View style={styles.deliveredActions}>
              <View style={styles.deliveredCheck}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.completedText}>Completed</Text>
              </View>

              <Pressable
                style={styles.reviewBtn}
                onPress={() => {
                  setSelectedOrder(item);
                  setReviewModalVisible(true);
                }}
              >
                <Text style={styles.reviewBtnText}>Review Order</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F2A20C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.title}>Your Orders</Text>
        <Text style={styles.subtitle}>{orders.length} total orders found</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[styles.chip, activeFilter === filter && styles.activeChip]}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === filter && styles.activeChipText,
              ]}
            >
              {filter === "All"
                ? "All"
                : STATUS_CONFIG[filter]?.label || filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.orderId.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="bag-outline" size={50} color="#94A3B8" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />

      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reviewModal}>
            <Text style={styles.modalTitle}>Rate Your Order</Text>

            {renderStars()}

            <TextInput
              placeholder="Write your review..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              style={styles.reviewInput}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={closeReviewModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.submitBtn} onPress={handleSubmitReview}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageHeader: { padding: 20, paddingTop: 30 },
  title: { fontSize: 26, fontWeight: "900", color: "#0F172A" },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },

  filterBar: { height: 50, paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  activeChip: { backgroundColor: "#0F172A" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  activeChipText: { color: "#FFF" },

  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },

  orderCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  orderIdText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },

  paymentTag: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "800",
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  productsSection: { marginTop: 15, gap: 8 },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  productName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 15,
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  feeText: { fontSize: 11, color: "#94A3B8" },
  totalLabel: { fontSize: 10, color: "#64748B", fontWeight: "700" },
  finalPrice: { fontSize: 22, fontWeight: "900", color: "#0F172A" },

  deliverBtn: {
    backgroundColor: "#F2A20C",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  deliverBtnText: {
    color: "#000",
    fontWeight: "800",
  },

  deliveredActions: {
    alignItems: "flex-end",
    gap: 8,
  },

  deliveredCheck: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  completedText: {
    color: "#10B981",
    fontWeight: "700",
  },

  reviewBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  reviewBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  reviewModal: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  reviewInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 14,
    textAlignVertical: "top",
    marginBottom: 20,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelBtn: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  cancelBtnText: {
    color: "#334155",
    fontWeight: "700",
  },

  submitBtn: {
    backgroundColor: "#F2A20C",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  submitBtnText: {
    color: "#000",
    fontWeight: "800",
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 60,
  },

  emptyText: {
    marginTop: 10,
    color: "#64748B",
    fontWeight: "600",
  },
});
