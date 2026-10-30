import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const manifest = JSON.parse(
  readFileSync(
    new URL(
      "../../../packages/anatomy-data/src/venous-manifest.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const entityCount = manifest.inventory.filter(
  (s: { assetId: string | null }) => s.assetId,
).length;
const triangleCount = manifest.assets.reduce(
  (n: number, a: { triangleCount: number }) => n + a.triangleCount,
  0,
);
test("venous source layer: lazy regions, picking, filters, trace restoration, opacity and idle rendering", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("bodyparts3d-venous-")) requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?diagnostics");
  const canvas = page.locator("canvas"),
    metrics = async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  const start = Date.now();
  await page.getByLabel("Venous system", { exact: true }).check();
  await expect
    .poll(async () => (await metrics()).calls, { timeout: 30000 })
    .toBe(entityCount + 1);
  await expect
    .poll(async () => (await metrics()).triangles)
    .toBe(triangleCount + 2);
  await expect(page.locator('.venous-load-status[role="status"]')).toHaveCount(
    0,
  );
  const baseline = await metrics(),
    loadMs = Date.now() - start;
  expect(new Set(requests).size).toBe(6);
  await page.screenshot({ path: info.outputPath("venous-whole-body.png") });
  await page
    .getByPlaceholder("E.g. humerus, skull…")
    .fill("Superior vena cava");
  await page
    .getByRole("button", { name: /^Superior vena cava/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(2);
  let point: { x: number; y: number } | undefined;
  const box = await canvas.boundingBox();
  if (!box) throw Error("Canvas missing");
  for (const dx of [0.5, 0.45, 0.55, 0.4, 0.6, 0.35, 0.65]) {
    for (const dy of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
      await canvas.hover({
        position: { x: box.width * dx, y: box.height * dy },
      });
      if (await page.locator(".hover-label strong").isVisible()) {
        point = { x: box.width * dx, y: box.height * dy };
        break;
      }
    }
    if (point) break;
  }
  expect(point).toBeTruthy();
  await expect(page.locator(".hover-label strong")).toHaveText(
    "Superior vena cava",
  );
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toHaveText(
    "Superior vena cava",
  );
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  // Pick a vessel semantically while hidden; tracing temporarily restores only
  // the selected reference pathway, then restores exact prior overrides.
  await page
    .getByPlaceholder("E.g. humerus, skull…")
    .fill("Hepatic portal vein");
  await page
    .getByRole("button", { name: /^Hepatic portal vein/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Trace reference drainage", exact: true })
    .click();
  await expect(
    page.locator(".venous-details li").filter({
      hasText: "Hepatic microcirculation (concept only)",
    }),
  ).toBeVisible();
  await expect.poll(async () => (await metrics()).calls).toBe(6);
  await page
    .getByRole("button", { name: "Restore previous context", exact: true })
    .last()
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await expect.poll(async () => (await metrics()).calls).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Fit body", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(entityCount + 1);
  await page.getByRole("slider", { name: "Venous layer opacity" }).fill("0");
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await page.getByRole("slider", { name: "Venous layer opacity" }).fill("1");
  await expect.poll(async () => (await metrics()).calls).toBe(entityCount + 1);
  await page.getByRole("radio", { name: "Blue", exact: true }).click();
  await page
    .getByText("Superficial / deep classification", { exact: true })
    .click();
  await page.getByLabel("Superficial", { exact: true }).check();
  await expect
    .poll(async () => (await metrics()).calls)
    .toBeLessThan(entityCount + 1);
  const all = page.getByLabel("All veins", { exact: true });
  await all.uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await all.check();
  await expect.poll(async () => (await metrics()).calls).toBe(entityCount + 1);
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect(
    page.getByText("Stratul 04 — Sistem venos", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "EN", exact: true }).hover();
  await page.waitForTimeout(350);
  const idle = (await metrics()).frames;
  await page.waitForTimeout(500);
  expect((await metrics()).frames).toBe(idle);
  expect((await metrics()).geometries).toBeLessThanOrEqual(
    baseline.geometries + 1,
  );
  expect(errors).toEqual([]);
  await info.attach("venous-performance", {
    body: JSON.stringify({
      loadMs,
      metrics: baseline,
      after: await metrics(),
      assetRequests: requests.length,
    }),
    contentType: "application/json",
  });
  process.stdout.write(
    JSON.stringify({
      venousLoadMs: loadMs,
      venousMetrics: baseline,
      venousFinal: await metrics(),
      requests: requests.length,
    }) + "\n",
  );
});

test("all 16 global layer combinations preserve existing geometry", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  const canvas = page.locator("canvas"),
    metrics = async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  const systems = [
      "Skeletal system",
      "Muscular system",
      "Nervous system",
      "Venous system",
    ],
    triangles = [513164, 2387524, 1492108, triangleCount];
  for (let mask = 0; mask < 16; mask++) {
    for (let i = 0; i < 4; i++)
      await page
        .getByLabel(systems[i]!, { exact: true })
        .setChecked(Boolean(mask & (1 << i)));
    const expected = triangles.reduce(
      (n, t, i) => n + (mask & (1 << i) ? t : 0),
      2,
    );
    await expect
      .poll(async () => (await metrics()).triangles, {
        timeout: 30000,
        message: `layer mask ${mask}`,
      })
      .toBe(expected);
  }
  await page.getByLabel("Muscular system", { exact: true }).uncheck();
  await page.getByLabel("Nervous system", { exact: true }).uncheck();
  await page.getByLabel("Venous system", { exact: true }).uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(50);
});

test("a failed regional GLB is recoverable without breaking bones", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/bodyparts3d-venous-thorax.glb", (route) =>
    fail ? route.abort() : route.continue(),
  );
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Venous system", { exact: true }).check();
  await expect(page.getByRole("alert")).toContainText(
    "A venous region could not load",
  );
  expect(
    await page.getByLabel("Skeletal system", { exact: true }).isChecked(),
  ).toBe(true);
  fail = false;
  await page.locator(".venous-load-status button").click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator('.venous-load-status[role="status"]')).toHaveCount(
    0,
  );
});

test("venous controls remain usable on a narrow mobile viewport", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.locator(".topbar .panel-toggle.left").click();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  await page.getByLabel("Venous system", { exact: true }).check();
  await page.locator(".topbar .panel-toggle.left").click();
  const canvas = page.locator("canvas");
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}")
          .calls,
    )
    .toBe(entityCount + 1);
  await page.locator(".topbar .panel-toggle:not(.left)").click();
  await expect(page.getByLabel("All veins", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Contrast", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Contrast", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    page.getByRole("slider", { name: "Venous layer opacity" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: info.outputPath("venous-mobile-controls.png"),
  });
});
