import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

test("individual skull colors, hover, selection, focus, hide, isolation and locale", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  let requests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().endsWith("bodyparts3d-skeleton.glb")) requests++;
  });
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await metrics()).calls).toBe(50);
  await expect.poll(async () => (await metrics()).triangles).toBe(513166);
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Missing canvas");
  const forehead = { x: bounds.width * 0.5, y: bounds.height * 0.36 };
  const stylePath = fileURLToPath(
    new URL("./anatomy-screenshot.css", import.meta.url),
  );
  await expect(canvas).toHaveScreenshot("skull-reference-softened.png", {
    stylePath,
  });
  const focusedCalls = (await metrics()).calls;
  await canvas.hover({ position: forehead });
  await expect(page.locator(".hover-label strong")).toHaveText("Os frontal");
  await expect(canvas).toHaveScreenshot("skull-frontal-hover.png", {
    stylePath,
  });
  await canvas.click({ position: forehead });
  await expect(
    page.getByRole("heading", { name: "Os frontal", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".member-list button")).toHaveCount(22);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Frontal bone", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(focusedCalls - 1);
  await canvas.hover({ position: forehead });
  await expect(page.locator(".hover-label strong")).not.toHaveText(
    "Frontal bone",
  );
  await canvas.click({ position: forehead });
  await expect(
    page.getByRole("heading", { name: "Frontal bone", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await page.getByLabel("Search structures").fill("left zygomatic");
  await page.getByRole("button", { name: /^Left zygomatic bone/ }).click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  await expect.poll(async () => (await metrics()).calls).toBe(2);
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await canvas.click({
    position: { x: bounds.width / 2, y: bounds.height / 2 },
  });
  await expect(
    page.getByRole("heading", { name: "Left zygomatic bone", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Os zigomatic stâng", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restaurează vizibilitatea", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  await page.getByRole("button", { name: "RO", exact: true }).hover();
  await expect(canvas).toHaveScreenshot("skull-reference-softened.png", {
    stylePath,
    maxDiffPixels: 0,
  });
  expect(requests).toBe(1);
  expect(errors).toEqual([]);
});
