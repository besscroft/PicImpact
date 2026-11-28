import { describe, expect, it, vi } from "vite-plus/test";

const { decodeCounter } = vi.hoisted(() => ({ decodeCounter: { calls: 0 } }));

// mock 掉 canvas 解码（thumbHashToDataURL 依赖 DOM），只验证缓存与容错逻辑
vi.mock("thumbhash", () => ({
  thumbHashToDataURL: () => {
    decodeCounter.calls += 1;
    return `data:image/png;base64,decoded-${decodeCounter.calls}`;
  },
}));

// blurhashDataUrl 有 typeof document 守卫，node 测试环境补一个最小桩
vi.stubGlobal("document", {});

import { blurhashDataUrl } from "../src/components/BlurhashImage";

describe("blurhashDataUrl", () => {
  it("解码结果按原始 hash 缓存，重复调用不再解码", () => {
    const hash = "MggCBoBxh4d/eHeIiIiHd3eIAAAAAAA=";
    const before = decodeCounter.calls;
    const first = blurhashDataUrl(hash);
    expect(first).toMatch(/^data:image\/png;base64,decoded-/);
    expect(blurhashDataUrl(hash)).toBe(first);
    expect(decodeCounter.calls).toBe(before + 1);
  });

  it("空值与非法 base64 返回 null 而不抛错", () => {
    expect(blurhashDataUrl(null)).toBeNull();
    expect(blurhashDataUrl("")).toBeNull();
    expect(blurhashDataUrl("!!!not-base64!!!")).toBeNull();
  });

  it("超过 LRU 上限后淘汰最旧条目，再访问会重新解码", () => {
    // 用独立前缀灌入 513 条，挤掉此前所有条目以及最早灌入的 lru-0
    const fill = (index: number) => btoa(`lru-${index}`);
    const before = decodeCounter.calls;
    for (let index = 0; index < 513; index += 1) {
      blurhashDataUrl(fill(index));
    }
    expect(decodeCounter.calls).toBe(before + 513);

    // lru-0 已被挤出，重新访问会解码一次
    blurhashDataUrl(fill(0));
    expect(decodeCounter.calls).toBe(before + 513 + 1);

    // 刚访问过的条目处于“最近使用”位，重复命中不再解码
    blurhashDataUrl(fill(0));
    expect(decodeCounter.calls).toBe(before + 513 + 1);
  });
});
