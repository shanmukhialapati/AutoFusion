import { Edit2, MapPin, Plus, Trash2, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
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
      // Handle both array or single object response based on your logs
      setAddresses(
        Array.isArray(response.data) ? response.data : [response.data],
      );
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.fullName || !form.street || !form.pinCode) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    try {
      if (editingId) {
        // EDIT http://localhost:8080/api/addresses/{id}
        await axiosInstance.put(`/addresses/${editingId}`, form);
      } else {
        // POST http://localhost:8080/api/addresses
        await axiosInstance.post("/addresses", form);
      }
      setModalVisible(false);
      resetForm();
      fetchAddresses();
    } catch (error) {
      Alert.alert("Error", "Failed to save address");
    }
  };

  const handleDelete = (id: string) => {
    if (!id) {
      Alert.alert("Error", "Missing Address ID");
      return;
    }

    // Logic for Web
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to remove this address?",
      );
      if (confirmed) {
        executeDelete(id);
      }
    }
    // Logic for Android/iOS
    else {
      Alert.alert(
        "Delete Address",
        "Are you sure you want to remove this address?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => executeDelete(id),
          },
        ],
      );
    }
  };

  // Move the actual API call to a separate helper function
  const executeDelete = async (id: string) => {
    try {
      setLoading(true);

      const response = await axiosInstance.delete(`/addresses/${id}`);

      if (response.status === 200 || response.status === 204) {
        // Optimistic UI Update
        setAddresses((prev) => prev.filter((addr) => addr.id !== id));

        if (Platform.OS === "web") {
          alert("Address deleted successfully.");
        } else {
          Alert.alert("Success", "Address deleted successfully.");
        }
      }
    } catch (error: any) {
      console.error("DELETE FAILED:", error);
      const msg = error.response?.data?.message || "Server connection failed";

      if (Platform.OS === "web") {
        alert("Delete Error: " + msg);
      } else {
        Alert.alert("Delete Error", msg);
      }
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
          <Edit2 size={16} color="#AAA" />
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
          <Plus color="#1A1A1A" size={20} />
          <Text style={styles.addButtonText}>ADD NEW</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
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
          ListEmptyComponent={
            <Text style={styles.emptyText}>No addresses found.</Text>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "EDIT ADDRESS" : "NEW ADDRESS"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                placeholder="FULL NAME"
                placeholderTextColor="#666"
                style={styles.input}
                value={form.fullName}
                onChangeText={(t) => setForm({ ...form, fullName: t })}
              />
              <TextInput
                placeholder="PHONE NUMBER"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="phone-pad"
                value={form.phoneNumber}
                onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
              />
              <TextInput
                placeholder="STREET / HOUSE NO"
                placeholderTextColor="#666"
                style={styles.input}
                value={form.street}
                onChangeText={(t) => setForm({ ...form, street: t })}
              />
              <View style={styles.row}>
                <TextInput
                  placeholder="CITY"
                  placeholderTextColor="#666"
                  style={[styles.input, { flex: 1, marginRight: 10 }]}
                  value={form.city}
                  onChangeText={(t) => setForm({ ...form, city: t })}
                />
                <TextInput
                  placeholder="PIN CODE"
                  placeholderTextColor="#666"
                  style={[styles.input, { flex: 1 }]}
                  keyboardType="number-pad"
                  value={form.pinCode}
                  onChangeText={(t) => setForm({ ...form, pinCode: t })}
                />
              </View>
              <TextInput
                placeholder="STATE"
                placeholderTextColor="#666"
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
  container: { flex: 1, backgroundColor: "#1A1A1A", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    marginTop: 40,
  },
  title: { color: "#FFF", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#F2A20C",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: "center",
    gap: 5,
  },
  addButtonText: { color: "#1A1A1A", fontWeight: "800", fontSize: 12 },
  listContent: { paddingBottom: 20 },
  addressCard: {
    backgroundColor: "#262626",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  nameText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  defaultBadge: {
    color: "#F2A20C",
    fontSize: 10,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "#F2A20C",
    paddingHorizontal: 5,
    borderRadius: 2,
  },
  addressText: { color: "#AAA", fontSize: 14, marginBottom: 2 },
  actionRow: {
    flexDirection: "row",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 20,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { color: "#AAA", fontSize: 12, fontWeight: "700" },
  emptyText: { color: "#666", textAlign: "center", marginTop: 50 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { color: "#F2A20C", fontSize: 18, fontWeight: "900" },
  input: {
    backgroundColor: "#262626",
    color: "#FFF",
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#444",
  },
  saveButton: {
    backgroundColor: "#F2A20C",
    padding: 18,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "#1A1A1A", fontWeight: "900", letterSpacing: 1 },
});

export default AddressPage;
