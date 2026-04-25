import { buildNewsFeedHook } from "./newsfeed-shared";

/** Dashboard feed: results pinned to top, 50 items, type-interleaved. */
export const useNewsFeed = buildNewsFeedHook("newsfeed", {
  maxItems: 50,
  resultsFirst: true,
  interleave: true,
});
