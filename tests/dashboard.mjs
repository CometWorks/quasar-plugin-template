import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const manifest = JSON.parse(await readFile(new URL("../quasar-plugin.json", import.meta.url)));

async function checkPage(page, base) {
    const route = new URL(manifest.id, base).href;
    const artifactPrefix = new URL(`_quasar/sdk/v1/ui/assemblies/${manifest.id}/`, base).href;
    const [artifact] = await Promise.all([
        page.waitForResponse(r => r.url().startsWith(artifactPrefix)),
        page.goto(route)
    ]);
    assert.equal(artifact.status(), 200);
    assert.equal(artifact.headers()["cache-control"], "private, no-store");
    const digest = createHash("sha256").update(await artifact.body()).digest("hex");
    assert.equal(artifact.url(), artifactPrefix + digest);

    await page.getByRole("heading", { name: manifest.displayName, exact: true }).waitFor();
    const css = new URL(`_quasar/plugins/${manifest.id}/${manifest.stylesheets[0]}`, base).href;
    assert.ok(await page.evaluate(url => Array.from(document.styleSheets).some(s => s.href === url), css));

    async function readVersion() {
        await page.getByRole("button", { name: "Read installed version" }).click();
        await page.getByText("Installed version: " + manifest.version, { exact: true }).waitFor();
    }
    await readVersion();
    await page.reload();
    await readVersion();
    return artifact.url();
}

// Quasar's DashboardChecks supplies a signed-in browser and seeds the entity row.
export async function checkPlugin(page, base) {
    const artifact = await checkPage(page, base);
    const anonymous = await page.context().browser().newContext();
    try {
        assert.equal((await anonymous.request.get(artifact)).status(), 401);
        assert.equal((await anonymous.request.get(new URL(manifest.id, base).href)).status(), 401);
    } finally {
        await anonymous.close();
    }

    await page.goto(new URL("entities", base).href);
    const row = page.getByRole("row").filter({ hasText: "Fixture freighter" });
    await row.getByRole("button", { name: "Show entity details" }).click();
    await row.getByRole("status").filter({ hasText: "Fixture freighter (9007199254740993)" }).waitFor();
    await page.getByRole("link", { name: manifest.displayName, exact: true }).click();
    await page.getByRole("heading", { name: manifest.displayName, exact: true }).waitFor();
    assert.equal(page.url(), new URL(manifest.id, base).href);
    console.log(`Passed ${manifest.displayName} route, operation and entity action at ${base}`);
}

// Also run the page checks directly against a development panel with an installed package.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const base = new URL(process.env.QUASAR_TEST_PANEL_URL);
    const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
        ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
    const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
    try {
        const page = await browser.newPage({ storageState: process.env.QUASAR_TEST_STORAGE_STATE });
        await checkPage(page, base);
        console.log(`Passed ${manifest.displayName} page check at ${base.href}`);
    } finally {
        await browser.close();
    }
}
