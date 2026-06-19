# Mock Video Extraction Service Guide

## Overview

The FB Video Downloader Pro includes a comprehensive mock video extraction service that simulates realistic Facebook video data. This service provides video metadata, thumbnails, durations, and resolution options without requiring actual API integration.

## Components

### 1. MockVideoService

**File:** `lib/mock-video-service.ts`

The core service that handles video metadata extraction and formatting.

#### Key Features
- Extract video metadata from Facebook URLs
- Generate realistic mock video data
- Format durations and file sizes
- Get quality labels and descriptions
- Validate Facebook URLs
- Support multiple URL formats

#### Usage

```typescript
import { MockVideoService } from "@/lib/mock-video-service";

const mockService = MockVideoService.getInstance();

// Extract video metadata
const metadata = await mockService.extractVideoMetadata("https://www.facebook.com/watch/?v=video_001");

// Format duration
const duration = mockService.formatDuration(1245); // "20:45"

// Format file size
const size = mockService.formatFileSize(125 * 1024 * 1024); // "125.0 MB"

// Get quality label
const label = mockService.getQualityLabel("720p");
// { label: "HD", description: "High Definition - Best for most devices" }
```

### 2. VideoPreviewCard Component

**File:** `components/video-preview-card.tsx`

A reusable component that displays video metadata with thumbnail, title, duration, and resolution selection.

#### Features
- Display video thumbnail with duration badge
- Show video title and available qualities
- Quality selection with locked state for non-premium
- Resolution details (file size, dimensions, bitrate)
- Video information display
- Download button
- Premium lock messaging

#### Usage

```tsx
import { VideoPreviewCard } from "@/components/video-preview-card";
import { VideoMetadata } from "@/lib/types";

<VideoPreviewCard
  video={videoMetadata}
  selectedQuality="480p"
  onQualitySelect={(quality) => console.log(quality)}
  isPremium={false}
  onDownload={(quality) => console.log(`Download ${quality}`)}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `video` | `VideoMetadata` | Video metadata object |
| `selectedQuality` | `string` | Currently selected quality (default: "480p") |
| `onQualitySelect` | `(quality: string) => void` | Callback when quality is selected |
| `isPremium` | `boolean` | Whether user has premium access |
| `onDownload` | `(quality: string) => void` | Callback when download is clicked |

### 3. Download Screen Integration

**File:** `app/(tabs)/download.tsx`

The download screen now integrates the mock video service to display realistic video previews.

#### Features
- Load video metadata using mock service
- Display loading state while extracting
- Show error messages if extraction fails
- Display video preview with thumbnail
- Quality selection with premium lock
- Download initiation with analytics tracking

## Mock Video Database

The service includes 6 pre-configured mock videos:

| Video ID | Title | Duration | File Sizes |
|----------|-------|----------|-----------|
| `video_001` | Amazing Nature Documentary - 4K Ultra HD | 20:45 | 720p: 125MB, 480p: 65MB, 360p: 35MB |
| `video_002` | Funny Cat Videos Compilation | 7:36 | 720p: 95MB, 480p: 52MB, 360p: 28MB |
| `video_003` | Travel Vlog: Exploring Tokyo Streets | 14:52 | 720p: 145MB, 480p: 78MB, 360p: 42MB |
| `video_004` | Music Video - New Release 2024 | 3:54 | 720p: 75MB, 480p: 42MB, 360p: 23MB |
| `video_005` | Gaming Highlights - Esports Tournament | 25:23 | 720p: 165MB, 480p: 88MB, 360p: 48MB |
| `video_006` | Cooking Show - Easy Recipes | 11:18 | 720p: 115MB, 480p: 62MB, 360p: 33MB |

### Testing with Mock Videos

To test with pre-configured videos, use these URLs:

```
https://www.facebook.com/watch/?v=video_001
https://www.facebook.com/watch/?v=video_002
https://www.facebook.com/watch/?v=video_003
https://www.facebook.com/watch/?v=video_004
https://www.facebook.com/watch/?v=video_005
https://www.facebook.com/watch/?v=video_006
```

## Data Types

### VideoMetadata

```typescript
interface VideoMetadata {
  id: string;
  title: string;
  duration: number; // seconds
  thumbnail: string; // URL
  url: string; // Facebook URL
  fileSize: {
    "720p": number; // bytes
    "480p": number; // bytes
    "360p": number; // bytes
  };
  resolution?: {
    "720p": { width: number; height: number; bitrate: string };
    "480p": { width: number; height: number; bitrate: string };
    "360p": { width: number; height: number; bitrate: string };
  };
}
```

### VideoResolution

```typescript
interface VideoResolution {
  width: number;
  height: number;
  bitrate: string; // e.g., "5000k"
}
```

## Quality Labels

The service provides quality labels with descriptions:

| Quality | Label | Description |
|---------|-------|-------------|
| `720p` | HD | High Definition - Best for most devices |
| `480p` | SD | Standard Definition - Balanced quality & size |
| `360p` | Low | Low Quality - Smallest file size |

## Integration Examples

### Example 1: Extract and Display Video

```tsx
import { MockVideoService } from "@/lib/mock-video-service";
import { VideoPreviewCard } from "@/components/video-preview-card";

export default function MyScreen() {
  const [video, setVideo] = useState(null);
  const mockService = MockVideoService.getInstance();

  useEffect(() => {
    const loadVideo = async () => {
      const metadata = await mockService.extractVideoMetadata(
        "https://www.facebook.com/watch/?v=video_001"
      );
      setVideo(metadata);
    };
    loadVideo();
  }, []);

  return (
    <VideoPreviewCard
      video={video}
      isPremium={false}
      onDownload={(quality) => console.log(`Download ${quality}`)}
    />
  );
}
```

### Example 2: Format Video Information

```tsx
const mockService = MockVideoService.getInstance();

// Format duration
const duration = mockService.formatDuration(1245);
console.log(duration); // "20:45"

// Format file size
const size = mockService.formatFileSize(125 * 1024 * 1024);
console.log(size); // "125.0 MB"

// Get quality info
const quality = mockService.getQualityLabel("720p");
console.log(quality);
// { label: "HD", description: "High Definition - Best for most devices" }
```

### Example 3: Validate URL and Extract

```tsx
const mockService = MockVideoService.getInstance();

const url = "https://www.facebook.com/watch/?v=video_001";

if (mockService.isValidFacebookUrl(url)) {
  const metadata = await mockService.extractVideoMetadata(url);
  if (metadata) {
    console.log("Video found:", metadata.title);
  }
}
```

## URL Format Support

The mock service supports multiple Facebook URL formats:

```
https://www.facebook.com/watch/?v=123456789
https://www.facebook.com/video.php?v=123456789
https://www.facebook.com/watch/123456789
https://fb.com/watch/?v=123456789
https://www.facebook.com/username/videos/123456789
```

## Realistic Data Generation

For URLs not in the mock database, the service generates random realistic data:

- **Titles:** Selected from 10 sample titles
- **Thumbnails:** Selected from Unsplash images
- **Duration:** Random between 2-32 minutes
- **File Sizes:** Calculated based on duration
- **Resolution:** Standard 720p, 480p, 360p specs

## Performance Optimization

### Caching

The service uses a singleton pattern to ensure only one instance:

```typescript
const mockService = MockVideoService.getInstance();
```

### Lazy Loading

Video metadata is loaded on-demand:

```typescript
const metadata = await mockService.extractVideoMetadata(url);
```

### Network Simulation

The service simulates a 1-second network delay:

```typescript
await this.delay(1000); // Simulates API call
```

## Transitioning to Real API

To replace the mock service with a real API:

1. **Create API Service**
   ```typescript
   // lib/video-extraction-api.ts
   export class VideoExtractionAPI {
     async extractVideoMetadata(url: string): Promise<VideoMetadata> {
       const response = await fetch('https://api.example.com/extract', {
         method: 'POST',
         body: JSON.stringify({ url })
       });
       return response.json();
     }
   }
   ```

2. **Update Download Screen**
   ```typescript
   // Use real API instead of mock service
   const metadata = await videoAPI.extractVideoMetadata(videoUrl);
   ```

3. **Maintain Compatibility**
   - Keep the same `VideoMetadata` interface
   - Ensure same return types
   - Update error handling as needed

## Testing

### Unit Tests

```typescript
import { MockVideoService } from "@/lib/mock-video-service";

describe("MockVideoService", () => {
  it("extracts video metadata", async () => {
    const service = MockVideoService.getInstance();
    const metadata = await service.extractVideoMetadata(
      "https://www.facebook.com/watch/?v=video_001"
    );
    expect(metadata).toBeDefined();
    expect(metadata?.title).toBe("Amazing Nature Documentary - 4K Ultra HD");
  });

  it("formats duration correctly", () => {
    const service = MockVideoService.getInstance();
    expect(service.formatDuration(1245)).toBe("20:45");
    expect(service.formatDuration(65)).toBe("1:05");
  });

  it("formats file size correctly", () => {
    const service = MockVideoService.getInstance();
    expect(service.formatFileSize(125 * 1024 * 1024)).toBe("125.0 MB");
    expect(service.formatFileSize(1024)).toBe("1.0 KB");
  });
});
```

## Troubleshooting

### Video Metadata Not Loading
- Ensure URL is a valid Facebook URL
- Check that video ID is correctly extracted
- Verify mock database has entry for video ID

### Thumbnail Not Displaying
- Check image URL is accessible
- Ensure Image component is properly configured
- Verify network connectivity

### Quality Selection Not Working
- Check `isPremium` prop is correctly passed
- Verify `onQualitySelect` callback is defined
- Ensure quality string matches available options

## Future Enhancements

1. **Real API Integration** - Replace mock service with actual video extraction API
2. **Caching** - Cache extracted metadata to reduce API calls
3. **Batch Extraction** - Extract multiple videos at once
4. **Quality Detection** - Automatically detect available qualities
5. **Thumbnail Generation** - Generate custom thumbnails if not available
6. **Metadata Enrichment** - Add views, likes, upload date, etc.

## Related Files

- `lib/mock-video-service.ts` - Mock service implementation
- `components/video-preview-card.tsx` - Video preview component
- `app/(tabs)/download.tsx` - Download screen integration
- `lib/types.ts` - TypeScript type definitions
- `lib/analytics-service.ts` - Event tracking

## Support

For questions or issues:
- Check the mock video database for available test videos
- Review integration examples above
- Refer to the Download Screen implementation for real-world usage
- See PROGRESS_BAR_GUIDE.md for progress tracking integration
