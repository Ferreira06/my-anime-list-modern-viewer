// app/lib/jikan.ts
// This file will now act as a client for your *internal* Next.js API route.
// It does NOT call the external Jikan API directly from the client.

export async function getAnimeCover(title: string): Promise<string | undefined> {
    try {
      // Call your new local API Route to fetch/download the cover
      const response = await fetch(`/api/anime-covers?title=${encodeURIComponent(title)}`);
      const data = await response.json();
  
      if (response.ok && data.coverImage) {
        return data.coverImage;
      } else {
        console.warn(`Could not get local cover for "${title}":`, data.error || data.message);
        return undefined;
      }
    } catch (error) {
      console.error(`Error requesting local cover for "${title}":`, error);
      return undefined;
    }
  } 