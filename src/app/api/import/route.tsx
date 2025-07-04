import { NextResponse } from 'next/server';
import { getDb } from '../db/route.helper';
import type { Anime } from '@/app/data/anime';

/**
 * A simple parser for the MyAnimeList XML format.
 * It extracts the necessary fields from each <anime> block.
 * @param xmlString The XML content as a string.
 * @returns An array of Anime objects.
 */
function parseMyAnimeListXml(xmlString: string): Anime[] {
  const animes: Anime[] = [];
  // Split the string into individual <anime> blocks
  const animeBlocks = xmlString.split('<anime>').slice(1);

  for (const block of animeBlocks) {
    // Helper to extract content from a specific tag within the block
    const getTagValue = (tagName: string): string | null => {
      const match = block.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`));
      // Handle CDATA for titles, which contain special characters
      if (tagName === 'series_title' && match && match[1].startsWith('<![CDATA[')) {
        return match[1].substring(9, match[1].length - 3);
      }
      return match ? match[1] : null;
    };

    const id = parseInt(getTagValue('series_animedb_id') || '', 10);
    // Skip any entry that doesn't have a valid ID
    if (isNaN(id)) continue;

    const animeData: Anime = {
      id: id,
      title: getTagValue('series_title') || 'Unknown Title',
      type: getTagValue('series_type') || 'Unknown',
      episodes: parseInt(getTagValue('series_episodes') || '0', 10),
      watchedEpisodes: parseInt(getTagValue('my_watched_episodes') || '0', 10),
      status: getTagValue('my_status') || 'Plan to Watch',
      score: parseInt(getTagValue('my_score') || '0', 10),
      startDate: getTagValue('my_start_date') || '0000-00-00',
      finishDate: getTagValue('my_finish_date') || '0000-00-00',
      coverImage: '', // Cover images will be fetched later by the main app
    };
    animes.push(animeData);
  }
  return animes;
}

export async function POST(request: Request) {
  try {
    const xmlString = await request.text();
    if (!xmlString) {
      return NextResponse.json({ error: 'XML file content is empty.' }, { status: 400 });
    }

    const importedAnimes = parseMyAnimeListXml(xmlString);
    if (importedAnimes.length === 0) {
      return NextResponse.json({ error: 'No valid anime entries found in the XML file.' }, { status: 400 });
    }

    const db = await getDb();
    const existingAnimeIds = new Set(db.data.animeList.map(a => a.id));
    let newAnimeCount = 0;
    let updatedAnimeCount = 0;

    // Merge the imported list with the existing list
    importedAnimes.forEach(importedAnime => {
      if (existingAnimeIds.has(importedAnime.id)) {
        // If anime exists, update it
        const index = db.data.animeList.findIndex(a => a.id === importedAnime.id);
        db.data.animeList[index] = { ...db.data.animeList[index], ...importedAnime };
        updatedAnimeCount++;
      } else {
        // If anime is new, add it
        db.data.animeList.push(importedAnime);
        newAnimeCount++;
      }
    });

    await db.write();

    const message = `Import successful! Added ${newAnimeCount} new anime and updated ${updatedAnimeCount} existing entries.`;
    console.log(`[API /import POST] ${message}`);
    
    return NextResponse.json({ message });

  } catch (error: unknown) {
    console.error('[API /import POST] An error occurred:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to process XML file.' }, { status: 500 });
  }
}
