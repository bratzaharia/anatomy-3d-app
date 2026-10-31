import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const manifest = JSON.parse(
  readFileSync(
    new URL(
      "../../../packages/anatomy-data/src/arterial-manifest.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const metrics = async (page: Page) =>
  JSON.parse(
    (await page.locator("canvas").getAttribute("data-anatomy-metrics")) ?? "{}",
  );
async function start(page: Page) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Arterial system", { exact: true }).check();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  await expect.poll(async () => (await metrics(page)).calls).toBe(56);
}
test("real arterial source is lazy, reversible, traces left cerebral origin and excludes hidden/zero-opacity picks", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (/bodyparts3d-(arterial|heart-arterial).*\.glb/.test(r.url()))
      requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?diagnostics");
  await expect.poll(async () => (await metrics(page)).calls).toBe(50);
  expect(requests).toHaveLength(0);
  const began = Date.now();
  await start(page);
  const majorLoadMs = Date.now() - began;
  expect(requests).toHaveLength(2);
  expect(requests.some((url) => url.includes("arterial-cerebral"))).toBe(false);
  const panel = page.locator(".arterial-explorer"),
    canvas = page.locator("canvas");
  await expect(panel.locator(".arterial-status")).toHaveText(
    "Arterial source geometry ready",
  );
  await panel.locator('[data-arterial-group="cerebral"] > summary').click();
  await panel.locator('[data-arterial-id="arterial-fma50367"]').click();
  await panel
    .getByRole("button", { name: "Focus selection", exact: true })
    .click();
  await expect
    .poll(async () => (await metrics(page)).camera?.[1] ?? 0)
    .toBeGreaterThan(1);
  const before = await metrics(page);
  const natural = await canvas.screenshot();
  await panel.getByRole("radio", { name: "Anatomical", exact: true }).check();
  await panel.getByRole("radio", { name: "Natural", exact: true }).check();
  expect((await canvas.screenshot()).equals(natural)).toBe(true);
  expect((await metrics(page)).camera).toEqual(before.camera);
  await panel.getByRole("radio", { name: "Pathways", exact: true }).check();
  await panel
    .getByRole("button", { name: "Trace to origin", exact: true })
    .click();
  await expect(panel.locator(".arterial-pathways ol")).toContainText(
    "Ascending aorta",
  );
  await expect(panel.locator(".arterial-pathways ol")).toContainText(
    "left common carotid artery",
  );
  await expect(panel.locator(".arterial-pathways")).toContainText(
    "no validated atlas-to-brain registration",
  );
  await page.screenshot({
    path: info.outputPath("arterial-left-cerebral-trace.png"),
  });
  await panel
    .getByRole("button", { name: "Restore exploration", exact: true })
    .click();
  // Thin MCA is selected through its canonical list entry above. Exercise mesh
  // picking on the larger shared aorta, not a fragile sparse pixel grid on M1.
  await panel.locator('[data-arterial-group="aorta"] > summary').click();
  await panel.locator('[data-arterial-id="cardiac-fma3736"]').click();
  await panel
    .getByRole("button", { name: "Focus selection", exact: true })
    .click();
  await expect
    .poll(async () => (await metrics(page)).camera?.[1] ?? 0)
    .toBeLessThan(1.4);
  await panel
    .getByRole("button", { name: "Isolate selection", exact: true })
    .click();
  await expect.poll(async () => (await metrics(page)).calls).toBe(2);
  const box = await canvas.boundingBox();
  if (!box) throw Error("No canvas");
  let point: { x: number; y: number } | undefined;
  for (const x of [0.4, 0.5, 0.6]) {
    for (const y of [0.4, 0.5, 0.6]) {
      await canvas.hover({ position: { x: box.width * x, y: box.height * y } });
      if (await page.locator(".hover-label strong").isVisible()) {
        point = { x: box.width * x, y: box.height * y };
        break;
      }
    }
    if (point) break;
  }
  expect(point).toBeTruthy();
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toContainText(
    "Ascending aorta",
  );
  await panel
    .getByRole("slider", { name: "Arterial opacity", exact: true })
    .press("Home");
  await expect.poll(async () => (await metrics(page)).calls).toBe(1);
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  await expect(page.locator(".hover-label")).toHaveCount(0);
  await panel
    .getByRole("slider", { name: "Arterial opacity", exact: true })
    .press("End");
  await panel
    .getByRole("button", { name: "Restore exploration", exact: true })
    .click();
  await page.getByRole("button", { name: "Fit body", exact: true }).click();
  await expect.poll(async () => (await metrics(page)).calls).toBe(56);
  const frames = (await metrics(page)).frames;
  await page.waitForTimeout(1000);
  expect((await metrics(page)).frames).toBe(frames);
  expect(new Set(requests).size).toBe(2);
  expect(errors).toEqual([]);
  process.stdout.write(
    JSON.stringify({
      arterialMajorLoadMs: majorLoadMs,
      ...(await metrics(page)),
    }) + "\n",
  );
});
test("all 32 primary layer combinations keep source geometry counts additive", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await start(page);
  const labels = [
      "Skeletal system",
      "Muscular system",
      "Nervous system",
      "Venous system",
      "Arterial system",
    ],
    calls = [49, 355, 302, 132, 55],
    triangles = [513164, 2387524, 1492108, 667750, 177590];
  for (const name of labels)
    await page.getByLabel(name, { exact: true }).check();
  await expect
    .poll(async () => (await metrics(page)).calls, { timeout: 60000 })
    .toBe(894);
  for (let mask = 0; mask < 32; mask++) {
    for (let i = 0; i < labels.length; i++)
      await page
        .getByLabel(labels[i]!, { exact: true })
        .setChecked(Boolean(mask & (1 << i)));
    const expectedCalls =
        1 + calls.reduce((n, c, i) => n + (mask & (1 << i) ? c : 0), 0),
      expectedTriangles =
        2 + triangles.reduce((n, c, i) => n + (mask & (1 << i) ? c : 0), 0);
    await expect
      .poll(async () => (await metrics(page)).calls)
      .toBe(expectedCalls);
    await expect
      .poll(async () => (await metrics(page)).triangles)
      .toBe(expectedTriangles);
  }
  await page.screenshot({
    path: info.outputPath("all-five-anatomical-layers.png"),
  });
});
test("regional detail uses genuine source surfaces and shared cardiac arteries render only once", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await start(page);
  const panel = page.locator(".arterial-explorer");
  await panel.getByLabel("Named branches", { exact: true }).check();
  await panel
    .getByLabel("Fine branches / source sets", { exact: true })
    .check();
  await expect.poll(async () => (await metrics(page)).calls).toBe(220);
  await expect.poll(async () => (await metrics(page)).triangles).toBe(540616);
  // Select canonical ascending aorta through the arterial UI to expose the organ.
  await panel.locator('[data-arterial-group="aorta"] > summary').click();
  await panel.locator('[data-arterial-id="cardiac-fma3736"]').click();
  await page.getByLabel("Show heart", { exact: true }).check();
  await expect.poll(async () => (await metrics(page)).calls).toBe(223);
  const heart = page.locator(".cardiac-explorer");
  for (const g of ["coronary-arteries", "great-arteries"]) {
    const tree = heart.locator(`[data-cardiac-group="${g}"]`);
    await tree.locator("summary").click();
    await tree.getByRole("checkbox", { name: /^Visible category:/ }).check();
  }
  await expect.poll(async () => (await metrics(page)).calls).toBe(223);
  await page.screenshot({
    path: info.outputPath("arterial-heart-shared-whole-body.png"),
  });
  await page.getByLabel("Arterial system", { exact: true }).uncheck();
  await expect.poll(async () => (await metrics(page)).calls).toBe(11);
  await page.getByLabel("Arterial system", { exact: true }).check();
  await expect.poll(async () => (await metrics(page)).calls).toBe(223);
  process.stdout.write(
    JSON.stringify({
      arterialFullAndHeart: await metrics(page),
      newGeometryBytes: manifest.assets.reduce(
        (n: number, a: { byteLength: number }) => n + a.byteLength,
        0,
      ),
    }) + "\n",
  );
});
test("arterial load failure is localized, retryable and leaves the skeleton intact", async ({
  page,
}) => {
  await page.route("**/models/bodyparts3d-arterial-major.glb", (r) =>
    r.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Arterial system", { exact: true }).check();
  const panel = page.locator(".arterial-explorer");
  await expect(panel.locator('[role="alert"]')).toContainText(
    "Arterial asset failed",
  );
  await expect.poll(async () => (await metrics(page)).calls).toBe(57);
  await page.unroute("**/models/bodyparts3d-arterial-major.glb");
  await panel.getByRole("button", { name: "Retry arterial assets" }).click();
  await expect(panel.locator(".arterial-status")).toHaveText(
    "Arterial source geometry ready",
  );
  await expect.poll(async () => (await metrics(page)).calls).toBe(105);
});
test("mobile arterial controls localize without viewport overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Deschide sau închide navigarea" })
    .click();
  await page.getByLabel("Sistem arterial", { exact: true }).check();
  await page
    .getByRole("button", { name: "Deschide sau închide navigarea" })
    .click();
  await page
    .getByRole("button", { name: "Deschide sau închide inspectorul" })
    .click();
  await expect(page.locator(".arterial-explorer")).toBeVisible();
  await expect(page.locator(".arterial-mode")).toHaveCount(3);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
