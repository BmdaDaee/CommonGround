import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { commonGroundTheme } from "../theme/commonGroundTheme";
import { deeplyUsTheme } from "../theme/deeplyUsTheme";

export type Mode = "commonground" | "deeplyus";

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const isCG = mode === "commonground";
  const cg = commonGroundTheme.toggles;
  const du = deeplyUsTheme.toggles;

  const border = isCG ? cg.border : du.border;
  const bg = isCG ? cg.bgDefault : du.bgDefault;
  const pill = isCG ? cg.bgActive : du.bgActive;

  return (
    <View style={[styles.wrap, { borderColor: border, backgroundColor: bg }]}>
      <View style={[styles.pill, { left: isCG ? 2 : "50%", backgroundColor: pill }]} />
      <Pressable style={styles.btn} onPress={() => onChange("commonground")}>
        <Text style={[styles.txt, { color: isCG ? cg.textActive : cg.textDefault }]}>CommonGround</Text>
      </Pressable>

      <View style={[styles.dot, { backgroundColor: isCG ? "#FFDF7B" : "#E4C95D" }]} />

      <Pressable style={styles.btn} onPress={() => onChange("deeplyus")}>
        <Text style={[styles.txt, { color: !isCG ? du.textActive : du.textDefault }]}>DeeplyUs</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    padding: 2,
    borderWidth: 2,
    position: "relative",
    overflow: "hidden"
  },
  pill: {
    position: "absolute",
    top: 2,
    width: "50%",
    height: "100%",
    borderRadius: 999
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1
  },
  txt: {
    fontSize: 13,
    fontWeight: "700"
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginHorizontal: 4,
    zIndex: 1
  }
});
