import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

async function enableBrain(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  if (!(await page.getByLabel("Nervous system", { exact: true }).isVisible()))
    await page.locator(".topbar .panel-toggle.left").click();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  await page.getByLabel("Nervous system", { exact: true }).check();
  await page
    .getByRole("button", { name: "Select available brain parts", exact: true })
    .click();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page
    .getByRole("button", { name: "Isolate brain selection", exact: true })
    .click();
  await page.getByRole("button", { name: "Deselect all", exact: true }).click();
  await page.locator(".topbar .panel-toggle.left").click();
  const canvas = page.locator("canvas");
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}")
          .calls,
      { timeout: 30000 },
    )
    .toBe(54);
  return {
    canvas,
    metrics: async () =>
      JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}"),
  };
}
test("brain source regions: natural restoration, atlas guard, independent colors, picking and zero opacity", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1050 });
  const errors: string[] = [],
    atlasRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/\.(annot|nii|nii\.gz|gii|dlabel\.nii)(\?|$)/.test(r.url()))
      atlasRequests.push(r.url());
  });
  const { canvas, metrics } = await enableBrain(page);
  await expect.poll(async () => (await metrics()).triangles).toBe(300028);
  const baseline = await metrics();
  await page.getByRole("button", { name: "EN", exact: true }).hover();
  const natural = await canvas.screenshot();
  await page
    .getByRole("radio", { name: "Regions", exact: true })
    .press("Space");
  const colored = await canvas.screenshot();
  expect(colored.equals(natural)).toBe(false);
  await page
    .getByRole("radio", { name: "Natural", exact: true })
    .press("Space");
  expect((await canvas.screenshot()).equals(natural)).toBe(true);
  await page
    .getByRole("radio", { name: "Advanced atlas", exact: true })
    .press("Space");
  await expect(page.locator(".brain-atlas-block")).toContainText(
    "Atlas not registered",
  );
  await page
    .getByLabel("Candidate atlas (not integrated)")
    .selectOption("hcp-mmp-1");
  expect((await canvas.screenshot()).equals(natural)).toBe(true);
  expect(atlasRequests).toEqual([]);
  await page
    .getByRole("radio", { name: "Regions", exact: true })
    .press("Space");
  await page.getByRole("button", { name: "Left parts", exact: true }).click();
  await expect(page.getByLabel("Select all available parts")).toHaveJSProperty(
    "indeterminate",
    true,
  );
  await page.getByRole("button", { name: "Deselect all", exact: true }).click();
  const search = page.getByLabel("Search region, Latin term or FMA ID");
  await search.fill("Left superior frontal gyrus");
  await page.getByLabel("Left superior frontal gyrus", { exact: true }).check();
  await page
    .getByLabel("Selected parts color", { exact: true })
    .fill("#cc8844");
  await expect(
    page.getByLabel("Selected parts color", { exact: true }),
  ).toHaveValue("#cc8844");
  await page
    .getByRole("button", { name: "Add contralateral homologues", exact: true })
    .click();
  await expect(
    page.getByText("2 selected parts", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Isolate brain selection", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Focus brain selection", exact: true })
    .click();
  await expect.poll(async () => (await metrics()).calls).toBe(3);
  const box = await canvas.boundingBox();
  if (!box) throw Error("Brain canvas absent");
  let point: { x: number; y: number } | null = null;
  for (const x of [0.5, 0.4, 0.6, 0.3, 0.7]) {
    for (const y of [0.5, 0.4, 0.6, 0.3, 0.7]) {
      await canvas.hover({ position: { x: box.width * x, y: box.height * y } });
      if (await page.locator(".hover-label strong").isVisible()) {
        point = { x: box.width * x, y: box.height * y };
        break;
      }
    }
    if (point) break;
  }
  expect(point).not.toBeNull();
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toContainText(
    "superior frontal gyrus",
  );
  await page.getByLabel("Brain opacity", { exact: true }).fill("0");
  await expect.poll(async () => (await metrics()).calls).toBe(1);
  await canvas.click({ position: point! });
  await expect(page.locator(".inspector-header h2")).toHaveText("—");
  await page.getByLabel("Brain opacity", { exact: true }).fill("1");
  expect((await metrics()).geometries).toBeLessThanOrEqual(baseline.geometries);
  await page
    .getByRole("button", { name: "Restore brain context", exact: true })
    .click();
  // The first isolation snapshot was the original unrestricted nervous layer.
  await page.getByRole("button", { name: "RO", exact: true }).click();
  await expect(
    page.getByText("Creier — vizualizare și regiuni", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "EN", exact: true }).hover();
  await page.waitForTimeout(350);
  const idle = (await metrics()).frames;
  await page.waitForTimeout(500);
  expect((await metrics()).frames).toBe(idle);
  // Restoring the original context may upload previously unseen peripheral
  // buffers. Repeated brain style changes must not upload additional geometry.
  const warm = (await metrics()).geometries;
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("radio", { name: "Natural", exact: true })
      .press("Space");
    await page
      .getByRole("radio", { name: "Regions", exact: true })
      .press("Space");
  }
  expect((await metrics()).geometries).toBe(warm);
  expect(errors).toEqual([]);
  await info.attach("brain-metrics", {
    body: JSON.stringify({ baseline, after: await metrics(), atlasRequests }),
    contentType: "application/json",
  });
  process.stdout.write(
    JSON.stringify({
      brainBaseline: baseline,
      brainAfter: await metrics(),
      atlasRequests,
    }) + "\n",
  );
  await page.screenshot({ path: info.outputPath("brain-controls.png") });
});

test("brain preview capture and narrow responsive controls", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 500 });
  const { canvas } = await enableBrain(page);
  await expect(
    page.getByRole("radio", { name: "Natural", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  const directory = fileURLToPath(
    new URL("../public/brain-previews/", import.meta.url),
  );
  if (info.config.updateSnapshots === "all")
    await mkdir(directory, { recursive: true });
  await page.addStyleTag({
    content: readFileSync(
      new URL("./anatomy-screenshot.css", import.meta.url),
      "utf8",
    ).replace("visibility: hidden", "display: none"),
  });
  for (const mode of ["natural", "regions"] as const) {
    await page
      .getByRole("radio", {
        name: mode === "natural" ? "Natural" : "Regions",
        exact: true,
      })
      .press("Space");
    await page.locator(".topbar .panel-toggle:not(.left)").click();
    await page.getByRole("button", { name: "EN", exact: true }).hover();
    const box = await canvas.boundingBox();
    if (!box) throw Error("No canvas");
    const size = Math.min(box.width, box.height) * 0.65;
    await page.screenshot({
      path:
        info.config.updateSnapshots === "all"
          ? `${directory}/${mode}.png`
          : info.outputPath(`preview-${mode}.png`),
      clip: {
        x: box.x + (box.width - size) / 2,
        y: box.y + (box.height - size) / 2,
        width: size,
        height: size,
      },
      style: readFileSync(
        new URL("./anatomy-screenshot.css", import.meta.url),
        "utf8",
      ),
    });
    await page.locator(".topbar .panel-toggle:not(.left)").click();
  }
});
