import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Anime, AnimeOrders, getBaseAnimeData } from '@/app/data/anime';

// Define the structure of your LowDB database
interface MyDB {
  animeList: Anime[];
  animeOrders: AnimeOrders;
}

const dbFilePath = join(process.cwd(), 'data', 'db.json');
const dbDir = dirname(dbFilePath);

let dbInstance: Low<MyDB> | null = null;

// This is the same getDb function from before, now exported
export async function getDb(): Promise<Low<MyDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    await fs.mkdir(dbDir, { recursive: true });
  } catch (error: unknown) {
    console.error(`Critical: Failed to create database directory: ${dbDir}`, (error as Error).message);
    throw new Error(`Critical: Failed to create database directory: ${(error as Error).message}`);
  }

  const adapter = new JSONFile<MyDB>(dbFilePath);
  // Provide a default structure that matches what getBaseAnimeData returns
  const db = new Low<MyDB>(adapter, getBaseAnimeData());

  try {
    await db.read();

    // If the database file doesn't exist or is empty, db.data will be null.
    // In that case, we ensure it's initialized with our default empty structure.
    if (db.data === null) {
      console.log('LowDB: Database file is empty. Initializing with empty structure...');
      db.data = getBaseAnimeData();
      await db.write();
    } else {
      console.log('LowDB: Database loaded successfully.');
    }
  } catch (error: unknown) {
    console.error(`LowDB: A critical error occurred during database initialization:`, (error as Error).message);
    throw new Error(`Fatal DB error: Could not initialize LowDB. ${(error as Error).message}`);
  }

  dbInstance = db;
  return dbInstance;
}