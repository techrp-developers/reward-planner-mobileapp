import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type Props = {
  onPress?: () => void;
  label?: string;
  disabled?: boolean;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_SMALL = SCREEN_WIDTH < 360;
const IS_TABLET = SCREEN_WIDTH > 768;
const LABEL_SIZE = IS_TABLET ? 15 : IS_SMALL ? 11 : 12;
const ICON_SIZE = IS_TABLET ? 16 : IS_SMALL ? 12 : 13;

const AddToCartButton: React.FC<Props> = ({
  onPress,
  label = 'Add to Cart',
  disabled = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.9 : disabled ? 0.5 : 1 },
      ]}
    >
      <LinearGradient
        colors={['#8665FF', '#5B47A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <FontAwesome name="shopping-cart" size={ICON_SIZE} color="#fff" style={styles.icon} />
        <Text
          style={[styles.label, { fontSize: LABEL_SIZE }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // Pressable: shadow only, no overflow hidden
  pressable: {
    width: '100%',
    borderRadius: 7,
  },

  // Gradient container: fixed height so both platforms match
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 36, // fixed px — never use paddingVertical for height control
    borderRadius: 7,
    paddingHorizontal: 8,
  },

  icon: {
    marginRight: 6,
  },

  label: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default React.memo(AddToCartButton);