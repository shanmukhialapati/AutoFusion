import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import ProductCard from "../../Component/productCard";

type Product = {
  id: string;
  name: string;
  price: string;
  category: string;
  status: "Active" | "Low Stock" | "Out of Stock";
  stock: number;
  image: string | string[];
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Alternator Pulley - Mahindra",
    price: "₹561",
    category: "Engine",
    status: "Active",
    stock: 15,
    image: "https://images.unsplash.com/photo-1621905252472-e8c0b92d5e7b",
  },
  {
    id: "2",
    name: "Precision Spark Plug Set",
    price: "₹1,705",
    category: "Ignition",
    status: "Low Stock",
    stock: 2,
    image: "https://images.unsplash.com/photo-1581092335878-0c4b1c1f9c2d",
  },
  {
    id: "3",
    name: "Turbo Charger Assembly",
    price: "₹14,915",
    category: "Engine",
    status: "Out of Stock",
    stock: 0,
    image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c",
  },
  {
    id: "4",
    name: "Bando Fan Belt",
    price: "₹850",
    category: "Engine",
    status: "Active",
    stock: 10,
    image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c",
  },
];

const FILTERS = {
  brands: ["MAHINDRA", "VALEO", "BANDO", "BMW"],
  price: ["Under ₹1000", "₹1000 - ₹5000", "Above ₹5000"],
};

export default function ProductsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { subCategoryName, parentCategory } = useLocalSearchParams();

  // --- Filter State ---
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);

  // --- Dynamic Filtering Logic ---
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const numericPrice = parseInt(product.price.replace(/[₹,]/g, ""));

      // Filter by Brand (Case insensitive match for safety)
      const brandMatch =
        selectedBrands.length === 0 ||
        selectedBrands.some((brand) =>
          product.name.toUpperCase().includes(brand.toUpperCase()),
        );

      // Filter by Price Range
      const priceMatch =
        selectedPrices.length === 0 ||
        selectedPrices.some((range) => {
          if (range === "Under ₹1000") return numericPrice < 1000;
          if (range === "₹1000 - ₹5000")
            return numericPrice >= 1000 && numericPrice <= 5000;
          if (range === "Above ₹5000") return numericPrice > 5000;
          return true;
        });

      return brandMatch && priceMatch;
    });
  }, [selectedBrands, selectedPrices]);

  const toggleFilter = (item: string, type: "brand" | "price") => {
    if (type === "brand") {
      setSelectedBrands((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
      );
    } else {
      setSelectedPrices((prev) =>
        prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
      );
    }
  };

  const handleReset = () => {
    setSelectedBrands([]);
    setSelectedPrices([]);
  };

  const numColumns = isDesktop ? 3 : 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconCircle}
        >
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.parentText}>
            {parentCategory || "Collection"}
          </Text>
          <Text style={styles.title}>{subCategoryName || "All Parts"}</Text>
        </View>
      </View>

      <View style={styles.mainLayout}>
        {/* SIDEBAR FILTERS */}
        {isDesktop && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.filtersHeading}>Filters</Text>
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.resetText}>RESET</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FilterGroup
                title="Brand"
                options={FILTERS.brands}
                selected={selectedBrands}
                onSelect={(val: string) => toggleFilter(val, "brand")}
              />
              <FilterGroup
                title="Price Range"
                options={FILTERS.price}
                selected={selectedPrices}
                onSelect={(val: string) => toggleFilter(val, "price")}
              />
            </ScrollView>
          </View>
        )}

        {/* PRODUCT GRID SECTION */}
        <View style={styles.content}>
          <View style={styles.topControls}>
            <Text style={styles.resultsCount}>
              {filteredProducts.length} items found
            </Text>
            {!isDesktop && (
              <TouchableOpacity style={styles.mobileFilterBtn}>
                <Ionicons name="filter" size={16} color="#333" />
                <Text style={styles.mobileFilterText}>
                  Filters ({selectedBrands.length + selectedPrices.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredProducts}
            key={isDesktop ? "desktop" : "mobile"}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[styles.cardWrapper, isDesktop && { width: "33.3%" }]}
              >
                <ProductCard
                  product={item}
                  onAddToCart={(p) => console.log(p.name)}
                  onToggleWishlist={(p) => console.log(p.name)}
                  onView={(p) => console.log(p.name)}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>
                  No products match your filters.
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </View>
    </View>
  );
}

const FilterGroup = ({ title, options, selected, onSelect }: any) => (
  <View style={styles.filterGroup}>
    <Text style={styles.filterGroupTitle}>{title}</Text>
    {options.map((opt: string) => {
      const isSelected = selected.includes(opt);
      return (
        <TouchableOpacity
          key={opt}
          style={styles.filterRow}
          onPress={() => onSelect(opt)}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text
            style={[styles.filterText, isSelected && styles.filterTextActive]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FBFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  parentText: {
    fontSize: 10,
    color: "#F2A20C",
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  mainLayout: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 300,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#F1F5F9",
    padding: 24,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  filtersHeading: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  resetText: { color: "#F2A20C", fontWeight: "700", fontSize: 12 },
  filterGroup: { marginBottom: 30 },
  filterGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: { backgroundColor: "#F2A20C", borderColor: "#F2A20C" },
  filterText: { fontSize: 15, color: "#1E293B", fontWeight: "500" },
  filterTextActive: { fontWeight: "700", color: "#000" },
  content: { flex: 1, paddingHorizontal: 16 },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  resultsCount: { fontSize: 14, color: "#94A3B8", fontWeight: "600" },
  mobileFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mobileFilterText: { marginLeft: 6, fontWeight: "700", fontSize: 13 },
  cardWrapper: { padding: 8 },
  listContainer: { paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
});
