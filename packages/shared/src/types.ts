import type {
  CHAT_MODES,
  RELATIONSHIP_STAGES,
  SUBSCRIPTION_TIERS,
} from "./constants.js";

export type ChatMode = (typeof CHAT_MODES)[number];
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];
export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[number];

export type MessageRole = "user" | "assistant" | "system";

export interface CharacterProfile {
  id: string;
  userId: string;
  name: string;
  gender?: string;
  personality: string;
  backstory: string;
  speakingStyle: string;
  locale: string;
  createdAt: string;
}

export interface UserEconomy {
  stamina: number;
  staminaUpdatedAt: string;
  coins: number;
  subscriptionTier: SubscriptionTier;
}

export interface RelationshipState {
  characterId: string;
  affection: number;
  stage: RelationshipStage;
  updatedAt: string;
}
