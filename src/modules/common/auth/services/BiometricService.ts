import ReactNativeBiometrics from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Types ──────────────────────────────────────────────────────────────────

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | 'none';

export type BiometricStatus = {
  available: boolean;
  biometryType: BiometricType;
};

export type BiometricAuthResult = {
  success: boolean;
  error: 'cancelled' | 'lockout' | 'unavailable' | 'failed' | null;
};

// ─── Storage keys ────────────────────────────────────────────────────────────

const KEY_ENABLED = '@rp_biometric_enabled';
const KEY_EMAIL   = '@rp_biometric_email';

// ─── Native biometrics instance ──────────────────────────────────────────────
// allowDeviceCredentials: true on Android means PIN/pattern is a valid fallback.

const rnb = new ReactNativeBiometrics({
  allowDeviceCredentials: Platform.OS === 'android',
});

// ─── Service ─────────────────────────────────────────────────────────────────

export const BiometricService = {
  /** Check whether any biometric sensor is enrolled and available. */
  async getStatus(): Promise<BiometricStatus> {
    try {
      const { available, biometryType } = await rnb.isSensorAvailable();
      return {
        available: available && !!biometryType,
        biometryType: (biometryType as BiometricType) ?? 'none',
      };
    } catch {
      return { available: false, biometryType: 'none' };
    }
  },

  /** Show the native biometric prompt. Returns a typed result — never throws. */
  async authenticate(reason = 'Confirm your identity to continue'): Promise<BiometricAuthResult> {
    try {
      const { success, error } = await rnb.simplePrompt({
        promptMessage: reason,
        cancelButtonText: 'Cancel',
      });

      if (success) return { success: true, error: null };

      const msg = (error ?? '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('user')) {
        return { success: false, error: 'cancelled' };
      }
      if (msg.includes('lockout')) {
        return { success: false, error: 'lockout' };
      }
      return { success: false, error: 'failed' };
    } catch (e: any) {
      const msg = String(e?.message ?? '').toLowerCase();
      if (msg.includes('cancel')) return { success: false, error: 'cancelled' };
      if (msg.includes('lockout')) return { success: false, error: 'lockout' };
      if (msg.includes('unavailable') || msg.includes('not enrolled')) {
        return { success: false, error: 'unavailable' };
      }
      return { success: false, error: 'failed' };
    }
  },

  // ─── Persistence helpers ──────────────────────────────────────────────────

  async isEnabled(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(KEY_ENABLED)) === 'true';
    } catch {
      return false;
    }
  },

  async setEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_ENABLED, enabled ? 'true' : 'false');
    } catch {}
  },

  async getStoredEmail(): Promise<string | null> {
    try {
      return AsyncStorage.getItem(KEY_EMAIL);
    } catch {
      return null;
    }
  },

  async setStoredEmail(email: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY_EMAIL, email);
    } catch {}
  },

  /** Call on logout to wipe local biometric preference. */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([KEY_ENABLED, KEY_EMAIL]);
    } catch {}
  },
};
