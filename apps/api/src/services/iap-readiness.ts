import {
  isAppStoreJwsDecodeOnlyEnabled,
  isAppStoreJwsVerifyEnabled,
} from "./apple-app-store-server.js";
import { isGooglePlayApiConfigured } from "./google-play-verify.js";
import { isStoreVerificationConfigured } from "./iap-store.js";

export type IapReadiness = {
  strict: boolean;
  mockDevAllowed: boolean;
  /** True when IAP_STRICT and real iOS + Play API verification are configured. */
  productionReady: boolean;
  /** IAP_STRICT + Play API in production (Android-only gate). */
  androidProductionReady: boolean;
  /** IAP_STRICT + Apple store credentials in production. */
  iosProductionReady: boolean;
  ios: {
    configured: boolean;
    legacyReceipt: boolean;
    appStoreJws: boolean;
    appStoreJwsDecodeOnly: boolean;
  };
  android: {
    /** True when Play Developer API credentials are complete. */
    configured: boolean;
    playApi: boolean;
    packageName: boolean;
    stub: boolean;
  };
};

export function getIapReadiness(): IapReadiness {
  const legacyReceipt = Boolean(process.env.APPLE_IAP_SHARED_SECRET?.trim());
  const appStoreJws = isAppStoreJwsVerifyEnabled();
  const appStoreJwsDecodeOnly = isAppStoreJwsDecodeOnlyEnabled();
  const playApi = isGooglePlayApiConfigured();
  const packageName = Boolean(process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim());
  const stub =
    process.env.GOOGLE_PLAY_STUB === "1" ||
    process.env.NODE_ENV !== "production";

  const strict = process.env.IAP_STRICT === "true";
  const iosConfigured = isStoreVerificationConfigured("ios");
  const inProduction = process.env.NODE_ENV === "production";
  const androidProductionReady = strict && playApi && inProduction;
  const iosProductionReady = strict && iosConfigured && inProduction;
  const productionReady = androidProductionReady && iosProductionReady;

  return {
    strict,
    productionReady,
    androidProductionReady,
    iosProductionReady,
    mockDevAllowed:
      process.env.MOCK_IAP === "1" ||
      process.env.NODE_ENV !== "production",
    ios: {
      configured: isStoreVerificationConfigured("ios"),
      legacyReceipt,
      appStoreJws,
      appStoreJwsDecodeOnly,
    },
    android: {
      configured: playApi,
      playApi,
      packageName,
      stub,
    },
  };
}
