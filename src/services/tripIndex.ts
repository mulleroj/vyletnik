export interface TripIndexEntry {
  id: string;
  title: string;
  path: string;
}

export interface TripIndexFile {
  trips: TripIndexEntry[];
}

export async function loadTripIndex(): Promise<TripIndexFile> {
  const url = `${import.meta.env.BASE_URL}trips/index.json`.replace(/\/+/g, '/');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Index výletů se nepodařilo načíst.');
  return (await res.json()) as TripIndexFile;
}
