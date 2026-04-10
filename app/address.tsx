import { Edit2, MapPin, Plus, Trash2, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import axiosInstance from "../axios/axiosInstance";

interface Address {
  id?: string;
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  default: boolean;
}

const AddressPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<Address>({
    fullName: "",
    phoneNumber: "",
    street: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    default: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axiosInstance.get("/addresses");
      setAddresses(
        Array.isArray(response.data) ? response.data : [response.data],
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAddresses();
  }, []);

  const validateForm = () => {
    const { fullName, phoneNumber, street, city, state, pinCode } = form;

    if (!fullName || !phoneNumber || !street || !city || !state || !pinCode) {
      showFeedback("Error", "Please fill in all required fields.");
      return false;
    }

    if (phoneNumber.length !== 10) {
      showFeedback("Error", "Phone number must be exactly 10 digits.");
      return false;
    }

    if (pinCode.length !== 6) {
      showFeedback("Error", "Pin Code must be exactly 6 digits.");
      return false;
    }

    return true;
  };

  const showFeedback = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (editingId) {
        await axiosInstance.put(`/addresses/${editingId}`, form);
      } else {
        await axiosInstance.post("/addresses", form);
      }
      setModalVisible(false);
      resetForm();
      fetchAddresses();
      showFeedback("Success", "Address saved successfully.");
    } catch (error: any) {
      // 🔹 FIX: Extract and show the backend message
      const backendMsg = error.response?.data?.message || "Failed to save address.";
      showFeedback("Error", backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!id) return;

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this address?")) {
        executeDelete(id);
      }
    } else {
      Alert.alert("Delete Address", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => executeDelete(id),
        },
      ]);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      showFeedback("Success", "Address deleted.");
    } catch (error: any) {
      // 🔹 FIX: Extract and show the backend message
      const backendMsg = error.response?.data?.message || "Failed to delete address.";
      showFeedback("Error", backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id || null);
    setForm(address);
    setModalVisible(true);
  };

  const resetForm = () => {
    setForm({
      fullName: "",
      phoneNumber: "",
      street: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      default: false,
    });
    setEditingId(null);
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <MapPin size={18} color="#F2A20C" />
          <Text style={styles.nameText}>{item.fullName}</Text>
        </View>
        {item.default && <Text style={styles.defaultBadge}>DEFAULT</Text>}
      </View>
      <Text style={styles.addressText}>
        {item.street}, {item.city}
      </Text>
      <Text style={styles.addressText}>
        {item.state} - {item.pinCode}
      </Text>
      <Text style={styles.addressText}>Phone: {item.phoneNumber}</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => openEdit(item)}
          style={styles.actionBtn}
        >
          <Edit2 size={16} color="#888" />
          <Text style={styles.actionText}>EDIT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id!)}
          style={styles.actionBtn}
        >
          <Trash2 size={16} color="#FF453A" />
          <Text style={[styles.actionText, { color: "#FF453A" }]}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MY ADDRESSES</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus color="#F2A20C" size={18} />
          <Text style={styles.addButtonText}>ADD NEW</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          color="#F2A20C"
          size="large"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id!}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F2A20C"
              colors={["#F2A20C"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No addresses found.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "EDIT ADDRESS" : "NEW ADDRESS"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#1A1A1A" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="FULL NAME"
                placeholderTextColor="#888"
                style={styles.input}
                value={form.fullName}
                onChangeText={(t) => setForm({ ...form, fullName: t })}
              />
              <TextInput
                placeholder="PHONE NUMBER"
                placeholderTextColor="#888"
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
                value={form.phoneNumber}
                onChangeText={(t) =>
                  setForm({ ...form, phoneNumber: t.replace(/[^0-9]/g, "") })
                }
              />
              <TextInput
                placeholder="STREET / HOUSE NO"
                placeholderTextColor="#888"
                style={styles.input}
                value={form.street}
                onChangeText={(t) => setForm({ ...form, street: t })}
              />
              <View style={styles.row}>
                <TextInput
                  placeholder="CITY"
                  placeholderTextColor="#888"
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  value={form.city}
                  onChangeText={(t) => setForm({ ...form, city: t })}
                />
                <TextInput
                  placeholder="PIN"
                  placeholderTextColor="#888"
                  style={[styles.input, { flex: 1 }]}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={form.pinCode}
                  onChangeText={(t) =>
                    setForm({ ...form, pinCode: t.replace(/[^0-9]/g, "") })
                  }
                />
              </View>
              <TextInput
                placeholder="STATE"
                placeholderTextColor="#888"
                style={styles.input}
                value={form.state}
                onChangeText={(t) => setForm({ ...form, state: t })}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>SAVE ADDRESS</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    marginTop: Platform.OS === "ios" ? 50 : 30, // Adjusted slightly for light theme spacing
  },
  title: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    color: "#F2A20C",
    fontWeight: "800",
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    color: "#1A1A1A",
    fontWeight: "800",
    fontSize: 16,
  },
  defaultBadge: {
    color: "#F2A20C",
    fontSize: 10,
    fontWeight: "900",
    borderWidth: 1,
    borderColor: "rgba(242, 162, 12, 0.3)",
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
  },
  addressText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // Lighter overlay
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "#F8F9FA",
    color: "#1A1A1A",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#F2A20C",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#1A1A1A",
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default AddressPage;