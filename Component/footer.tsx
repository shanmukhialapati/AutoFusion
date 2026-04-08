import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

interface InfoContent {
  title: string;
  content: string;
}

const Footer = () => {
  const [selectedInfo, setSelectedInfo] = useState<InfoContent | null>(null);
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(20)).current; // Start slightly offset
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const infoData: Record<string, InfoContent> = {
    "About Us": {
      title: "OUR HERITAGE",
      content:
        "AUTOFUSION started in a small garage with one goal: precision performance parts.",
    },
    Support: {
      title: "24/7 TECHNICAL HELP",
      content:
        "Our master mechanics are available via live chat to help with your build.",
    },
    "Contact Us": {
      title: "GET IN TOUCH",
      content: "Email: support@autofusion.com | Phone: 1-800-AUTO-FUSE",
    },
  };

  useEffect(() => {
    if (selectedInfo) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedInfo]);

  return (
    <View style={styles.container}>
      {selectedInfo && (
        <Animated.View
          style={[
            styles.floatingInfo,
            { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.infoInner}>
            <View style={styles.infoTextSide}>
              <Text style={styles.infoTitle}>{selectedInfo.title}</Text>
              <Text style={styles.infoContentText}>{selectedInfo.content}</Text>
            </View>
            <Pressable
              onPress={() => setSelectedInfo(null)}
              style={styles.infoCloseBtn}
            >
              <X size={18} color="#000" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      <View style={styles.contentPadding}>
        <View style={styles.mainGrid}>
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>AUTOFUSION</Text>
            <Text style={styles.brandTagline}>
              ENGINEERING THE FUTURE OF PERFORMANCE.
            </Text>
            <View style={styles.socialRow}>
              {["facebook", "instagram", "x-twitter"].map((icon, i) => (
                <Pressable key={i} style={styles.socialCircle}>
                  {icon === "x-twitter" ? (
                    <FontAwesome6 name={icon} size={16} color="#AAA" />
                  ) : (
                    <FontAwesome name={icon as any} size={18} color="#AAA" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.linksContainer}>
            <View style={styles.linkCol}>
              <Text style={styles.header}>SHOP</Text>
              {["Home", "Cart", "Wishlist", "Address"].map((label) => (
                <Pressable
                  key={label}
                  style={styles.linkPress}
                  onPress={() => {
                    if (label === "Home") {
                      router.push("/");
                    } else if (label === "Address") {
                      router.push("/address");
                    } else {
                      router.push(`/${label.toLowerCase()}` as any);
                    }
                  }}
                >
                  <Text style={styles.linkText}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.linkCol}>
              <Text style={styles.header}>COMPANY</Text>
              {["About Us", "Support", "Contact Us"].map((label) => (
                <Pressable
                  key={label}
                  style={styles.linkPress}
                  onPress={() => setSelectedInfo(infoData[label])}
                >
                  <Text style={styles.linkText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.downloadBar}>
        <Text style={styles.downloadHeading}>SYNC WITH YOUR GARAGE</Text>
        <View style={styles.btnGroup}>
          <Pressable
            style={styles.storeBtn}
            onPress={() => Linking.openURL("https://apple.com")}
          >
            <FontAwesome name="apple" size={20} color="black" />
            <View style={styles.btnLabel}>
              <Text style={styles.btnTopText}>App Store</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.storeBtn, { backgroundColor: "#F2A20C" }]}
            onPress={() => Linking.openURL("https://google.com")}
          >
            <FontAwesome name="play" size={16} color="black" />
            <View style={styles.btnLabel}>
              <Text style={styles.btnTopText}>Google Play</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomStatus}>
        <Text style={styles.copyText}>© 2026 AUTOFUSION INDUSTRIES</Text>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>SYSTEMS ONLINE</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderColor: "#222",
    position: "relative",
  },
  floatingInfo: {
    position: "absolute",
    bottom: "100%",
    left: isMobile ? 10 : 24,
    right: isMobile ? 10 : 24,
    marginBottom: 15,
    zIndex: 999,
    backgroundColor: "#f6c873",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
      android: { elevation: 20 },
      web: { boxShadow: "0 -10px 25px rgba(0, 0, 0, 0.21)" },
    }),
  },
  infoInner: { flexDirection: "row", padding: 18, alignItems: "center" },
  infoTextSide: { flex: 1, paddingRight: 10 },
  infoTitle: {
    color: "#000",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoContentText: {
    color: "#1A1A1A",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },
  infoCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  contentPadding: { paddingHorizontal: 24, paddingVertical: 50 },
  mainGrid: {
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
  },
  brandSection: { maxWidth: 300, marginBottom: 40 },
  brandName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandTagline: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 8,
    letterSpacing: 1,
  },
  linksContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: isMobile ? "space-between" : "space-evenly",
  },
  linkCol: { minWidth: 120 },
  header: {
    color: "#F2A20C",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  linkPress: { marginBottom: 14 },
  linkText: { color: "#AAA", fontSize: 13, fontWeight: "600" },
  socialRow: { flexDirection: "row", gap: 12, marginTop: 25 },
  socialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  downloadBar: {
    backgroundColor: "#000",
    paddingVertical: 30,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#1A1A1A",
  },
  downloadHeading: {
    color: "#818181",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 20,
  },
  btnGroup: { flexDirection: "row", gap: 12 },
  storeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 140,
    justifyContent: "center",
  },
  btnLabel: { marginLeft: 8 },
  btnTopText: { fontSize: 13, fontWeight: "900", color: "#000" },
  bottomStatus: {
    height: 50,
    backgroundColor: "#1f1d1dcf",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: "#111",
  },
  copyText: { color: "#9a9999", fontSize: 10, fontWeight: "700" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgb(8, 221, 86)",
  },
  badgeText: { color: "#918e8e", fontSize: 9, fontWeight: "900" },
});

export default Footer;
