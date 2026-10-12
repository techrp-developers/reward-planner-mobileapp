import AsyncStorage from "@react-native-async-storage/async-storage";

const loadSecureStore = () => {
  try {
    const SecureStore = require("expo-secure-store");

    if (
      SecureStore &&
      typeof SecureStore.getItemAsync === "function" &&
      typeof SecureStore.setItemAsync === "function" &&
      typeof SecureStore.deleteItemAsync === "function"
    ) {
      return SecureStore;
    }
  } catch {
    return null;
  }

  return null;
};

const secureStore = loadSecureStore();

export const secureSetItem = async (key: string, value: string) => {
  if (secureStore) {
    await secureStore.setItemAsync(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
};

export const secureGetItem = async (key: string) => {
  if (secureStore) {
    return secureStore.getItemAsync(key);
  }

  return AsyncStorage.getItem(key);
};

export const secureDeleteItem = async (key: string) => {
  if (secureStore) {
    await secureStore.deleteItemAsync(key);
    return;
  }

  await AsyncStorage.removeItem(key);
};
