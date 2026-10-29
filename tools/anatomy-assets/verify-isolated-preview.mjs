// Baseline smoke check only; never extracts or imports proprietary models.
import { chromium, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = new URL("../../", import.meta.url);
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: root,
  encoding: "utf8",
}).trim();
if (branch !== "codex/licensed-asset-preview")
  throw Error("Run only on the isolated evaluation branch");
const path = fileURLToPath(root);
const worktrees = execFileSync("git", ["worktree", "list", "--porcelain"], {
  cwd: root,
  encoding: "utf8",
});
const primary = worktrees
  .split("\n")
  .find((line) => line.startsWith("worktree "))
  ?.slice(9);
if (!primary || realpathSync(primary) === realpathSync(path))
  throw Error("Evaluation must use a linked worktree, not the main checkout");
for (const name of ["core", "data"])
  if (
    realpathSync(new URL(`apps/web/node_modules/@anatomy/${name}`, root)) !==
    realpathSync(new URL(`packages/anatomy-${name}`, root))
  )
    throw Error("Workspace dependency points outside evaluation copy");
const origin = "http://127.0.0.1:5180";
const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  const errors = [],
    external = new Set(),
    assets = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== origin)
      external.add(url.origin);
    if (decodeURIComponent(url.pathname).includes(primary))
      errors.push("Request references main checkout: " + url.pathname);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.endsWith(".glb"))
      assets.push({
        path: url.pathname,
        status: response.status(),
        origin: url.origin,
      });
    if (response.status() >= 400)
      errors.push(`${response.status()} ${url.pathname}`);
  });
  await page.goto(origin + "/?diagnostics");
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect
    .poll(async () => (await metrics()).calls, { timeout: 30000 })
    .toBe(50);
  await expect(page.getByRole("status")).toHaveCount(0);
  const baseline = await metrics();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByPlaceholder("E.g. humerus, skull…").fill("Left scaphoid");
  await page.getByRole("button", { name: /^Left scaphoid/ }).click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  const layout = JSON.parse(
    await readFile(
      new URL("packages/anatomy-data/src/skeletal-parts.json", root),
      "utf8",
    ),
  );
  const part = layout.parents
    .flatMap((p) => p.parts)
    .find((p) => p.id === "bone-fma24436");
  await expect.poll(async () => (await metrics()).calls).toBe(2);
  await expect
    .poll(async () => (await metrics()).triangles)
    .toBe(part.indexCount / 3 + 2);
  const bounds = await canvas.boundingBox();
  if (!bounds) throw Error("No rendered canvas");
  await canvas.hover({
    position: { x: bounds.width / 2, y: bounds.height / 2 },
  });
  await expect(page.locator(".hover-label strong")).toHaveText("Left scaphoid");
  await mkdir(new URL(".private-asset-evaluation/", root), { recursive: true });
  await page.screenshot({
    path: fileURLToPath(
      new URL(".private-asset-evaluation/baseline-scaphoid.png", root),
    ),
  });
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Fit body", exact: true }).click();
  await page.getByRole("button", { name: "EN", exact: true }).hover();
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  expect((await metrics()).geometries).toBe(baseline.geometries);
  expect(errors).toEqual([]);
  expect([...external]).toEqual([]);
  expect(assets).toEqual([
    { path: "/models/bodyparts3d-skeleton.glb", status: 200, origin },
  ]);
  process.stdout.write(
    JSON.stringify({
      origin,
      branch,
      source: "Existing BodyParts3D only; no Catfish asset",
      assets,
      baseline: {
        calls: baseline.calls,
        triangles: baseline.triangles,
        geometries: baseline.geometries,
      },
      pickingAndHiddenGeometry: "passed",
      externalOrigins: [...external],
      errors,
      linkedWorktreeAndLocalDependencies: true,
    }) + "\n",
  );
} finally {
  await browser.close();
}
