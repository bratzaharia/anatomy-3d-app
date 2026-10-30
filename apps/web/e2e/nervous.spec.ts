import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
// The GLB validator generates these expectations. Read JSON without importing
// the application's bundler-only JSON module graph into Playwright's Node ESM.
const coverage = JSON.parse(
  readFileSync(
    new URL(
      "../../../docs/assets/NERVOUS_GEOMETRY_COVERAGE.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const nervousCalls = coverage.renderedEntities + 1;
const nervousTriangles = coverage.renderedTriangles + 2;

test("independent nervous geometry: picking, focus, facet composition, isolation, locale and cache", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [],
    requests = { bones: 0, muscles: 0, nerves: 0 };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error") errors.push(entry.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (url.endsWith("bodyparts3d-skeleton.glb")) requests.bones++;
    if (url.endsWith("bodyparts3d-muscles.glb")) requests.muscles++;
    if (
      url.endsWith("bodyparts3d-nervous.glb") ||
      /z-nervous-.*\.glb$/.test(url)
    )
      requests.nerves++;
  });
  await page.goto("/?diagnostics");
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  expect(requests.nerves).toBe(0);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  const nervousStart = Date.now();
  await page.getByLabel("Nervous system", { exact: true }).check();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect.poll(async () => (await metrics()).calls).toBe(nervousCalls);
  await expect
    .poll(async () => (await metrics()).triangles)
    .toBe(nervousTriangles);
  process.stdout.write(
    JSON.stringify({
      nervousEnableToRenderedMs: Date.now() - nervousStart,
      nervousMetrics: await metrics(),
    }) + "\n",
  );
  await page
    .getByRole("button", { name: "Select available brain parts", exact: true })
    .click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await expect
    .poll(async () => (await metrics()).camera?.[1] ?? 0)
    .toBeGreaterThan(1.4);
  const focusedCalls = (await metrics()).calls;
  const bounds = await canvas.boundingBox();
  if (!bounds) throw Error("No nervous canvas");
  const point = { x: bounds.width * 0.58, y: bounds.height * 0.4 };
  await canvas.hover({ position: point });
  await expect(page.locator(".hover-label strong")).toBeVisible();
  const picked = await page.locator(".hover-label strong").innerText();
  await canvas.click({ position: point });
  await expect(page.locator(".inspector-header h2")).toHaveText(picked);
  const camera = (await metrics()).camera;
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect.poll(async () => (await metrics()).camera).toEqual(camera);
  await page.getByRole("button", { name: "Izolează", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(2);
  await page.getByRole("button", { name: "Ascunde", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await canvas.click({ position: point });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  await page
    .getByRole("button", { name: "Restaurează vizibilitatea", exact: true })
    .last()
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(focusedCalls);
  await page
    .getByLabel("Sistem nervos central (SNC)", { exact: true })
    .uncheck();
  await expect
    .poll(async () => (await metrics()).calls)
    .toBeLessThan(focusedCalls);
  await page
    .getByLabel("Sistem nervos periferic (SNP)", { exact: true })
    .uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await page
    .getByRole("button", {
      name: "Toate structurile nervoase disponibile",
      exact: true,
    })
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(focusedCalls);
  for (let i = 0; i < 3; i++) {
    await page.getByLabel("Sistem nervos", { exact: true }).uncheck();
    await expect.poll(async () => (await metrics()).calls).toBe(1);
    await page.getByLabel("Sistem nervos", { exact: true }).check();
    await expect.poll(async () => (await metrics()).calls).toBe(focusedCalls);
  }
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page
    .getByRole("button", { name: "Select available brain parts", exact: true })
    .click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await page.getByRole("button", { name: "EN", exact: true }).hover();
  await expect(canvas).toHaveScreenshot("nervous-brain.png", {
    stylePath: fileURLToPath(
      new URL("./anatomy-screenshot.css", import.meta.url),
    ),
  });
  await page.waitForTimeout(300);
  const idle = (await metrics()).frames;
  await page.waitForTimeout(500);
  expect((await metrics()).frames).toBe(idle);
  expect(requests).toEqual({ bones: 1, muscles: 0, nerves: 5 });
  expect(errors).toEqual([]);
});

test("all eight skeletal/muscular/nervous combinations preserve cached geometry and the skeleton image", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  const canvas = page.locator("canvas"),
    metrics = async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  const camera = (await metrics()).camera;
  // Hide overlay descendants explicitly too: the composited SVG reset icon
  // can otherwise survive one screenshot after its parent visibility changes.
  const screenshotStyle =
    readFileSync(
      fileURLToPath(new URL("./anatomy-screenshot.css", import.meta.url)),
      "utf8",
    ) +
    "\n.view-controls *, .nervous-load-status { visibility: hidden !important; }";
  const style = await page.addStyleTag({
    content: screenshotStyle,
  });
  const before = await canvas.screenshot();
  await style.evaluate((element) => element.remove());
  for (const mask of [0, 1, 2, 3, 4, 5, 6, 7]) {
    for (const [bit, label] of [
      "Skeletal system",
      "Muscular system",
      "Nervous system",
    ].entries())
      await page
        .getByLabel(label, { exact: true })
        .setChecked(!!(mask & (1 << bit)));
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect
      .poll(async () => (await metrics()).calls)
      .toBe(
        1 +
          (mask & 1 ? 49 : 0) +
          (mask & 2 ? 355 : 0) +
          (mask & 4 ? nervousCalls - 1 : 0),
      );
    await expect
      .poll(async () => (await metrics()).triangles)
      .toBe(
        2 +
          (mask & 1 ? 513164 : 0) +
          (mask & 2 ? 2387524 : 0) +
          (mask & 4 ? nervousTriangles - 2 : 0),
      );
    // Veins remain off: three enabled systems are no longer every layer.
    await expect(
      page.getByLabel("All layers", { exact: true }),
    ).not.toBeChecked();
    expect((await metrics()).camera).toEqual(camera);
  }
  const afterAll = await metrics();
  for (const label of ["Skeletal system", "Muscular system", "Nervous system"])
    await page.getByLabel(label, { exact: true }).uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  for (const label of ["Skeletal system", "Muscular system", "Nervous system"])
    await page.getByLabel(label, { exact: true }).check();
  await expect
    .poll(async () => (await metrics()).calls)
    .toBe(nervousCalls + 404);
  await test.info().attach("all-layer-metrics.json", {
    body: JSON.stringify(afterAll, null, 2),
    contentType: "application/json",
  });
  process.stdout.write(JSON.stringify({ allLayerMetrics: afterAll }) + "\n");
  await page.getByLabel("Muscular system", { exact: true }).uncheck();
  await page.getByLabel("Nervous system", { exact: true }).uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await page.addStyleTag({
    content: screenshotStyle,
  });
  const restoredImage = await canvas.screenshot();
  expect(
    restoredImage.equals(before),
    "Skeleton image must be byte-identical after layer toggles",
  ).toBe(true);
  await page.getByLabel("Muscular system", { exact: true }).check();
  await page.getByLabel("Nervous system", { exact: true }).check();
  await expect
    .poll(async () => (await metrics()).calls)
    .toBe(nervousCalls + 404);
  await page.waitForTimeout(300);
  const idleStart = await metrics();
  await page.waitForTimeout(1000);
  expect((await metrics()).frames).toBe(idleStart.frames);
  const box = await canvas.boundingBox();
  if (!box) throw Error("Missing canvas");
  const start = Date.now(),
    frameStart = (await metrics()).frames;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, {
    steps: 5,
  });
  await page.mouse.up();
  const duration = Date.now() - start,
    final = await metrics();
  process.stdout.write(
    JSON.stringify({
      allLayersOrbit: {
        durationMs: duration,
        frames: final.frames - frameStart,
        renderedFps: (1000 * (final.frames - frameStart)) / duration,
        metrics: final,
      },
    }) + "\n",
  );
});

test("nervous failure/retry is isolated and unavailable spinal entries cannot masquerade as geometry", async ({
  page,
}) => {
  await page.route("**/models/bodyparts3d-nervous.glb", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByLabel("Sistem nervos", { exact: true }).check();
  await expect(page.getByRole("alert")).toContainText(
    "Oasele și mușchii rămân disponibili",
  );
  await page.unroute("**/models/bodyparts3d-nervous.glb");
  await page.getByRole("button", { name: "Reîncearcă", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByLabel("Caută o structură").fill("măduvă spinală");
  await page
    .locator(".search-results button")
    .filter({ hasText: "Măduvă spinală" })
    .click();
  await expect(page.getByText(/Geometrie în carantină/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Focalizează", exact: true }),
  ).toBeDisabled();
});

test("show nervous layer reveals full-body geometry and restores previous layers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await page.getByLabel("Sistem nervos", { exact: true }).check();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect
    .poll(async () => (await metrics()).calls)
    .toBe(nervousCalls + 49);
  const camera = (await metrics()).camera;
  await page
    .getByRole("button", { name: "Vezi stratul nervos", exact: true })
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(nervousCalls);
  await expect.poll(async () => (await metrics()).camera).toEqual(camera);
  await expect(page.getByLabel("Sistem osos", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Sistem nervos", { exact: true })).toBeChecked();
  await expect(
    page.getByRole("heading", {
      name: "—",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Revino la straturile anterioare",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => (await metrics()).calls)
    .toBe(nervousCalls + 49);
  await expect(
    page.getByRole("button", { name: "Vezi stratul nervos", exact: true }),
  ).toBeVisible();
});

test("skull modes remain independent with bones and nerves simultaneously active", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  const canvas = page.locator("canvas"),
    metrics = async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByLabel("Sistem nervos", { exact: true }).check();
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  await expect
    .poll(async () => (await metrics()).camera?.[1] ?? 0)
    .toBeGreaterThan(1.4);
  const camera = (await metrics()).camera;
  const baseline = await metrics();
  for (const mode of ["Colorat", "Radiografie", "Simplu"]) {
    await page.getByRole("radio", { name: mode, exact: true }).press("Space");
    await expect.poll(async () => (await metrics()).calls).toBe(baseline.calls);
    await expect
      .poll(async () => (await metrics()).triangles)
      .toBe(baseline.triangles);
    expect((await metrics()).camera).toEqual(camera);
    await expect(
      page.getByLabel("Sistem nervos", { exact: true }),
    ).toBeChecked();
    await expect(page.getByLabel("Sistem osos", { exact: true })).toBeChecked();
  }
});
