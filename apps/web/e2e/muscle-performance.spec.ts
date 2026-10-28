import { expect, test } from "@playwright/test";

test("records muscular demand-rendering, cache and frame metrics", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?diagnostics");
  const canvas = page.locator("canvas");
  const read = async () =>
    JSON.parse((await canvas.getAttribute("data-anatomy-metrics")) ?? "{}");
  await expect.poll(async () => (await read()).triangles).toBe(513166);
  const boneMetrics = await read();
  const start = Date.now();
  await page.getByLabel("Sistem muscular", { exact: true }).check();
  await expect.poll(async () => (await read()).triangles).toBe(2900690);
  const enableToRenderedMs = Date.now() - start;
  const combinedMetrics = await read();
  // A deliberate measurement interval, not an application animation delay.
  await page.waitForTimeout(500);
  const idleStart = await read();
  await page.waitForTimeout(1000);
  const idleEnd = await read();
  expect(idleEnd.frames).toBe(idleStart.frames);
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Missing canvas bounds");
  const begin = Date.now(),
    frameStart = (await read()).frames;
  await page.mouse.move(
    bounds.x + bounds.width * 0.5,
    bounds.y + bounds.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.6,
    bounds.y + bounds.height * 0.5,
    { steps: 5 },
  );
  await page.mouse.up();
  const orbitDurationMs = Date.now() - begin,
    orbitFrames = (await read()).frames - frameStart;
  const warmStart = Date.now();
  await page.getByLabel("Sistem muscular", { exact: true }).uncheck();
  await expect.poll(async () => (await read()).calls).toBe(50);
  await page.getByLabel("Sistem muscular", { exact: true }).check();
  await expect.poll(async () => (await read()).calls).toBe(405);
  const warmToggleMs = Date.now() - warmStart;
  const after = await read();
  expect(after.geometries).toBe(combinedMetrics.geometries);
  const environment = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext("webgl2");
    const extension = context?.getExtension("WEBGL_debug_renderer_info");
    return {
      userAgent: navigator.userAgent,
      renderer:
        context && extension
          ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL)
          : "unavailable",
    };
  });
  const report = {
    environment,
    viewport: { width: 1440, height: 960 },
    boneMetrics,
    combinedMetrics,
    enableToRenderedMs,
    idleFramesDuringOneSecond: idleEnd.frames - idleStart.frames,
    orbitDurationMs,
    orbitFrames,
    renderedFramesPerSecondDuringScriptedOrbit:
      (1000 * orbitFrames) / orbitDurationMs,
    warmDisableEnableRoundTripMs: warmToggleMs,
    after,
  };
  await test.info().attach("muscle-performance.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  process.stdout.write(JSON.stringify(report) + "\n");
});
