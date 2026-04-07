import { categoryApi } from "@/axios/axiosInstance"; // Assuming this is your base axios instance
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ProductCard from "../../Component/productCard";

export default function ProductsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const params = useLocalSearchParams();

  // Get subCategoryName from URL params
  const activeCategory = (params.subCategoryName as string) || "";

  // --- STATES ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  const [brands, setBrands] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // --- API CALL (Unified Fetch using Axios) ---
  const fetchProducts = useCallback(
    async (
      vBrand?: string,
      vFuel?: string,
      vYear?: string,
      vModel?: string,
    ) => {
      setFiltering(true);
      try {
        let response;

        if (vBrand && vFuel && vYear && vModel) {
          // Vehicle Specific Filter
          response = await categoryApi.get("/compatibility/filter/products", {
            params: {
              brand: vBrand,
              fuelType: vFuel,
              year: vYear,
              model: vModel,
              // subCategoryName: activeCategory // Uncomment if backend needs both
            },
          });
        } else {
          // Initial Category Load
          response = await categoryApi.get("/products", {
            params: {
              subCategoryName: activeCategory,
              page: 0,
              size: 20,
            },
          });
        }

        const data = response.data;
        const finalData = data.content || (Array.isArray(data) ? data : []);
        setProducts(finalData);
      } catch (err) {
        console.error("Product fetch error:", err);
      } finally {
        setFiltering(false);
        setLoading(false);
      }
    },
    [activeCategory],
  );

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Fetch Brands for dropdown using Axios
        const brandRes = await categoryApi.get("/vehicles/brands");
        const brandData = brandRes.data;
        setBrands(brandData?.brands || brandData || []);

        await fetchProducts();
      } catch (e) {
        console.error("Initial load error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (activeCategory) loadInitialData();
  }, [activeCategory, fetchProducts]);

  // --- HANDLERS (Refactored to Axios) ---
  const handleBrandSelect = async (brand: string) => {
    setSelectedBrand(brand);
    setSelectedFuel("");
    setSelectedYear("");
    setSelectedModel("");
    setFuelTypes([]);
    setYears([]);
    setModels([]);

    try {
      const res = await categoryApi.get("/compatibility/filter/fuel-types", {
        params: { brand },
      });
      setFuelTypes(res.data?.fuelTypes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFuelSelect = async (fuel: string) => {
    setSelectedFuel(fuel);
    setSelectedYear("");
    setSelectedModel("");
    setYears([]);
    setModels([]);

    try {
      const res = await categoryApi.get("/compatibility/filter/years", {
        params: { brand: selectedBrand, fuelType: fuel },
      });
      setYears(res.data?.years || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleYearSelect = async (year: number) => {
    setSelectedYear(year.toString());
    setSelectedModel("");
    setModels([]);

    try {
      const res = await categoryApi.get("/compatibility/filter/models", {
        params: { brand: selectedBrand, fuelType: selectedFuel, year },
      });
      setModels(res.data?.models || []);
    } catch (e) {
      console.error(e);
    }
  };
  const numCols = isDesktop ? 3 : 2;
  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    fetchProducts(selectedBrand, selectedFuel, selectedYear, model);
  };

  const handleReset = () => {
    setSelectedBrand("");
    setSelectedFuel("");
    setSelectedYear("");
    setSelectedModel("");
    setFuelTypes([]);
    setYears([]);
    setModels([]);
    fetchProducts();
  };

  // const handleViewProduct = (product: any) => {
  //   router.push({
  //     pathname: "/(shop)/productDetails",
  //     params: { id: product.id },
  //   });
  // };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.subTitle}>Browsing</Text>
          <Text style={styles.title}>{activeCategory.toUpperCase()}</Text>
        </View>
      </View>

      <View
        style={[styles.mainLayout, !isDesktop && { flexDirection: "column" }]}
      >
        <View style={[styles.sidebar, !isDesktop && styles.mobileSidebar]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.filterTitle}>Vehicle Filter</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal={!isDesktop}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: isDesktop ? 20 : 0 }}
          >
            <View
              style={{ flexDirection: !isDesktop ? "row" : "column", gap: 15 }}
            >
              <FilterStep
                title="1. Brand"
                options={brands}
                selected={selectedBrand}
                onSelect={handleBrandSelect}
                enabled
              />
              <FilterStep
                title="2. Fuel"
                options={fuelTypes}
                selected={selectedFuel}
                onSelect={handleFuelSelect}
                enabled={!!selectedBrand}
              />
              <FilterStep
                title="3. Year"
                options={years}
                selected={selectedYear}
                onSelect={handleYearSelect}
                enabled={!!selectedFuel}
              />
              <FilterStep
                title="4. Model"
                options={models}
                selected={selectedModel}
                onSelect={handleModelSelect}
                enabled={!!selectedYear}
              />
            </View>
          </ScrollView>
        </View>

        <View style={styles.content}>
          <FlatList
            data={products}
            key={`columns-${numCols}`}
            keyExtractor={(item) => item.id?.toString()}
            numColumns={isDesktop ? 3 : 2}
            renderItem={({ item }) => (
              <Animated.View
                entering={FadeIn}
                style={{ width: isDesktop ? "33.3%" : "50%", padding: 5 }}
              >
                <ProductCard
                  product={{
                    ...item,
                    image: item.photoUrl || "",
                    category:
                      item.categoryName || item.subCategoryName || "General",
                    status: item.stock > 0 ? "Active" : "Out of Stock",
                    price: item.price
                      ? `₹${parseFloat(item.price).toFixed(2)}`
                      : "N/A",
                  }}
                  onToggleWishlist={() =>
                    console.log("Wishlist toggle", item.id)
                  }
                  // onView={() => handleViewProduct(item)}
                  onView={() => console.log("view toggle", item.id)}
                />
              </Animated.View>
            )}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text>No products found for this selection.</Text>
                </View>
              ) : null
            }
          />

          {(loading || filtering) && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#F2A20C" />
              <Text style={{ marginTop: 10, fontWeight: "600" }}>
                Updating Catalog...
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const FilterStep = ({ title, options, selected, onSelect, enabled }: any) => (
  <View style={[styles.filterGroup, { opacity: enabled ? 1 : 0.4 }]}>
    <Text style={styles.stepTitle}>{title}</Text>
    <View style={styles.chipContainer}>
      {options?.length > 0 ? (
        options.map((opt: any) => (
          <TouchableOpacity
            key={opt.toString()}
            disabled={!enabled}
            // onSelect={() => onSelect(opt)}
            onPress={() => onSelect(opt)}
            style={[
              styles.chip,
              selected === opt.toString() && styles.activeChip,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selected === opt.toString() && styles.activeChipText,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.helperText}>
          {enabled ? "Loading..." : "Select previous"}
        </Text>
      )}
    </View>
  </View>
);

// Styles kept same as your provided code
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  backBtn: { padding: 5, marginRight: 10 },
  subTitle: { fontSize: 10, color: "#667", fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "900" },
  mainLayout: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 280,
    backgroundColor: "#FFF",
    padding: 15,
    borderRightWidth: 1,
    borderColor: "#EEE",
  },
  mobileSidebar: { width: "100%", borderRightWidth: 0, borderBottomWidth: 1 },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  filterTitle: { fontWeight: "800", color: "#334" },
  resetText: { color: "#F2A20C", fontWeight: "700" },
  content: { flex: 1, padding: 10 },
  filterGroup: { marginBottom: 20 },
  stepTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  activeChip: { backgroundColor: "#F2A20C" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  activeChipText: { color: "#FFF" },
  helperText: { fontSize: 11, color: "#94A3B8" },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 100 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
