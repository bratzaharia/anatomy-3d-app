import { expect, test } from "@playwright/test";

test("sourced skeleton selection, filters, focus, and language preserve the cached asset", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  let modelRequests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("bodyparts3d-skeleton.glb")) modelRequests++;
  });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Schelet uman 3D interactiv — BodyParts3D" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "BodyParts3D 4.0 CC BY 4.0" }),
  ).toBeVisible();
  await expect(page.getByLabel(/Sistem muscular/)).toBeEnabled();

  // A real raycast on the front-view skull verifies geometry-to-catalog mapping.
  const canvas = page.locator("canvas");
  const size = await canvas.boundingBox();
  if (!size) throw new Error("Canvas bounds unavailable");
  const skullPoint = { x: size.width * 0.5, y: size.height * 0.15 };
  await canvas.click({ position: skullPoint });
  await expect(
    page.getByRole("heading", { name: "Os frontal", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".member-list button")).toHaveCount(22);

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Frontal bone",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Skeletal system")).toBeChecked();
  await page.getByLabel("Skeletal system", { exact: true }).uncheck();
  await expect(
    page.getByText("Hidden by current filters", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear selection" }).click();
  await canvas.click({ position: skullPoint });
  await expect(
    page.getByRole("heading", {
      name: "Frontal bone",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Choose at least one anatomical layer"),
  ).toBeVisible();
  await page.getByLabel("Skeletal system", { exact: true }).check();

  await page.getByPlaceholder("E.g. humerus, skull…").fill("left humerus");
  await page.getByRole("button", { name: /^Left humerus/ }).click();
  await expect(
    page.getByRole("heading", { name: "Left humerus" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Isolate", exact: true }).click();
  await page
    .getByRole("button", { name: "Restore visibility", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Whole body", exact: true }).click();
  await page
    .getByRole("group", { name: "Camera views" })
    .getByRole("button", { name: "Back", exact: true })
    .click();
  await page.getByRole("button", { name: "Fit body", exact: true }).click();
  expect(modelRequests).toBe(1);
  expect(errors).toEqual([]);
});

test("model failure has a localized retry path", async ({ page }) => {
  await page.route("**/models/bodyparts3d-skeleton.glb", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.goto("/");
  await expect(
    page.getByText("Scheletul 3D nu a putut fi încărcat.", { exact: false }),
  ).toBeVisible();
  await page.unroute("**/models/bodyparts3d-skeleton.glb");
  await page.getByRole("button", { name: "Reîncearcă", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Schelet uman 3D interactiv — BodyParts3D" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("tablet starts with the skeleton unobstructed and navigation available as a drawer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Deschide sau închide navigarea" })
    .click();
  await expect(page.getByLabel("Sistem osos")).toBeChecked();
  await page
    .getByRole("button", { name: "Deschide sau închide navigarea" })
    .click();
  await expect(page.getByRole("complementary")).toHaveCount(0);
});
