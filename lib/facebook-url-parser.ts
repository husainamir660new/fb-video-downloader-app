/**
 * Advanced Facebook URL Parser
 * Supports all modern Facebook URL formats including /share/r/, /reels/, mobile shares, etc.
 */

export interface ParsedFacebookURL {
  videoId: string | null;
  type: "video" | "reel" | "share" | "watch" | "unknown";
  isValid: boolean;
  originalUrl: string;
  normalizedUrl: string;
}

/**
 * Comprehensive Facebook URL patterns
 */
const FACEBOOK_URL_PATTERNS = [
  // Standard video.php format: https://www.facebook.com/video.php?v=123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/video\.php\?v=(\d+)/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Watch format: https://www.facebook.com/watch/?v=123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/watch\/?\?v=(\d+)/i,
    type: "watch" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Reel format: https://www.facebook.com/reel/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/reel\/(\d+)/i,
    type: "reel" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Share/r format (Mobile shares): https://www.facebook.com/share/r/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/r\/([a-zA-Z0-9_-]+)/i,
    type: "share" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Share/v format: https://www.facebook.com/share/v/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/v\/([a-zA-Z0-9_-]+)/i,
    type: "share" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Profile/user video format: https://www.facebook.com/username/videos/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/(?:[a-zA-Z0-9._-]+)\/videos\/(\d+)/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Page video format: https://www.facebook.com/pagename/posts/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/(?:[a-zA-Z0-9._-]+)\/posts\/(\d+)/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Permalink format: https://www.facebook.com/permalink.php?story_fbid=123456789&id=987654321
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/permalink\.php\?story_fbid=(\d+)/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Mobile m.facebook.com format: https://m.facebook.com/video.php?v=123456789
  {
    pattern: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/video\.php\?v=(\d+)/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Mobile watch format: https://m.facebook.com/watch/?v=123456789
  {
    pattern: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/watch\/?\?v=(\d+)/i,
    type: "watch" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Mobile reel format: https://m.facebook.com/reel/123456789
  {
    pattern: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/reel\/(\d+)/i,
    type: "reel" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Mobile share format: https://m.facebook.com/share/r/123456789
  {
    pattern: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/share\/r\/([a-zA-Z0-9]+)/i,
    type: "share" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Mobile share/v format: https://m.facebook.com/share/v/123456789
  {
    pattern: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/share\/v\/([a-zA-Z0-9]+)/i,
    type: "share" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Direct share format: https://www.facebook.com/share/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/share\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/i,
    type: "share" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Mobile direct share format: https://m.facebook.com/share/123456789
  {
    pattern: /(?:https?:\/\/ )?m\.(?:facebook|fb)\.com\/share\/([a-zA-Z0-9_-]+)(?:\/|\?|$)/i,
    type: "share" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Short URL format: https://fb.watch/abc123/
  {
    pattern: /(?:https?:\/\/ )?fb\.watch\/([a-zA-Z0-9]+)\/?/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Story format: https://www.facebook.com/stories/123456789
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/stories\/(\d+)/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Video with query params: https://www.facebook.com/video.php?v=123456789&t=10
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/video\.php\?v=(\d+)(?:&.*)?/i,
    type: "video" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },

  // Watch with query params: https://www.facebook.com/watch/?v=123456789&t=10
  {
    pattern: /(?:https?:\/\/ )?(?:www\.)?(?:facebook|fb)\.com\/watch\/?\?v=(\d+)(?:&.*)?/i,
    type: "watch" as const,
    extractId: (match: RegExpMatchArray) => match[1],
  },
];

/**
 * Parse Facebook URL and extract video ID
 * Supports all modern Facebook URL formats
 */
export function parseFacebookUrl(url: string): ParsedFacebookURL {
  const originalUrl = url.trim();

  // Try each pattern
  for (const { pattern, type, extractId } of FACEBOOK_URL_PATTERNS) {
    const match = originalUrl.match(pattern);
    if (match) {
      const videoId = extractId(match);
      return {
        videoId,
        type,
        isValid: !!videoId,
        originalUrl,
        normalizedUrl: normalizeUrl(originalUrl),
      };
    }
  }

  // If no pattern matches, return invalid
  return {
    videoId: null,
    type: "unknown",
    isValid: false,
    originalUrl,
    normalizedUrl: originalUrl,
  };
}

/**
 * Normalize Facebook URL to standard format
 */
function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const videoId = extractVideoIdFromUrl(url);

    if (!videoId) {
      return url;
    }

    // Return standard format
    return `https://www.facebook.com/video.php?v=${videoId}`;
  } catch {
    return url;
  }
}

/**
 * Extract video ID from any Facebook URL format
 */
function extractVideoIdFromUrl(url: string ): string | null {
  for (const { pattern, extractId } of FACEBOOK_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return extractId(match);
    }
  }
  return null;
}

/**
 * Validate if URL is a Facebook video URL
 */
export function isFacebookVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return (
      hostname === "facebook.com" ||
      hostname === "www.facebook.com" ||
      hostname === "m.facebook.com" ||
      hostname === "fb.com" ||
      hostname === "www.fb.com" ||
      hostname === "m.fb.com" ||
      hostname === "fb.watch" ||
      hostname.endsWith(".facebook.com") ||
      hostname.endsWith(".fb.com")
    );
  } catch {
    return false;
  }
}

/**
 * Extract video ID from Facebook URL
 */
export function extractFacebookVideoId(url: string): string | null {
  const parsed = parseFacebookUrl(url);
  return parsed.isValid ? parsed.videoId : null;
}

/**
 * Get URL type (video, reel, share, etc.)
 */
export function getFacebookUrlType(url: string): ParsedFacebookURL["type"] {
  const parsed = parseFacebookUrl(url);
  return parsed.type;
}

/**
 * Normalize multiple URL formats to standard format
 */
export function normalizeFacebookUrl(url: string): string {
  const parsed = parseFacebookUrl(url);
  return parsed.normalizedUrl;
}

/**
 * Batch parse multiple URLs
 */
export function parseFacebookUrls(urls: string[]): ParsedFacebookURL[] {
  return urls.map((url) => parseFacebookUrl(url));
}

/**
 * Get all valid video IDs from a list of URLs
 */
export function extractFacebookVideoIds(urls: string[]): string[] {
  return urls
    .map((url) => extractFacebookVideoId(url))
    .filter((id): id is string => id !== null);
}
