import { buildNewsFeedHook } from "./newsfeed-shared";

/** News page feed: strict chronological, 100 items, no interleaving. */
export const useFullNewsFeed = buildNewsFeedHook("full-newsfeed", {
  maxItems: 100,
  resultsFirst: false,
  interleave: false,
});
