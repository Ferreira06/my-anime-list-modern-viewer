import { NextResponse } from 'next/server';
import { getDb } from '../db/route.helper';
import type { Anime } from '@/app/data/anime';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

// Main handler for creating a new anime entry
export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'A valid anime title is required.' }, { status: 400 });
    }

    // 1. Search Jikan for the anime
    console.log(`[API /anime POST] Searching Jikan for title: "${title}"`);
    const jikanResponse = await fetch(`${JIKAN_API_BASE_URL}/anime?q=${encodeURIComponent(title)}&limit=1`);
    if (!jikanResponse.ok) {
      throw new Error(`Jikan API responded with status ${jikanResponse.status}`);
    }
    const jikanSearchData = await jikanResponse.json();
    const jikanAnime = jikanSearchData.data?.[0];

    if (!jikanAnime) {
      return NextResponse.json({ error: `No anime found on Jikan for "${title}".` }, { status: 404 });
    }

    // 2. Check if the anime already exists in our database
    const db = await getDb();
    const existingAnime = db.data.animeList.find(a => a.id === jikanAnime.mal_id);

    if (existingAnime) {
      return NextResponse.json({ error: `"${jikanAnime.title}" already exists in your list.` }, { status: 409 }); // 409 Conflict
    }

    // 3. Create the new anime object based on our interface
    const newAnime: Anime = {
      id: jikanAnime.mal_id,
      title: jikanAnime.title,
      type: jikanAnime.type || 'Unknown',
      episodes: jikanAnime.episodes || 0,
      watchedEpisodes: 0,
      status: 'Plan to Watch', // Default status
      score: 0,
      startDate: '0000-00-00',
      finishDate: '0000-00-00',
      coverImage: jikanAnime.images?.webp?.image_url || jikanAnime.images?.jpg?.image_url || '',
    };
    
    // 4. Add to the database and save
    db.data.animeList.unshift(newAnime); // Add to the beginning of the list
    await db.write();
    
    console.log(`[API /anime POST] Successfully added "${newAnime.title}" to the database.`);

    // 5. Return the newly created anime object
    return NextResponse.json(newAnime, { status: 201 }); // 201 Created

  } catch (error: unknown) {
    console.error('[API /anime POST] An error occurred:', (error as Error).message);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

// ✅ NEW: Handler for deleting an anime
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Anime ID is required.' }, { status: 400 });
    }

    const animeId = parseInt(id, 10);
    if (isNaN(animeId)) {
        return NextResponse.json({ error: 'Invalid Anime ID format.' }, { status: 400 });
    }

    // 1. Get the database instance
    const db = await getDb();

    const animeToDelete = db.data.animeList.find(a => a.id === animeId);
    if (!animeToDelete) {
        // If not found, it might have been deleted already. Return success.
        return NextResponse.json({ message: 'Anime not found or already deleted.' }, { status: 200 });
    }

    // 2. Filter the anime list to remove the specified anime
    db.data.animeList = db.data.animeList.filter(a => a.id !== animeId);

    // 3. (Important for data integrity) Remove the anime's ID from all custom sort orders
    for (const key in db.data.animeOrders) {
        db.data.animeOrders[key] = db.data.animeOrders[key].filter(orderId => orderId !== animeId);
    }

    // 4. Write the changes back to the db.json file
    await db.write();

    console.log(`[API /anime DELETE] Successfully deleted "${animeToDelete.title}" (ID: ${animeId}) from database.`);

    return NextResponse.json({ message: `Successfully deleted "${animeToDelete.title}"` }, { status: 200 });

  } catch (error: unknown) {
    console.error('[API /anime DELETE] An error occurred:', (error as Error).message);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (typeof id !== 'number') {
      return NextResponse.json({ error: 'A valid anime ID is required.' }, { status: 400 });
    }

    const db = await getDb();
    const animeIndex = db.data.animeList.findIndex(a => a.id === id);

    if (animeIndex === -1) {
      return NextResponse.json({ error: 'Anime not found.' }, { status: 404 });
    }

    // Get the original anime object to merge with updates
    const originalAnime = db.data.animeList[animeIndex];
    const updatedAnime = { ...originalAnime, ...updateData };

    // --- Add Validation and Business Logic ---
    if (updateData.watchedEpisodes !== undefined) {
        const watched = Number(updateData.watchedEpisodes);
        if (isNaN(watched) || watched < 0 || (originalAnime.episodes > 0 && watched > originalAnime.episodes)) {
            return NextResponse.json({ error: 'Invalid number of watched episodes.' }, { status: 400 });
        }
        updatedAnime.watchedEpisodes = watched;
    }
    
    if (updateData.score !== undefined) {
        const score = Number(updateData.score);
        if (isNaN(score) || score < 0 || score > 10) {
            return NextResponse.json({ error: 'Score must be between 0 and 10.' }, { status: 400 });
        }
        updatedAnime.score = score;
    }

    // Auto-update status to 'Completed' if all episodes are watched
    if (updatedAnime.episodes > 0 && updatedAnime.watchedEpisodes === updatedAnime.episodes) {
      updatedAnime.status = 'Completed';
    }

    // Replace the old object with the fully updated one
    db.data.animeList[animeIndex] = updatedAnime;

    await db.write();

    console.log(`[API /anime PATCH] Updated "${updatedAnime.title}"`);

    return NextResponse.json(updatedAnime, { status: 200 });

  } catch (error: unknown) {
    console.error('[API /anime PATCH] An error occurred:', (error as Error).message);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}