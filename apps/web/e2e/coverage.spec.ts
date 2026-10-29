import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const layout = JSON.parse(
  readFileSync(
    new URL(
      "../../../packages/anatomy-data/src/skeletal-parts.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
test("existing source bones become individually pickable without more default draws or model loads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let loads = 0;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().endsWith("bodyparts3d-skeleton.glb")) loads++;
  });
  await page.goto("/?diagnostics");
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await expect.poll(async () => (await metrics()).triangles).toBe(513166);
  const baseline = await metrics();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  const search = page.getByPlaceholder("E.g. humerus, skull…");
  await search.fill("Left scaphoid");
  await page.getByRole("button", { name: /^Left scaphoid/ }).click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  const part = layout.parents
    .flatMap((p: { parts: { id: string; indexCount: number }[] }) => p.parts)
    .find((p: { id: string }) => p.id === "bone-fma24436");
  await expect.poll(async () => (await metrics()).calls).toBe(2);
  await expect
    .poll(async () => (await metrics()).triangles)
    .toBe(part.indexCount / 3 + 2);
  const bounds = await canvas.boundingBox();
  if (!bounds) throw Error("No canvas");
  const point = { x: bounds.width / 2, y: bounds.height / 2 };
  await canvas.hover({ position: point });
  await expect(page.locator(".hover-label strong")).toHaveText("Left scaphoid");
  await canvas.click({ position: point });
  await expect(page.locator(".inspector-header h2")).toHaveText(
    "Left scaphoid",
  );
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await canvas.click({ position: point });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  await expect(page.locator(".hover-label strong")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Fit body", exact: true }).click();
  await page.getByRole("button", { name: "EN", exact: true }).hover();
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await expect.poll(async () => (await metrics()).triangles).toBe(513166);
  expect((await metrics()).geometries).toBe(baseline.geometries);
  await page.waitForTimeout(500);
  const frames = (await metrics()).frames;
  await page.waitForTimeout(500);
  expect((await metrics()).frames).toBe(frames);
  expect(loads).toBe(1);
  expect(errors).toEqual([]);
  await test.info().attach("skeletal-part-performance.json", {
    body: JSON.stringify({ baseline, after: await metrics(), loads }),
    contentType: "application/json",
  });
});

test("all three inventories expose actual gaps and keep unavailable entries noninteractive in 3D", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveCount(0);
  const panel = page.getByRole("region", { name: "Acoperire și lipsuri" });
  await panel.locator("summary").click();
  await expect(panel.getByText(/199 individuale/)).toBeVisible();
  await expect(panel.getByText(/143 fără geometrie/)).toBeVisible();
  await expect(panel.getByText(/163 fără geometrie/)).toBeVisible();
  await panel.getByRole("button", { name: /^Coccis/ }).click();
  await expect(
    page.getByRole("button", { name: "Focalizează", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".inspector-header h2")).toHaveText("Coccis");
  await panel.getByLabel("Sistem de verificat").selectOption("muscular");
  await panel.getByLabel("Caută în inventar").fill("flexor pollicis brevis");
  await expect(panel.locator(".coverage-members button")).toHaveCount(2);
  await expect(panel.locator(".coverage-members button").first()).toContainText(
    "În carantină",
  );
  await panel.getByLabel("Sistem de verificat").selectOption("nervous");
  await panel.getByLabel("Caută în inventar").fill("măduvă");
  await panel.locator(".coverage-members button").click();
  await expect(
    page.getByRole("button", { name: "Focalizează", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Coverage and gaps" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await panel.getByLabel("Sistem de verificat").selectOption("skeletal");
  await panel.getByLabel("Caută în inventar").fill("");
  await panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath("coverage-panel.png") });
});
