export type FreeRunCardShape = Readonly<{
  outlinePath: string;
  badgePath: string;
}>;

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function pathNumber(value: number): string {
  return value.toFixed(1).replace(".0", "");
}

function vary(random: () => number, value: number, amount: number): string {
  return pathNumber(value + (random() * 2 - 1) * amount);
}

export function freeRunShapeSeed(workoutId: string): number {
  return stableHash(workoutId);
}

export function freeRunCardShape(seed: number): FreeRunCardShape {
  const outlineRandom = seededRandom(seed);
  const badgeRandom = seededRandom(seed ^ 0x9e3779b9);

  const outlinePath = [
    `M ${vary(outlineRandom, 29, 3)} ${vary(outlineRandom, 7, 2)}`,
    `C ${vary(outlineRandom, 176, 5)} ${vary(outlineRandom, 4, 2.5)}, ${vary(outlineRandom, 338, 5)} ${vary(outlineRandom, 10, 2.5)}, ${vary(outlineRandom, 505, 5)} ${vary(outlineRandom, 6, 2.5)}`,
    `C ${vary(outlineRandom, 676, 5)} ${vary(outlineRandom, 2, 2)}, ${vary(outlineRandom, 837, 5)} ${vary(outlineRandom, 10, 2.5)}, ${vary(outlineRandom, 970, 3)} ${vary(outlineRandom, 7, 2)}`,
    `Q ${vary(outlineRandom, 993, 2)} ${vary(outlineRandom, 8, 2)}, ${vary(outlineRandom, 994, 2)} ${vary(outlineRandom, 31, 3)}`,
    `C ${vary(outlineRandom, 998, 2)} ${vary(outlineRandom, 73, 4)}, ${vary(outlineRandom, 991, 2)} ${vary(outlineRandom, 119, 4)}, ${vary(outlineRandom, 995, 2)} ${vary(outlineRandom, 168, 3)}`,
    `Q ${vary(outlineRandom, 994, 2)} ${vary(outlineRandom, 194, 2)}, ${vary(outlineRandom, 965, 3)} ${vary(outlineRandom, 194, 2)}`,
    `C ${vary(outlineRandom, 786, 5)} ${vary(outlineRandom, 198, 2)}, ${vary(outlineRandom, 611, 5)} ${vary(outlineRandom, 190, 2.5)}, ${vary(outlineRandom, 431, 5)} ${vary(outlineRandom, 195, 2.5)}`,
    `C ${vary(outlineRandom, 256, 5)} ${vary(outlineRandom, 199, 2)}, ${vary(outlineRandom, 118, 5)} ${vary(outlineRandom, 191, 2.5)}, ${vary(outlineRandom, 32, 3)} ${vary(outlineRandom, 195, 2)}`,
    `Q ${vary(outlineRandom, 6, 2)} ${vary(outlineRandom, 194, 2)}, ${vary(outlineRandom, 7, 2)} ${vary(outlineRandom, 168, 3)}`,
    `C ${vary(outlineRandom, 3, 2)} ${vary(outlineRandom, 121, 4)}, ${vary(outlineRandom, 10, 2)} ${vary(outlineRandom, 72, 4)}, ${vary(outlineRandom, 7, 2)} ${vary(outlineRandom, 32, 3)}`,
    `Q ${vary(outlineRandom, 7, 2)} ${vary(outlineRandom, 9, 2)}, ${vary(outlineRandom, 29, 3)} ${vary(outlineRandom, 7, 2)} Z`,
  ].join(" ");

  const badgePath = [
    `M ${vary(badgeRandom, 15, 2)} ${vary(badgeRandom, 5, 1.5)}`,
    `C ${vary(badgeRandom, 71, 3)} ${vary(badgeRandom, 1, 1.5)}, ${vary(badgeRandom, 126, 3)} ${vary(badgeRandom, 7, 1.5)}, ${vary(badgeRandom, 181, 3)} ${vary(badgeRandom, 4, 1.5)}`,
    `C ${vary(badgeRandom, 229, 3)} ${vary(badgeRandom, 2, 1.5)}, ${vary(badgeRandom, 268, 2)} ${vary(badgeRandom, 5, 1.5)}, ${vary(badgeRandom, 285, 2)} ${vary(badgeRandom, 8, 1.5)}`,
    `Q ${vary(badgeRandom, 297, 1.5)} ${vary(badgeRandom, 13, 1.5)}, ${vary(badgeRandom, 296, 1.5)} ${vary(badgeRandom, 29, 2)}`,
    `C ${vary(badgeRandom, 294, 1.5)} ${vary(badgeRandom, 43, 2)}, ${vary(badgeRandom, 299, 1.5)} ${vary(badgeRandom, 56, 2)}, ${vary(badgeRandom, 286, 2)} ${vary(badgeRandom, 64, 1.5)}`,
    `C ${vary(badgeRandom, 231, 3)} ${vary(badgeRandom, 70, 1.5)}, ${vary(badgeRandom, 177, 3)} ${vary(badgeRandom, 65, 1.5)}, ${vary(badgeRandom, 121, 3)} ${vary(badgeRandom, 68, 1.5)}`,
    `C ${vary(badgeRandom, 75, 3)} ${vary(badgeRandom, 70, 1.5)}, ${vary(badgeRandom, 37, 2)} ${vary(badgeRandom, 65, 1.5)}, ${vary(badgeRandom, 15, 2)} ${vary(badgeRandom, 66, 1.5)}`,
    `Q ${vary(badgeRandom, 3, 1.5)} ${vary(badgeRandom, 60, 2)}, ${vary(badgeRandom, 5, 1.5)} ${vary(badgeRandom, 45, 2)}`,
    `C ${vary(badgeRandom, 7, 1.5)} ${vary(badgeRandom, 31, 2)}, ${vary(badgeRandom, 2, 1.5)} ${vary(badgeRandom, 16, 2)}, ${vary(badgeRandom, 15, 2)} ${vary(badgeRandom, 5, 1.5)} Z`,
  ].join(" ");

  return { outlinePath, badgePath };
}
