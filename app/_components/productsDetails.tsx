import { categoryApi } from "@/axios/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
  const isMobile = width < 768;
  const params = useLocalSearchParams();
  const categoryName = (params.categoryName as string) || "";
  const activeCategory = (params.subCategoryName as string) || "";
  // 🔹 FIX 1: Extract subCategoryId from route parameters
  const subCategoryId = (params.subCategoryId as string) || "";

  // Pagination State
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const loadInitialData = async () => {
    try {
      const brandRes = await categoryApi.get("/vehicles/brands");
      setBrands(brandRes.data?.brands || brandRes.data || []);
      await fetchProducts(0);
    } catch (e) {
      console.error("Initial load error:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [activeCategory, subCategoryId]), // Added subCategoryId to dependencies
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const fetchProducts = useCallback(
    async (
      pageNumber: number = 0,
      vBrand?: string,
      vFuel?: string,
      vYear?: string,
      vModel?: string,
    ) => {
      // If we are filtering from scratch (page 0), show full loader
      if (pageNumber === 0) {
        setFiltering(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let response;
        const brand = vBrand || selectedBrand;
        const fuel = vFuel || selectedFuel;
        const year = vYear || selectedYear;
        const model = vModel || selectedModel;

        if (brand && fuel && year && model) {
          // Compatibility Filter Endpoint
          response = await categoryApi.get("/compatibility/filter/products", {
            params: {
              brand,
              fuelType: fuel,
              year,
              model,
              page: pageNumber,
              size: 20,
            },
          });
        } else {
          // 🔹 FIX 2: Updated General Category Endpoint
          response = await categoryApi.get(
            `/products/subcategory/${subCategoryId}`,
            {
              params: {
                page: pageNumber,
                size: 20,
                sort: "createdAt,desc",
              },
            },
          );
        }

        const data = response.data;
        const newProducts =
          data.content || data.products || (Array.isArray(data) ? data : []);

        // Update products list: Append if not page 0, otherwise replace
        setProducts((prev) =>
          pageNumber === 0 ? newProducts : [...prev, ...newProducts],
        );

        // Set pagination flags (handling different backend response structures)
        setIsLastPage(data.last ?? newProducts.length < 20);
        setPage(pageNumber);
      } catch (err) {
        console.error("Product fetch error:", err);
      } finally {
        setFiltering(false);
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      activeCategory,
      subCategoryId,
      selectedBrand,
      selectedFuel,
      selectedYear,
      selectedModel,
    ],
  );

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const brandRes = await categoryApi.get("/vehicles/brands");
        setBrands(brandRes.data?.brands || brandRes.data || []);
        await fetchProducts(0);
      } catch (e) {
        console.error("Initial load error:", e);
      } finally {
        setLoading(false);
      }
    };

    if (activeCategory) loadInitialData();
  }, [activeCategory, subCategoryId]);

  const handleLoadMore = () => {
    if (!loadingMore && !isLastPage) {
      fetchProducts(page + 1);
    }
  };

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

  // Fuel, Year handlers...
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

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    fetchProducts(0, selectedBrand, selectedFuel, selectedYear, model);
  };

  const handleReset = () => {
    setSelectedBrand("");
    setSelectedFuel("");
    setSelectedYear("");
    setSelectedModel("");
    setFuelTypes([]);
    setYears([]);
    setModels([]);
    fetchProducts(0, "", "", "", "");
  };

  const numColumns = isDesktop ? 4 : isMobile ? 2 : 3;

  return (
    <View style={styles.container}>
      {/* Header logic remains same */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "../_components/CategoryDetails",params: {
                        categoryName:categoryName ,
                      },})}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} />
          </TouchableOpacity>
          <View>
            <Text style={styles.subTitle}>Browsing</Text>
            <Text style={styles.title}>{activeCategory.toUpperCase()}</Text>
          </View>
        </View>
        {!isDesktop && (
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterDrawer(true)}
          >
            <Ionicons name="options-outline" size={22} color="#F2A20C" />
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[styles.mainLayout, !isDesktop && { flexDirection: "column" }]}
      >
        {/* Sidebar Logic remains same */}
        {isDesktop && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.filterTitle}>Vehicle Filter</Text>
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        )}

        <View style={styles.content}>
          <FlatList
            data={products}
            key={numColumns}
            numColumns={numColumns}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#F2A20C"
                colors={["#F2A20C"]}
              />
            }
            renderItem={({ item }) => (
              <Animated.View
                entering={FadeIn}
                style={{ width: isDesktop ? "25%" : "50%", padding: 5 }}
              >
                <ProductCard
                  product={{
                    id: item.id.toString(),
                    name: item.name || "Unknown Product",

                    price:
                      item.price != null
                        ? `₹${item.price.toLocaleString()}`
                        : "Price N/A",
                    category: item.categoryName || "General",
                    image:
                      item.photoUrl ||
                      "https://via.placeholder.com/300x200.png?text=No+Image",
                    status:
                      item.stockQuantity > 10
                        ? "Active"
                        : item.stockQuantity > 0
                          ? "Low Stock"
                          : "Out of Stock",
                    stock: item.stockQuantity || 0,
                  }}
                  onAddToCart={() => {}}
                  onToggleWishlist={() => {}}
                  onView={() =>
                    router.push({
                      pathname: "/_components/ViewProductDetails",
                      params: { id: item.id },
                    })
                  }
                />
              </Animated.View>
            )}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color="#F2A20C"
                  style={{ marginVertical: 20 }}
                />
              ) : null
            }
            ListEmptyComponent={
              !loading && !filtering ? (
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
      {showFilterDrawer && !isDesktop && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowFilterDrawer(false)}
          />

          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Vehicle Filter</Text>

              <TouchableOpacity onPress={() => setShowFilterDrawer(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 15 }}>
              <View style={styles.sidebarHeader}>
                <Text style={styles.filterTitle}>Vehicle Filter</Text>

                <TouchableOpacity onPress={handleReset}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              </View>

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
                onSelect={(model: string) => {
                  handleModelSelect(model);
                  setShowFilterDrawer(false);
                }}
                enabled={!!selectedYear}
              />
            </ScrollView>
          </View>
        </View>
      )}
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
          {enabled ? "not found" : "Select previous"}
        </Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  filterTitle: { fontWeight: "800", color: "rgb(134, 134, 139)" },
  resetText: { color: "#F2A20C", fontWeight: "700" },
  content: { flex: 1, padding: 10 },
  filterGroup: { marginBottom: 20 },
  stepTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8a8e94",
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
  chipText: { fontSize: 13, color: "#5b6a7e", fontWeight: "600" },
  activeChipText: { color: "#FFF" },
  helperText: { fontSize: 11, color: "#9399a2" },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 100 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF7E6",
    justifyContent: "center",
    alignItems: "center",
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 999,
  },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    maxWidth: "85%",
    backgroundColor: "#1A1A1A",
  },

  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },

  drawerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
});
