import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const manifest = JSON.parse(
  readFileSync(
    new URL(
      "../../../packages/anatomy-data/src/heart-manifest.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
async function enable(page: Page) {
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Venous system", { exact: true }).check();
  await page.getByLabel("Show heart", { exact: true }).check();
  await page.getByLabel("Venous system", { exact: true }).uncheck();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
}
test("source heart loads independently, preserves natural materials, picks and excludes hidden/transparent/clipped parts", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const assets: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (/bodyparts3d-heart-.*\.glb/.test(r.url())) assets.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?diagnostics");
  expect(assets).toEqual([]);
  await enable(page);
  const panel = page.locator(".cardiac-explorer"),
    canvas = page.locator("canvas"),
    metrics = async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(4);
  expect(assets).toHaveLength(1);
  expect(assets[0]).toContain("heart-external.glb");
  await expect(panel.locator('p[role="status"]')).toHaveCount(0);
  await panel.getByRole("button", { name: "Focus heart", exact: true }).click();
  await expect
    .poll(async () => (await metrics()).camera?.[1] ?? 0)
    .toBeGreaterThan(1);
  const baseline = await metrics(),
    stylePath = fileURLToPath(
      new URL("./anatomy-screenshot.css", import.meta.url),
    );
  const natural = await canvas.screenshot({ stylePath });
  await page.screenshot({ path: info.outputPath("heart-source-anterior.png") });
  await panel
    .getByRole("radio", { name: "Anatomy colors", exact: true })
    .check();
  await panel.getByRole("radio", { name: "Connections", exact: true }).check();
  await expect(panel.getByText(/not mesh connectivity/)).toBeVisible();
  await panel.getByRole("radio", { name: "Natural", exact: true }).check();
  expect((await canvas.screenshot({ stylePath })).equals(natural)).toBe(true);
  expect((await metrics()).camera).toEqual(baseline.camera);
  expect(assets).toHaveLength(1);
  const box = await canvas.boundingBox();
  if (!box) throw Error("No cardiac canvas");
  let point: { x: number; y: number } | undefined;
  for (const x of [0.5, 0.4, 0.6]) {
    for (const y of [0.5, 0.4, 0.6]) {
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
  await expect(page.locator(".inspector-header h2")).not.toHaveText("—");
  await panel
    .getByRole("button", { name: "Isolate cardiac selection", exact: true })
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(2);
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  await panel
    .getByRole("button", { name: "Restore visibility", exact: true })
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(4);
  const slider = panel.getByRole("slider", {
    name: "Cardiac opacity",
    exact: true,
  });
  await slider.press("Home");
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await slider.press("End");
  await expect.poll(async () => (await metrics()).calls).toBe(4);
  await panel
    .getByLabel("Geometric section — not CT/MRI", { exact: true })
    .check();
  await panel
    .getByRole("slider", { name: "Section level", exact: true })
    .press("Home");
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  await panel
    .getByRole("button", { name: "Reset cardiac materials", exact: true })
    .click();
  for (const group of [
    "cavities",
    "valves",
    "papillary",
    "coronary-arteries",
    "great-arteries",
  ]) {
    const tree = panel.locator(`[data-cardiac-group="${group}"]`);
    await tree.locator("summary").click();
    await tree.getByRole("checkbox", { name: /^Visible category:/ }).check();
  }
  await expect.poll(async () => (await metrics()).calls).toBe(31);
  await expect
    .poll(async () => (await metrics()).triangles)
    .toBe(
      manifest.assets.reduce(
        (n: number, a: { triangleCount: number }) => n + a.triangleCount,
        2,
      ),
    );
  expect(new Set(assets).size).toBe(3);
  await page.waitForTimeout(300);
  const idle = (await metrics()).frames;
  await page.waitForTimeout(500);
  expect((await metrics()).frames).toBe(idle);
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect(panel.getByLabel("Arată inima", { exact: true })).toBeChecked();
});
test("a failed cardiac package can retry without replacing skeletal geometry", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/bodyparts3d-heart-external.glb", (r) =>
    fail ? r.abort() : r.continue(),
  );
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Venous system", { exact: true }).check();
  await page.getByLabel("Show heart", { exact: true }).check();
  const panel = page.locator(".cardiac-explorer");
  await expect(panel.getByRole("alert")).toContainText("could not load");
  await expect(
    page.getByLabel("Skeletal system", { exact: true }),
  ).toBeChecked();
  fail = false;
  await panel
    .getByRole("button", { name: "Retry cardiac assets", exact: true })
    .click();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel.locator('p[role="status"]')).toHaveCount(0);
});
test("cardiac controls fit a narrow viewport without horizontal overflow", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.locator(".topbar .panel-toggle.left").click();
  await page.getByLabel("Venous system", { exact: true }).check();
  await page.locator(".topbar .panel-toggle.left").click();
  await page.locator(".topbar .panel-toggle:not(.left)").click();
  await page.getByLabel("Show heart", { exact: true }).check();
  const panel = page.locator(".cardiac-explorer");
  await expect(
    panel.getByRole("radio", { name: "Natural", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("heart-mobile.png") });
});

test("an existing vena cava reveals the right atrial cavity without enabling a fifth primary system", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  const canvas = page.locator("canvas"),
    metrics = async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await page.getByLabel("Venous system", { exact: true }).check();
  await page
    .getByLabel("Search structures", { exact: true })
    .fill("Superior vena cava");
  await page
    .getByRole("button", { name: /^Superior vena cava/ })
    .first()
    .click();
  await page
    .locator(".venous-details")
    .getByRole("button", {
      name: "Show path structures (resets vein filters/isolation)",
      exact: true,
    })
    .click();
  const panel = page.locator(".cardiac-explorer");
  await expect(panel.getByLabel("Show heart", { exact: true })).toBeChecked();
  await expect(
    panel.getByLabel("Cavity of right atrium", { exact: true }),
  ).toBeChecked();
  await expect
    .poll(async () => (await metrics()).calls, { timeout: 30000 })
    .toBe(189);
  await page.getByLabel("Venous system", { exact: true }).uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(57);
  await expect(panel.getByLabel("Show heart", { exact: true })).toBeChecked();
  await panel
    .getByRole("slider", {
      name: "Heart-wall opacity (preserves internal parts)",
      exact: true,
    })
    .press("Home");
  await expect.poll(async () => (await metrics()).calls).toBe(54);
  await panel.getByLabel("Show heart", { exact: true }).uncheck();
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await expect(
    page.getByLabel("Skeletal system", { exact: true }),
  ).toBeChecked();
});
