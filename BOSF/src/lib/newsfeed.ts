// Re-export from the new feed module structure
export { generateNewsFeed } from "./feed/index";
export type { FeedItem, FeedItemType, BackendFeedItem } from "./feed/types";
export { normalizeBackendFeedItem } from "./feed/normalize";
