import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
const anatomyOnlyStyle = fileURLToPath(
  new URL("./anatomy-screenshot.css", import.meta.url),
);

async function metrics(page: Page) {
  return JSON.parse(
    (await page.locator("canvas").getAttribute("data-anatomy-metrics")) ?? "{}",
  );
}
async function ready(page: Page) {
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-anatomy-metrics",
    /triangles/,
  );
}
test("all four layer states, muscle identification, visibility, opacity and cached assets", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  const requests = { bones: 0, muscles: 0 };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("bodyparts3d-skeleton.glb")) requests.bones++;
    if (request.url().endsWith("bodyparts3d-muscles.glb")) requests.muscles++;
  });
  await page.goto("/?diagnostics");
  await ready(page);
  const canvas = page.locator("canvas");
  const baseline = await metrics(page);
  expect(baseline.triangles).toBe(513164 + 2); // shared ground grid is two triangles
  await expect(canvas).toHaveScreenshot("skeletal-only.png", {
    maxDiffPixelRatio: 0.002,
    stylePath: anatomyOnlyStyle,
  });
  await page.getByRole("button", { name: "EN", exact: true }).click();
  const bones = page.getByLabel("Skeletal system", { exact: true });
  const muscles = page.getByLabel("Muscular system", { exact: true });
  const all = page.getByLabel("All layers", { exact: true });
  await muscles.check();
  await ready(page);
  await expect(all).toBeChecked();
  expect((await metrics(page)).camera).toEqual(baseline.camera);
  await expect(canvas).toHaveScreenshot("combined-layers.png", {
    maxDiffPixelRatio: 0.002,
    stylePath: anatomyOnlyStyle,
  });
  await bones.uncheck();
  await expect(all).not.toBeChecked();
  await expect
    .poll(async () => (await metrics(page)).triangles)
    .toBe(2387524 + 2);
  await page.getByLabel("Search structures").fill("left deltoid");
  await page.getByRole("button", { name: /^Left deltoid/ }).click();
  await expect(
    page.getByRole("heading", { name: "Left deltoid", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Missing canvas bounds");
  const center = { x: bounds.width / 2, y: bounds.height / 2 };
  await canvas.hover({ position: center });
  await expect(page.locator(".hover-label strong")).toHaveText("Left deltoid");
  await canvas.click({ position: center });
  await expect(
    page.getByRole("heading", { name: "Left deltoid", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Mușchiul deltoid — stânga",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Sistem muscular", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Sistem osos", { exact: true }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(async () => (await metrics(page)).calls).toBe(1); // grid only
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await bones.check();
  await page.getByLabel("Search structures").fill("left subscapularis");
  await page.getByRole("button", { name: /^Left subscapularis/ }).click();
  await expect(page.locator(".member-list button")).toHaveCount(8);
  await page
    .getByRole("button", { name: "Reveal this group", exact: true })
    .click();
  await expect(bones).toBeChecked();
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await page.getByRole("button", { name: "Whole body", exact: true }).click();
  await page.getByLabel("Muscle opacity", { exact: true }).fill("0");
  await expect
    .poll(async () => (await metrics(page)).camera)
    .toEqual(baseline.camera);
  await expect.poll(async () => (await metrics(page)).triangles).toBe(513166);
  await expect(canvas).toHaveScreenshot("skeletal-only.png", {
    stylePath: anatomyOnlyStyle,
    maxDiffPixels: 0,
  });
  await page.getByLabel("Muscle opacity", { exact: true }).fill("100");
  await all.uncheck();
  await expect(
    page.getByText("Choose at least one anatomical layer"),
  ).toBeVisible();
  await expect.poll(async () => (await metrics(page)).calls).toBe(1);
  await all.check();
  await ready(page);
  for (let i = 0; i < 3; i++) {
    await muscles.uncheck();
    await muscles.check();
  }
  await muscles.uncheck();
  await expect(canvas).toHaveScreenshot("skeletal-only.png", {
    stylePath: anatomyOnlyStyle,
    maxDiffPixels: 0,
  });
  expect(requests).toEqual({ bones: 1, muscles: 1 });
  expect(errors).toEqual([]);
});

test("muscle failure and retry do not replace the skeleton", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.route("**/models/bodyparts3d-muscles.glb", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByLabel("Sistem muscular", { exact: true }).check();
  await expect(page.getByRole("alert")).toContainText(
    "Scheletul rămâne disponibil",
  );
  await page.getByLabel("Caută o structură").fill("humerus stâng");
  await page.getByRole("button", { name: /^Humerus stâng/ }).click();
  await expect(
    page.getByRole("heading", { name: "Humerus stâng", exact: true }),
  ).toBeVisible();
  await page.unroute("**/models/bodyparts3d-muscles.glb");
  await page.getByRole("button", { name: "Reîncearcă", exact: true }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Humerus stâng", exact: true }),
  ).toBeVisible();
});
