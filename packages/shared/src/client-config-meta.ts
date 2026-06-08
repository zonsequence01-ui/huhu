import { buildOfferwallClientMeta } from "./offerwall-meta.js";
import { getEconomyMeta } from "./economy-meta.js";
import { getSupportResources } from "./support-resources.js";
import { getStoreUrls, type StoreUrls } from "./store-urls.js";

export type ClientConfigMeta = {
  economy: ReturnType<typeof getEconomyMeta>;
  offerwall: ReturnType<typeof buildOfferwallClientMeta>;
  supportResources: ReturnType<typeof getSupportResources>;
  storeUrls: StoreUrls;
};

export function buildClientConfigMeta(
  locale: string | undefined,
  options: {
    verificationRequired: boolean;
    webhookIpRestricted: boolean;
  },
): ClientConfigMeta {
  return {
    economy: getEconomyMeta(),
    offerwall: buildOfferwallClientMeta(options),
    supportResources: getSupportResources(locale),
    storeUrls: getStoreUrls(),
  };
}
