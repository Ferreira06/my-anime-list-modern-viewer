export interface Anime {
  id: number;
  title: string;
  type: string;
  episodes: number;
  watchedEpisodes: number;
  status: string;
  score: number;
  startDate: string;
  finishDate: string;
  coverImage?: string;
}

export type AnimeOrders = {
  [status: string]: number[];
};

// This function now provides a truly empty starting point.
export const getBaseAnimeData = (): { animeList: Anime[], animeOrders: AnimeOrders } => {
  return { animeList: [], animeOrders: {} };
};
