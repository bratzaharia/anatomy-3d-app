import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

test("skull studio shading has cached self-shadows, live visibility updates and true perspective", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error") errors.push(entry.text());
  });
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect
    .poll(async () => (await metrics()).shadows?.draws ?? 0)
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  await expect
    .poll(async () => (await metrics()).camera?.[1] ?? 0)
    .toBeGreaterThan(1.4);
  const initial = await metrics();
  expect(initial.projection).toBe("PerspectiveCamera");
  expect(initial.shadows.autoUpdate).toBe(false);
  expect(initial.shadows.enabled).toBe(true);
  const size = await canvas.boundingBox();
  if (!size) throw new Error("Missing canvas bounds");
  await canvas.hover({
    position: { x: size.width * 0.5, y: size.height * 0.36 },
  });
  await expect(page.locator(".hover-label strong")).toHaveText("Os frontal");
  await canvas.click({
    position: { x: size.width * 0.5, y: size.height * 0.36 },
  });
  await expect(
    page.getByRole("heading", { name: "Os frontal", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RO", exact: true }).hover();
  await expect
    .poll(async () => (await metrics()).shadows.draws)
    .toBe(initial.shadows.draws);
  await page.getByRole("button", { name: "Ascunde", exact: true }).click();
  await expect
    .poll(async () => (await metrics()).shadows.draws)
    .toBeGreaterThan(initial.shadows.draws);
  const hidden = await metrics();
  await page
    .getByRole("button", { name: "Restaurează vizibilitatea", exact: true })
    .last()
    .click();
  await expect
    .poll(async () => (await metrics()).shadows.draws)
    .toBeGreaterThan(hidden.shadows.draws);
  const restored = await metrics();
  await page
    .getByRole("group", { name: "Vederi ale camerei" })
    .getByRole("button", { name: "Stânga", exact: true })
    .click();
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  await expect
    .poll(async () => (await metrics()).camera?.[0] ?? 0)
    .toBeGreaterThan(0.2);
  await expect(canvas).toHaveScreenshot("skull-studio-side.png", {
    stylePath: fileURLToPath(
      new URL("./anatomy-screenshot.css", import.meta.url),
    ),
  });
  expect((await metrics()).shadows.draws).toBe(restored.shadows.draws);
  expect((await metrics()).textures).toBe(restored.textures);
  await page.waitForTimeout(300);
  const idle = await metrics();
  await page.waitForTimeout(500);
  expect((await metrics()).frames).toBe(idle.frames);
  await test.info().attach("skull-shadow-cache.json", {
    body: JSON.stringify(
      { initial, hidden, restored, afterCameraChange: await metrics() },
      null,
      2,
    ),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});
