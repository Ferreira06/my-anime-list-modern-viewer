import { NextResponse } from 'next/server';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Anime, AnimeOrders, getBaseAnimeData } from '@/app/data/anime';
import { getDb } from '@/app/api/db/route.helper'; // Import the helper function to get the DB instance
// NO import from '@/app/lib/jikan' here, as this route will call /api/anime-covers directly

// Define the structure of your LowDB database
interface MyDB {
  animeList: Anime[];
  animeOrders: AnimeOrders;
}

const dbFilePath = join(process.cwd(), 'data', 'db.json');
const dbDir = dirname(dbFilePath);

let dbInstance: Low<MyDB> | null = null;



// Handler for fetching data (GET request)
export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({
      animeList: db.data?.animeList || [],
      animeOrders: db.data?.animeOrders || {},
    });
  } catch (error: any) {
    console.error("Error in GET /api/db:", error.message, error.stack);
    return NextResponse.json({ error: 'Failed to retrieve data' }, { status: 500 });
  }
}

// Handler for updating data (POST request - covers and orders)
export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    if (body.type === 'updateAnimeList') {
      const { updatedAnimeList } = body;
      if (db.data) {
        db.data.animeList = updatedAnimeList;
        await db.write();
        return NextResponse.json({ success: true, message: 'Anime list updated.' });
      } else {
        console.error("POST /api/db: Database data is null during updateAnimeList.");
        return NextResponse.json({ error: 'Database not initialized.' }, { status: 500 });
      }
    } else if (body.type === 'updateAnimeOrders') {
      const { updatedOrders } = body;
      if (db.data) {
        db.data.animeOrders = updatedOrders;
        await db.write();
        return NextResponse.json({ success: true, message: 'Anime orders updated.' });
      } else {
        console.error("POST /api/db: Database data is null during updateAnimeOrders.");
        return NextResponse.json({ error: 'Database not initialized.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in POST /api/db:", error.message, error.stack);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

// Handler for fetching and saving a single cover (PUT request)
// This route now serves as a proxy to /api/anime-covers, ensuring logic for fetching and saving
// happens server-side, including the rate limit delay.
export async function PUT(request: Request) {
  try {
    const { title, id } = await request.json();

    if (!title || !id) {
      return NextResponse.json({ error: 'Missing title or ID' }, { status: 400 });
    }

    const db = await getDb();
    if (!db.data || !db.data.animeList) {
      console.error("PUT /api/db: Database not initialized or animeList is missing.");
      return NextResponse.json({ error: 'Database not initialized.' }, { status: 500 });
    }

    const animeIndex = db.data.animeList.findIndex(a => a.id === id);
    if (animeIndex === -1) {
      return NextResponse.json({ error: 'Anime not found in DB' }, { status: 404 });
    }

    const anime = db.data.animeList[animeIndex];
    const LOCAL_COVERS_PREFIX = '/anime-covers/';

    // The client-side (app/page.tsx) now performs the initial check for LOCAL_COVERS_PREFIX.
    // This server-side check is a fallback/redundancy, but the primary speedup is client-side.
    // If the client somehow missed it, or if this API is called directly, it will still prevent re-fetching.
    if (anime.coverImage && anime.coverImage.startsWith(LOCAL_COVERS_PREFIX)) {
      console.log(`Anime ID ${id} "${title}" already has local cover in DB: ${anime.coverImage}`);
      return NextResponse.json({ coverImage: anime.coverImage }, { status: 200 });
    }

    // If not found locally, request the /api/anime-covers route to download and save it
    // This makes sure the image is downloaded to public/anime-covers/
    const internalApiUrl = process.env.NODE_ENV === 'production'
      ? `/api/anime-covers?title=${encodeURIComponent(title)}&id=${id}`
      : `http://localhost:3000/api/anime-covers?title=${encodeURIComponent(title)}&id=${id}`;

    console.log(`[db API - PUT] Calling internal /api/anime-covers for "${title}"`);
    const coverResponse = await fetch(internalApiUrl);

    if (!coverResponse.ok) {
      const errorBody = await coverResponse.text();
      console.error(`[db API - PUT] Failed to fetch cover from internal /api/anime-covers: ${coverResponse.status} - ${errorBody}`);
      return NextResponse.json({ error: `Internal cover fetch failed: ${coverResponse.statusText}. Details: ${errorBody}` }, { status: 502 });
    }

    const coverData = await coverResponse.json();
    if (!coverData.coverImage) {
      console.warn(`[db API - PUT] No cover image found by /api/anime-covers for "${title}".`);
      return NextResponse.json({ coverImage: null, message: `No cover image found for ${title}` }, { status: 200 });
    }

    const localCoverPath = coverData.coverImage;

    // Update the anime object in the array with the new local path
    db.data.animeList[animeIndex] = { ...anime, coverImage: localCoverPath };
    await db.write(); // Persist the updated anime list to db.json

    console.log(`[db API - PUT] Updated DB with local cover for "${title}": ${localCoverPath}`);
    return NextResponse.json({ coverImage: localCoverPath }, { status: 200 });

  } catch (error: any) {
    console.error("Error in PUT /api/db (saving cover):", error.message, error.stack);
    return NextResponse.json({ error: 'Internal server error during cover saving.' }, { status: 500 });
  }
}