// app/api/anime-covers/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';
const LOCAL_COVERS_DIR = '/anime-covers/'; // Relative to 'public' folder
const JIKAN_API_DELAY_MS = 1000; // INCREASE DELAY to 1 second as per Jikan's suggestion (1 request/second)

// --- Centralized Throttling Mechanism ---
let jikanQueue: Promise<void> = Promise.resolve(); // A promise chain to sequentialize Jikan calls
let lastJikanApiCallTime = 0; // Keep track of the actual last call time for the delay

async function callJikanApiWithThrottle<T>(fetchFn: () => Promise<T>): Promise<T> {
  // 1. Create a promise for the actual operation. This promise will resolve with
  //    the value of type T from fetchFn, which is what the caller wants.
  const operationPromise = jikanQueue.then(async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastJikanApiCallTime;
    if (timeSinceLastCall < JIKAN_API_DELAY_MS) {
      const delayNeeded = JIKAN_API_DELAY_MS - timeSinceLastCall;
      console.log(`[anime-covers API Throttler] Delaying Jikan API call by ${delayNeeded}ms.`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    try {
      const result = await fetchFn(); // This resolves to T
      lastJikanApiCallTime = Date.now();
      return result; // This makes operationPromise a Promise<T>
    } catch (error) {
      console.error("[anime-covers API Throttler] Error during Jikan API call:", error);
      lastJikanApiCallTime = Date.now(); // Update time to prevent stall on repeated errors
      throw error; // Re-throw to reject operationPromise
    }
  });

  // 2. Update the queue for the *next* call. The queue only cares about when the
  //    last operation is *done*, not what its result was. We chain off the
  //    operationPromise and resolve it to `void` to satisfy the jikanQueue's type.
  jikanQueue = operationPromise.then(
    () => {}, // On success, resolve to void
    () => {}  // On error, also resolve to void so the queue doesn't break
  );

  // 3. Return the original promise that holds the value. This is now type-safe.
  return operationPromise;
}
// --- End Centralized Throttling Mechanism ---

// Define interfaces for Jikan API response structure
interface JikanImage {
  image_url: string;
}

interface JikanImages {
  jpg: JikanImage;
  webp: JikanImage;
}

interface JikanAnime {
  mal_id: number;
  images: JikanImages;
  title: string;
}

interface JikanSearchResponse {
  data: JikanAnime[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');

  if (!title) {
    return NextResponse.json({ error: 'Missing anime title' }, { status: 400 });
  }

  const publicDirPath = path.join(process.cwd(), 'public');
  const coversPath = path.join(publicDirPath, LOCAL_COVERS_DIR);

  try {
    await fs.mkdir(coversPath, { recursive: true });
    console.log(`[anime-covers API] Ensured directory exists: ${coversPath}`);
  } catch (error: unknown) {
    console.error(`[anime-covers API] Error creating directory ${coversPath}:`, (error as Error).message, (error as Error).stack);
    return NextResponse.json({ error: `Server error: Could not create image directory. Details: ${(error as Error).message}` }, { status: 500 });
  }

  const baseFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  // We'll initially assume .jpg, but will refine once we get the actual URL
  let filename = `${baseFilename}.jpg`; // Placeholder filename
  let localImagePath = path.join(coversPath, filename);
  let relativePath = path.join(LOCAL_COVERS_DIR, filename);

  // FIRST CHECK: Check if image already exists locally based on a *potential* filename
  // This is a quick win if the file was previously saved.
  try {
    const filesInDir = await fs.readdir(coversPath);
    // Find a file that starts with our base filename (to account for different extensions or IDs)
    const existingFile = filesInDir.find(f => f.startsWith(baseFilename));
    if (existingFile) {
      relativePath = path.join(LOCAL_COVERS_DIR, existingFile);
      console.log(`[anime-covers API] Image for "${title}" already exists locally: ${relativePath}`);
      return NextResponse.json({ coverImage: relativePath }, { status: 200 });
    }
  } catch {
    // Directory might not exist or other FS error, but we'll try to create it later if needed.
    // Continue to fetch if access fails.
    console.log(`[anime-covers API] Initial local image check for "${title}" failed or file not found.`);
  }

  let imageUrl: string | undefined;
  let malId: number | undefined;

  try {
    // Use the throttler for the Jikan API search call
    const jikanSearchData: JikanSearchResponse = await callJikanApiWithThrottle(async () => {
      console.log(`[anime-covers API] Searching Jikan for: "${title}"`);
      const jikanResponse = await fetch(`${JIKAN_API_BASE_URL}/anime?q=${encodeURIComponent(title)}&limit=1`);

      if (!jikanResponse.ok) {
        const errorBody = await jikanResponse.text();
        throw new Error(`Jikan API responded with status ${jikanResponse.status}: ${errorBody}`);
      }
      return jikanResponse.json();
    });

    if (jikanSearchData.data && jikanSearchData.data.length > 0) {
      imageUrl = jikanSearchData.data[0].images?.webp?.image_url || jikanSearchData.data[0].images?.jpg?.image_url;
      malId = jikanSearchData.data[0].mal_id;

      // Generate a more robust filename with mal_id and correct extension
      const inferredExtension = path.extname(new URL(imageUrl || '').pathname || '.jpg').toLowerCase();
      filename = `${baseFilename}-${malId || ''}${inferredExtension}`;
      localImagePath = path.join(coversPath, filename);
      relativePath = path.join(LOCAL_COVERS_DIR, filename);

      // SECOND CHECK: After getting actual MAL ID and extension, check if this definitive file exists
      try {
        await fs.access(localImagePath);
        console.log(`[anime-covers API] Image for "${title}" already exists locally (definitive filename): ${relativePath}`);
        return NextResponse.json({ coverImage: relativePath }, { status: 200 });
      } catch {
        // File doesn't exist with the definitive name, proceed to download
        console.log(`[anime-covers API] Definitive local image not found, downloading for "${title}".`);
      }

    } else {
      console.log(`[anime-covers API] No image URL found for "${title}" from Jikan.`);
      return NextResponse.json({ coverImage: null, message: `No image found for ${title}` }, { status: 200 });
    }

    if (!imageUrl) {
      console.log(`[anime-covers API] No image URL found for "${title}" after Jikan search.`);
      return NextResponse.json({ coverImage: null, message: `No image found for ${title}` }, { status: 200 });
    }

    // Download the image using the throttler as well (if you anticipate heavy image downloading)
    // For large images, this fetch might take longer, but it's not subject to Jikan's rate limit.
    // So, we don't strictly need the `callJikanApiWithThrottle` here, but for consistency if
    // you were fetching from another rate-limited image CDN, you would use it.
    console.log(`[anime-covers API] Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      const errorBody = await imageResponse.text();
      throw new Error(`Failed to download image from ${imageUrl}: ${imageResponse.statusText}. Body: ${errorBody}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(localImagePath, buffer);
    console.log(`[anime-covers API] Saved image locally: ${relativePath}`);

    return NextResponse.json({ coverImage: relativePath }, { status: 200 });

  } catch (error: unknown) {
    console.error(`[anime-covers API] Fatal error in GET handler for "${title}":`, (error as Error).message, (error as Error).stack);
    // Determine status based on error type
    let statusCode = 500;
    if ((error as Error).message.includes("Jikan API error: 429")) {
        statusCode = 429; // Specifically return 429 if Jikan rate-limited us
    } else if ((error as Error).message.includes("Jikan API error:") || (error as Error).message.includes("Failed to download image:")) {
        statusCode = 502; // Bad Gateway for upstream errors
    }
    return NextResponse.json({ error: `Internal server error: ${(error as Error).message}` }, { status: statusCode });
  }
}