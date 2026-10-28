import { readFileSync } from "node:fs";
const rows = (f) =>
  readFileSync(new URL(`./.cache/${f}`, import.meta.url), "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.trim().split("\t"));
const parts = rows("isa-parts.txt"),
  relations = rows("isa-relations.txt"),
  elements = rows("isa-elements.txt");
const children = new Map();
for (const [parent, , child] of relations)
  children.set(parent, [...(children.get(parent) ?? []), child]);
const descend = (id) => [id, ...(children.get(id) ?? []).flatMap(descend)];
for (const root of process.argv.slice(2)) {
  const ids = new Set(descend(root));
  process.stdout.write(`ROOT ${root}\n`);
  for (const [id, , name] of parts.filter(([id]) => ids.has(id))) {
    const files = [
      ...new Set(elements.filter(([i]) => i === id).map(([, , f]) => f)),
    ];
    process.stdout.write(`${id} | ${name} | ${files.join(",")}\n`);
  }
}
