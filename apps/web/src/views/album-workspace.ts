import { albumHref } from "../admin/shared";
import type { Album } from "../types";

export type AlbumFilter = "all" | "public" | "hidden";

export function getAlbumWorkspace(
  albums: Album[],
  query: string,
  filter: AlbumFilter,
  selectedId: string | null,
) {
  const term = query.trim().toLowerCase();
  const rows = albums.filter((album) => {
    const isPublic = album.show === 0;
    if (filter !== "all" && isPublic !== (filter === "public")) return false;
    return (
      album.name.toLowerCase().includes(term) ||
      albumHref(album.album_value).toLowerCase().includes(term)
    );
  });
  return { rows, selected: rows.find((album) => album.id === selectedId) ?? rows[0] };
}
