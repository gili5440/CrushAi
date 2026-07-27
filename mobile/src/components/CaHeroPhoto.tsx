import MaskedView from "@react-native-masked-view/masked-view";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

const WIDTH = 280;
const HEIGHT = 206;

// Matches .ca-hero-photo's radial mask: opaque to 55% radius, fades out by 85%.
export function CaHeroPhoto() {
  return (
    <View style={styles.wrap}>
      <MaskedView
        style={styles.wrap}
        maskElement={
          <Svg width={WIDTH} height={HEIGHT}>
            <Defs>
              <RadialGradient id="heroMask" cx="50%" cy="50%" r="55%">
                <Stop offset="0%" stopColor="#fff" stopOpacity={1} />
                <Stop offset="65%" stopColor="#fff" stopOpacity={1} />
                <Stop offset="100%" stopColor="#fff" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="url(#heroMask)" />
          </Svg>
        }
      >
        <Image
          source={require("../../assets/hero-photo.jpg")}
          style={styles.image}
          resizeMode="cover"
        />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: WIDTH, height: HEIGHT, alignSelf: "center", marginBottom: 22 },
  image: { width: WIDTH, height: HEIGHT },
});
