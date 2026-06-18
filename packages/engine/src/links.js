// Canonical outbound links shared across courses. Single source of truth so the
// shared QuestHeader/QuestSettingsSheet don't each hardcode URLs.
export const SITE_HOME_URL = 'https://discoveryquest.app';
export const ACCOUNT_DASHBOARD_URL = 'https://app.discoveryquest.app';

// Used by <QuestHeader>'s "More quests" button: an app may override the target
// via prop; otherwise fall back to the apex home page.
export const resolveHomeUrl = (url) => url || SITE_HOME_URL;
