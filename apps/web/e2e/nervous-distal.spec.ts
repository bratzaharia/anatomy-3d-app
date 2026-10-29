import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

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
const supplement = JSON.parse(
  await readFile(
    new URL(
      "../../../packages/anatomy-data/src/nervous-supplement.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  inventory: {
    id: string;
    names: { en: string };
    distalRegion: string | null;
    laterality: string;
    geometryStatus: string;
  }[];
};

async function selectSource(page: Page, name: string) {
  await page.getByLabel("Search structures").fill(name);
  await page
    .locator(".search-results button")
    .filter({ hasText: name })
    .click();
  await expect(page.locator(".inspector-header h2")).toHaveText(name);
}
async function startNervous(page: Page) {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  await page.getByLabel("Nervous system", { exact: true }).check();
  await expect(page.getByRole("status")).toHaveCount(0);
  const canvas = page.locator("canvas");
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}")
          .calls,
    )
    .toBe(303);
  return canvas;
}

for (const region of ["hand", "foot"])
  for (const side of ["left", "right"]) {
    test(`actual ${side} ${region} digital geometry supports hover, click, focus and hidden non-picking`, async ({
      page,
    }) => {
      const canvas = await startNervous(page);
      const source = supplement.inventory.find(
        (i) =>
          i.distalRegion === region &&
          i.laterality === side &&
          i.id.includes(
            region === "hand"
              ? "proper-palmar-digital-branches-of-median"
              : "proper-plantar-digital-branches-of-medial",
          ),
      )!;
      expect(source.geometryStatus).toBe("grouped");
      await selectSource(page, source.names.en);
      await page.getByRole("button", { name: "Isolate", exact: true }).click();
      await page.getByRole("button", { name: "Focus", exact: true }).click();
      const metrics = async () =>
        JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
      await expect.poll(async () => (await metrics()).calls).toBe(2);
      await page.getByRole("button", { name: "EN", exact: true }).hover();
      const screenshot = await canvas.screenshot();
      const png = PNG.sync.read(screenshot);
      const pixels: { x: number; y: number }[] = [];
      for (let y = Math.floor(png.height * 0.1); y < png.height * 0.8; y++)
        for (let x = Math.floor(png.width * 0.1); x < png.width * 0.9; x++) {
          const offset = (y * png.width + x) * 4;
          const [r, g, b] = [...png.data.subarray(offset, offset + 3)] as [
            number,
            number,
            number,
          ];
          if (g > 150 && g > r * 1.1 && b > r * 1.08) pixels.push({ x, y });
        }
      expect(
        pixels.length,
        "Real selected source mesh must render colored distal pixels",
      ).toBeGreaterThan(10);
      const pixel = pixels[Math.floor(pixels.length / 2)]!;
      const box = (await canvas.boundingBox())!;
      const point = {
        x: (pixel.x * box.width) / png.width,
        y: (pixel.y * box.height) / png.height,
      };
      await test.info().attach(`${side}-${region}-source-set.png`, {
        body: screenshot,
        contentType: "image/png",
      });
      await page
        .getByRole("button", { name: "Clear selection", exact: true })
        .click();
      await canvas.hover({ position: point });
      await expect(page.locator(".hover-label strong")).toHaveText(
        source.names.en,
      );
      await canvas.click({ position: point });
      await expect(page.locator(".inspector-header h2")).toHaveText(
        source.names.en,
      );
      await expect(page.locator(".nervous-details")).toContainText(
        "Source set",
      );
      await page.getByRole("button", { name: "Hide", exact: true }).click();
      await expect.poll(async () => (await metrics()).calls).toBe(1);
      await canvas.click({ position: point });
      await expect(page.locator(".inspector-header h2")).toHaveText("—");
    });
  }

test("twenty source-coverage views record rendered regions and missing cervical coverage honestly", async ({
  page,
}) => {
  test.setTimeout(150000);
  const canvas = await startNervous(page);
  const captureDir = process.env.NERVOUS_CAPTURE_QA
    ? fileURLToPath(
        new URL("../../../docs/assets/nervous-qa/", import.meta.url),
      )
    : test.info().outputPath("coverage-views");
  await mkdir(captureDir, { recursive: true });
  const views: {
    label: string;
    source?: string;
    region?: string;
    back?: boolean;
    missing?: boolean;
    note?: string;
  }[] = [
    { label: "01-body-anterior" },
    { label: "02-body-posterior", back: true },
    {
      label: "03-cranial",
      region: "Head",
      note: "Source-mapped cranial surfaces; nerve VIII withheld; not a complete facial branch inventory.",
    },
    {
      label: "04-spinal-roots",
      source: "Posterior root of spinal nerve — left",
      note: "Aggregate root set, not 31 independently numbered roots.",
    },
    {
      label: "05-cervical-plexus-missing",
      source: "Left phrenic nerve",
      missing: true,
    },
    {
      label: "06-brachial-plexus",
      source: "Roots of brachial plexus — left",
      note: "Source roots plus surrounding trunks/divisions/cords; source correspondence needs medical review.",
    },
    { label: "07-upper-limb-right", region: "Right upper limb" },
    { label: "08-upper-limb-left", region: "Left upper limb" },
    {
      label: "09-hand-right",
      source: "Proper palmar digital branches of median nerve — right",
    },
    {
      label: "10-hand-left",
      source: "Proper palmar digital branches of median nerve — left",
    },
    {
      label: "11-thoracic",
      source: "Intercostal nerves — left",
      note: "Source intercostal set; numbered 1–12 individual identities remain missing.",
    },
    {
      label: "12-abdominal",
      source: "Left iliohypogastric nerve",
      note: "Partial somatic course; not complete visceral/enteric innervation.",
    },
    {
      label: "13-lumbar",
      source: "Left genitofemoral nerve",
      note: "Partial named lumbar branches; plexus completeness not verified.",
    },
    {
      label: "14-pelvic",
      source: "Left pudendal nerve",
      note: "Partial source course; full hypogastric/splanchnic/perineal branching missing.",
    },
    {
      label: "15-sacral",
      source: "Cauda equina",
      note: "Aggregate cauda source set with nearby sacral origins; not independently labeled sacral roots.",
    },
    { label: "16-lower-limb-right", region: "Right lower limb" },
    { label: "17-lower-limb-left", region: "Left lower limb" },
    {
      label: "18-foot-right",
      source: "Proper plantar digital branches of medial plantar nerve — right",
    },
    {
      label: "19-foot-left",
      source: "Proper plantar digital branches of medial plantar nerve — left",
    },
    {
      label: "20-autonomic",
      source: "Left sympathetic trunk",
      note: "Sympathetic trunk/source ganglion sets and partial vagal course; not complete autonomic coverage.",
    },
  ];
  const results = [];
  for (const view of views) {
    await page.getByRole("button", { name: "Fit body", exact: true }).click();
    const clear = page.getByRole("button", {
      name: "Clear selection",
      exact: true,
    });
    if (await clear.count()) await clear.click();
    if (view.back)
      await page
        .getByRole("group", { name: "Camera views" })
        .getByRole("button", { name: "Back", exact: true })
        .click();
    if (view.region)
      await page
        .getByRole("button", { name: view.region, exact: true })
        .click();
    if (view.source) {
      await selectSource(page, view.source);
      const focus = page.getByRole("button", { name: "Focus", exact: true });
      if (view.missing) await expect(focus).toBeDisabled();
      else {
        await expect(focus).toBeEnabled();
        await focus.click();
      }
    }
    await page.getByRole("button", { name: "EN", exact: true }).hover();
    await page.screenshot({ path: join(captureDir, view.label + ".png") });
    results.push({
      ...view,
      status: view.missing
        ? "MISSING_GEOMETRY"
        : "PARTIAL_SOURCE_GEOMETRY_CAPTURED",
      metrics: JSON.parse(
        (await canvas.getAttribute("data-anatomy-metrics")) ?? "{}",
      ),
      medicalReview: "pending",
    });
  }
  await writeFile(
    join(captureDir, "coverage-views.json"),
    await format(JSON.stringify(results), { parser: "json" }),
  );
  await test.info().attach("coverage-views.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  expect(results).toHaveLength(20);
});
