import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

test("three exclusive skull modes preserve picking, camera, cached geometry and locale", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  const requests = { bones: 0, muscles: 0 };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().endsWith("bodyparts3d-skeleton.glb")) requests.bones++;
    if (request.url().endsWith("bodyparts3d-muscles.glb")) requests.muscles++;
  });
  await page.goto("/?diagnostics");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("radiogroup")).toHaveCount(0);
  await page.getByRole("button", { name: "Cap", exact: true }).click();
  const group = page.getByRole("radiogroup", {
    name: "Moduri de vizualizare pentru craniu",
  });
  await expect(group.getByRole("radio")).toHaveCount(3);
  await expect(group.getByRole("img")).toHaveCount(3);
  const expectCompactRow = async () => {
    const columns = await group.evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns.split(" "),
    );
    expect(columns).toHaveLength(4);
    const cards = await page.locator(".skull-mode-card").all();
    const bounds = await Promise.all(cards.map((card) => card.boundingBox()));
    for (const box of bounds) {
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThan(80);
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.y).toBeCloseTo(bounds[0]!.y, 0);
    }
    for (const card of cards) {
      await expect(card).toHaveAttribute("title", /.+: .+/);
      const label = card.locator("strong");
      await expect(label).toHaveCSS("overflow", "hidden");
      await expect(label).toHaveCSS("text-overflow", "ellipsis");
      await expect(label).toHaveCSS("white-space", "nowrap");
    }
  };
  await expectCompactRow();
  for (const card of await page.locator(".skull-mode-card").all()) {
    const bounds = await card.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs(bounds!.width - bounds!.height)).toBeLessThan(1);
  }
  await expect(
    group.getByRole("radio", { name: "Simplu", exact: true }),
  ).toBeChecked();
  const canvas = page.locator("canvas");
  const metrics = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect(canvas).toHaveAttribute("data-anatomy-metrics", /triangles/);
  await expect
    .poll(async () => (await metrics()).camera?.[1] ?? 0)
    .toBeGreaterThan(1.4);
  const baseline = await metrics();
  const size = await canvas.boundingBox();
  if (!size) throw new Error("Missing canvas bounds");
  const point = { x: size.width * 0.5, y: size.height * 0.36 };
  const stylePath = fileURLToPath(
    new URL("./anatomy-screenshot.css", import.meta.url),
  );
  for (const [name, snapshot] of [
    ["Simplu", "simple"],
    ["Colorat", "colored"],
    ["Radiografie", "xray"],
  ]) {
    const radio = group.getByRole("radio", { name, exact: true });
    await radio.press("Space");
    await expect(radio).toBeChecked();
    await expect(group.locator("input:checked")).toHaveCount(1);
    await expect(page.locator(".skull-mode-card.is-selected")).toHaveCSS(
      "outline-width",
      "2px",
    );
    await expect
      .poll(async () => (await metrics()).camera)
      .toEqual(baseline.camera);
    expect((await metrics()).geometries).toBe(baseline.geometries);
    await expect
      .poll(async () => (await metrics()).triangles)
      .toBe(baseline.triangles);
    expect((await metrics()).calls).toBe(baseline.calls);
    expect((await metrics()).textures).toBe(baseline.textures);
    await expect(canvas).toHaveScreenshot(`skull-mode-${snapshot}.png`, {
      stylePath,
    });
    await canvas.hover({ position: point });
    await expect(page.locator(".hover-label strong")).toHaveText("Os frontal");
    await canvas.click({ position: point });
    await expect(
      page.getByRole("heading", { name: "Os frontal", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Închide selecția", exact: true })
      .click();
    // Let the click's final demand-render commit before measuring idle frames.
    await page.waitForTimeout(250);
    const idleFrame = (await metrics()).frames;
    await page.waitForTimeout(250);
    expect((await metrics()).frames).toBe(idleFrame);
  }
  await expect(page.getByText(/nu radiografie clinică/)).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "X-ray", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("radiogroup", { name: "Skull Visualization Modes" }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "X-ray", exact: true })
    .press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "Simple", exact: true }),
  ).toBeChecked();
  await expect(canvas).toHaveScreenshot("skull-mode-simple.png", {
    stylePath,
    maxDiffPixels: 0,
  });
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Moduri de vizualizare pentru craniu" }),
  ).toHaveScreenshot("skull-mode-cards.png");
  const warmedPrograms = (await metrics()).programs;
  for (let i = 0; i < 3; i++)
    for (const name of ["Colorat", "Radiografie", "Simplu"])
      await page.getByRole("radio", { name, exact: true }).press("Space");
  await expect
    .poll(async () => (await metrics()).camera)
    .toEqual(baseline.camera);
  expect((await metrics()).geometries).toBe(baseline.geometries);
  expect((await metrics()).calls).toBe(baseline.calls);
  expect((await metrics()).programs).toBe(warmedPrograms);
  for (const width of [1011, 975, 696]) {
    await page.setViewportSize({ width, height: 1268 });
    await expectCompactRow();
  }
  for (const card of await page.locator(".skull-mode-card").all()) {
    const bounds = await card.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs(bounds!.width - bounds!.height)).toBeLessThan(1);
  }
  await page.getByLabel("Caută o structură").fill("humerus stâng");
  await page.getByRole("button", { name: /^Humerus stâng/ }).click();
  await expect(page.getByRole("radiogroup")).toHaveCount(0);
  expect(requests).toEqual({ bones: 1, muscles: 0 });
  expect(errors).toEqual([]);
});
