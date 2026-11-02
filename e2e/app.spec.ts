import { expect, test } from "@playwright/test";

test("local mode routes, editor tokens, and description modal", async ({
  page,
}) => {
  await page.goto("/#/");
  await expect(page.getByText("Local workspace")).toBeVisible();
  await page.getByRole("link", { name: "Designs" }).click();
  await expect(page.getByText("Import from TLT")).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByText("DESCRICAO", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Generate" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page
    .getByRole("button", { name: /Edit description:/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Original value:")).toBeVisible();
  await dialog.locator("textarea").fill("Café premium com ç, ã, é e õ");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("button", { name: /Café premium/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Undo last description edit/ }),
  ).toBeVisible();
});

test("deep link with invalid design id recovers without crashing", async ({
  page,
}) => {
  await page.goto("/#/designs/not-a-real-id/edit");
  await expect(
    page.getByRole("heading", { name: "Design not found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to Designs" }).click();
  await expect(page.getByRole("heading", { name: "Designs" })).toBeVisible();
});
