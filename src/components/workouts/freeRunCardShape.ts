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
  return { outlinePath: outlinePath(seed), badgePath: badgePath(seed) };
}

function outlinePath(seed: number): string {
  const random = seededRandom(seed);
  return [
    `M ${vary(random, 29, 3)} ${vary(random, 14, 3)}`,
    `C ${vary(random, 176, 5)} ${vary(random, 8, 4)}, ${vary(random, 338, 5)} ${vary(random, 20, 4)}, ${vary(random, 505, 5)} ${vary(random, 12, 4)}`,
    `C ${vary(random, 676, 5)} ${vary(random, 5, 3)}, ${vary(random, 837, 5)} ${vary(random, 20, 4)}, ${vary(random, 970, 3)} ${vary(random, 14, 3)}`,
    `Q ${vary(random, 993, 2)} ${vary(random, 16, 3)}, ${vary(random, 994, 2)} ${vary(random, 55, 5)}`,
    `C ${vary(random, 998, 2)} ${vary(random, 280, 15)}, ${vary(random, 991, 2)} ${vary(random, 650, 15)}, ${vary(random, 995, 2)} ${vary(random, 945, 8)}`,
    `Q ${vary(random, 994, 2)} ${vary(random, 986, 4)}, ${vary(random, 965, 3)} ${vary(random, 986, 4)}`,
    `C ${vary(random, 786, 5)} ${vary(random, 996, 3)}, ${vary(random, 611, 5)} ${vary(random, 975, 4)}, ${vary(random, 431, 5)} ${vary(random, 990, 4)}`,
    `C ${vary(random, 256, 5)} ${vary(random, 998, 3)}, ${vary(random, 118, 5)} ${vary(random, 978, 4)}, ${vary(random, 32, 3)} ${vary(random, 990, 4)}`,
    `Q ${vary(random, 6, 2)} ${vary(random, 986, 4)}, ${vary(random, 7, 2)} ${vary(random, 945, 8)}`,
    `C ${vary(random, 3, 2)} ${vary(random, 700, 15)}, ${vary(random, 10, 2)} ${vary(random, 300, 15)}, ${vary(random, 7, 2)} ${vary(random, 55, 5)}`,
    `Q ${vary(random, 7, 2)} ${vary(random, 18, 3)}, ${vary(random, 29, 3)} ${vary(random, 14, 3)} Z`,
  ].join(" ");
}

function badgePath(seed: number): string {
  const badgeRandom = seededRandom(seed ^ 0x9e3779b9);
  return [
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
}
