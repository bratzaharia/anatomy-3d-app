import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// Reuse Playwright's bundled PNG reader; no production image dependency.
const require = createRequire(import.meta.url);
const playwrightRequire = createRequire(require.resolve("playwright"));
const { PNG } = require(
  join(
    dirname(playwrightRequire.resolve("playwright-core")),
    "lib/utilsBundle.js",
  ),
) as {
  PNG: {
    sync: {
      read(bytes: Buffer): { width: number; height: number; data: Buffer };
    };
  };
};

function sample(
  bytes: Buffer,
  point: { x: number; y: number },
  canvasSize: { width: number; height: number },
) {
  const png = PNG.sync.read(bytes);
  const x = Math.round((point.x * png.width) / canvasSize.width);
  const y = Math.round((point.y * png.height) / canvasSize.height);
  const rgb = [0, 0, 0];
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const offset = ((y + dy) * png.width + x + dx) * 4;
      for (let channel = 0; channel < 3; channel++)
        rgb[channel]! += png.data[offset + channel]! / 81;
    }
  return rgb;
}

test("skull hover visibly darkens rendered pixels even when the bone is already selected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  await page
    .getByRole("radio", { name: "Colorat", exact: true })
    .press("Space");
  const canvas = page.locator("canvas");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Missing canvas bounds");
  const point = { x: bounds.width * 0.5, y: bounds.height * 0.36 };
  const otherBone = { x: bounds.width * 0.59, y: bounds.height * 0.55 };
  const leave = async () => {
    await page.getByRole("button", { name: "RO", exact: true }).hover();
    await expect(page.locator(".hover-label")).toHaveCount(0);
  };
  const enter = async () => {
    await canvas.hover({ position: point });
    await expect(page.locator(".hover-label strong")).toHaveText("Os frontal");
  };
  await leave();
  const base = await canvas.screenshot();
  await enter();
  const hovered = await canvas.screenshot();
  await canvas.click({ position: point });
  await expect(
    page.getByRole("heading", { name: "Os frontal", exact: true }),
  ).toBeVisible();
  await leave();
  const selected = await canvas.screenshot();
  await enter();
  const selectedHovered = await canvas.screenshot();
  const ratios = {
    unselected: sample(hovered, point, bounds).map(
      (value, index) => value / sample(base, point, bounds)[index]!,
    ),
    selected: sample(selectedHovered, point, bounds).map(
      (value, index) => value / sample(selected, point, bounds)[index]!,
    ),
  };
  await test.info().attach("hover-pixel-ratios.json", {
    body: JSON.stringify(ratios, null, 2),
    contentType: "application/json",
  });
  process.stdout.write(JSON.stringify(ratios) + "\n");
  for (const pair of Object.values(ratios))
    for (const ratio of pair) {
      expect(ratio).toBeGreaterThanOrEqual(0.7);
      expect(ratio).toBeLessThanOrEqual(0.8);
    }
  expect(sample(hovered, otherBone, bounds)).toEqual(
    sample(base, otherBone, bounds),
  );
  expect(sample(selectedHovered, otherBone, bounds)).toEqual(
    sample(selected, otherBone, bounds),
  );
  await leave();
  expect(sample(await canvas.screenshot(), point, bounds)).toEqual(
    sample(selected, point, bounds),
  );
  const metrics = JSON.parse(
    (await canvas.getAttribute("data-anatomy-metrics"))!,
  );
  await page.waitForTimeout(500);
  expect(
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics"))!).frames,
  ).toBe(metrics.frames);
});
