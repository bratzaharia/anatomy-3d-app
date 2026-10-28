import { expect, test } from "@playwright/test";

test("collapsing either desktop panel keeps the model in the visible center column", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  const canvas = page.locator("canvas");
  const original = await canvas.boundingBox();
  if (!original) throw new Error("Missing initial canvas");
  const left = page.getByRole("button", {
    name: "Deschide sau închide navigarea",
    exact: true,
  });
  const right = page.getByRole("button", {
    name: "Deschide sau închide inspectorul",
    exact: true,
  });
  await left.click();
  await expect
    .poll(async () => (await canvas.boundingBox())?.width ?? 0)
    .toBeGreaterThan(original.width);
  await expect(canvas).toBeVisible();
  await right.click();
  await expect
    .poll(async () => (await canvas.boundingBox())?.width ?? 0)
    .toBe(1440);
  await right.click();
  await left.click();
  await expect
    .poll(async () => (await canvas.boundingBox())?.width ?? 0)
    .toBe(original.width);
});

test("closing navigation at the reported 696px viewport preserves rendering", async ({
  page,
}) => {
  await page.setViewportSize({ width: 696, height: 853 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  const canvas = page.locator("canvas");
  const left = page.getByRole("button", {
    name: "Deschide sau închide navigarea",
    exact: true,
  });
  await left.click();
  await expect(page.getByLabel("Sistem osos", { exact: true })).toBeChecked();
  await left.click();
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expect(canvas).toBeVisible();
  await expect.poll(async () => (await canvas.boundingBox())?.width).toBe(696);
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}")
          .triangles,
    )
    .toBe(513166);
});
