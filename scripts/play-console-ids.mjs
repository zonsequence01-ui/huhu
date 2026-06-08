/** Google Play Console IDs for com.ctrlz.huhu (verify in Console if routes change). */
export const PLAY_DEV_ID = "8174397007390615775";
export const PLAY_APP_ID = "4972296678811700672";
/** Closed testing — Alpha */
export const PLAY_ALPHA_TRACK_ID = "4699229067561993478";
/** Internal testing (do not confuse with Alpha) */
export const PLAY_INTERNAL_TRACK_ID = "4701740414394662705";

export const PLAY_CONSOLE_BASE =
  process.env.PLAY_CONSOLE_APP_URL ??
  `https://play.google.com/console/u/0/developers/${PLAY_DEV_ID}/app/${PLAY_APP_ID}`;

export const PLAY_OPT_IN_URL = "https://play.google.com/apps/testing/com.ctrlz.huhu";
