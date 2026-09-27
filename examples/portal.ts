// A small field test for comments, types, strings, and semantic highlighting.
interface Destination {
  dimension: string;
  population: number;
  safe: boolean;
}

const home: Destination = {
  dimension: "C-137",
  population: 7_000_000_000,
  safe: true,
};

export function openPortal(destination: Destination): string {
  const { dimension, population, safe } = destination;

  if (!safe || population === 0) {
    throw new Error(`No safe landing in ${dimension}.`);
  }

  return `Welcome to ${dimension}. Mind the timelines.`;
}

console.log(openPortal(home));
