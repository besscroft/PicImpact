import { describe, expect, it } from "vite-plus/test";

import type { Album } from "../src/types";
import { getAlbumWorkspace } from "../src/views/album-workspace";

const albums: Album[] = [
  {
    id: "mountains",
    name: "山野行记",
    album_value: "/travel",
    detail: null,
    theme: "0",
    show: 0,
    sort: 30,
    random_show: 1,
    license: null,
    image_sorting: 1,
    daily_weight: 0,
  },
];
albums.push({
  ...albums[0],
  id: "street",
  name: "城市散步",
  album_value: "Street",
  show: 1,
  sort: 10,
});

describe("album workspace", () => {
  it("finds albums by Chinese name or case-insensitive path", () => {
    expect(
      getAlbumWorkspace(albums, "  山野  ", "all", null).rows.map((album) => album.id),
    ).toEqual(["mountains"]);
    expect(
      getAlbumWorkspace(albums, " /STREET ", "all", null).rows.map((album) => album.id),
    ).toEqual(["street"]);
  });

  it("combines search with visibility and leaves no selection when nothing matches", () => {
    expect(getAlbumWorkspace(albums, "street", "public", "mountains")).toEqual({
      rows: [],
      selected: undefined,
    });
    expect(getAlbumWorkspace(albums, "street", "hidden", "mountains").selected?.id).toBe("street");
  });

  it("keeps the selected album when it is still in the refreshed list", () => {
    const updated = { ...albums[1], name: "夜间散步" };
    const workspace = getAlbumWorkspace([albums[0], updated], "", "all", "street");
    expect(workspace.selected?.name).toBe("夜间散步");
  });

  it("falls back to the first result when the selected album is removed", () => {
    expect(getAlbumWorkspace([albums[0]], "", "all", "street").selected?.id).toBe("mountains");
  });
});
