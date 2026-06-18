// Canonical outbound links shared across courses. Single source of truth so the
// shared QuestHeader/QuestSettingsSheet don't each hardcode URLs.
export const COURSES_CATALOG_URL = 'https://discoveryquest.app/courses';
export const ACCOUNT_DASHBOARD_URL = 'https://app.discoveryquest.app';

// Used by <QuestHeader>: an app may override the catalog target via prop;
// otherwise fall back to the canonical catalog.
export const resolveCatalogUrl = (url) => url || COURSES_CATALOG_URL;
