#!/usr/bin/env node
/* Studio 10 browser acceptance candidate: no real enquiries or admin writes.
 * Generates reproducible desktop/mobile screenshots and JSON evidence.
 * Visual comparison to an approved human baseline remains a separate step.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = process.env.FOTOPOLIS_QA_URL || "http://127.0.0.1:8765";
const out = "studio10-browser-results";
const widths = [360, 390, 430, 768, 1024, 1440, 1920];
const routes = [
  "/", "/fotobox/", "/fotospiegel/", "/fotowohnwagen/",
  "/pakete/", "/galerie/", "/anlaesse/", "/ueber-uns/",
  "/faq/", "/kontakt/", "/impressum/", "/datenschutz/",
  "/designvorlagen/", "/danke/"
];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], records = [];
try {
  for (const width of widths) {
    for (const route of routes) {
      const page = await browser.newPage({
        viewport: { width, height: width < 600 ? 844 : 900 },
        deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600,
        serviceWorkers: "block"
      });
      const jsErrors = [];
      const httpErrors = [];
      page.on("pageerror", error => jsErrors.push(error.message));
      page.on("response", response => {
        if (response.status() >= 400 && response.url().startsWith(base))
          httpErrors.push(response.status() + " " + response.url());
      });
      const key = (route === "/" ? "home" : route.replaceAll("/", "")) + "-" + width;
      try {
        const response = await page.goto(base + route, { waitUntil: "networkidle", timeout: 30000 });
        if (!response || response.status() !== 200)
          throw new Error("HTTP " + (response?.status() ?? "no response"));
        await page.evaluate(() => document.fonts.ready);
        const data = await page.evaluate(() => {
          const html = document.documentElement;
          const headLogo = document.querySelector(".studio-header img");
          const main = document.querySelector("main");
          const header = document.querySelector(".studio-header");
          return {
            viewport: innerWidth,
            scrollWidth: html.scrollWidth,
            bodyWidth: document.body.scrollWidth,
            title: document.title,
            headerLogo: headLogo?.getAttribute("src") || "",
            headerLogoLoaded: !!headLogo?.naturalWidth,
            mainPresent: !!main,
            headerBackground: header ? getComputedStyle(header).backgroundColor : "",
            blueThemeMeta: document.querySelector('meta[name="theme-color"]')?.content || "",
            stylesheet: !!document.querySelector('link[href="/studio10-premium.css"]'),
            brokenImages: [...document.images].filter(img => img.getAttribute("src")?.trim() && img.complete && !img.naturalWidth).map(img => img.currentSrc || img.src)
          };
        });
        const problems = [];
        if (!data.mainPresent || !data.stylesheet) problems.push("Missing main or Studio 10 stylesheet");
        if (!data.headerLogo.includes("fotopolis-goldmark.webp") || !data.headerLogoLoaded)
          problems.push("Wrong, absent or unloaded header logo");
        if (data.scrollWidth > width + 2 || data.bodyWidth > width + 2)
          problems.push("Horizontal overflow: " + Math.max(data.scrollWidth, data.bodyWidth) + "px");
        if (data.blueThemeMeta.toLowerCase() !== "#15120f")
          problems.push("Incorrect UI theme-color");
        if (data.brokenImages.length) problems.push("Broken images: " + data.brokenImages.join(", "));
        if (jsErrors.length) problems.push("JavaScript exceptions: " + jsErrors.join(" | "));
        if (httpErrors.length) problems.push("Failed requests: " + httpErrors.join(" | "));
        if (route === "/") {
          const hero = await page.locator(".v45-hero .v4-hero-visual img").evaluate(
            el => ({ src: el.getAttribute("src"), loaded: el.naturalWidth > 0 })
          );
          if (!hero.loaded || !hero.src.includes("fotospiegel-hero-lossless.webp"))
            problems.push("Approved Mirror flagship hero missing");
          if (await page.locator(".v4-product-card").count() !== 3)
            problems.push("Three product cards required");
        }
        if (route === "/kontakt/") {
          if (await page.locator('form[name="fotopolis-studio9-anfrage"]').count() !== 1)
            problems.push("Secure contact form missing");
          if (await page.locator('select[name="vorlage"] option').count() !== 45)
            problems.push("44 design choices + placeholder required");
          if (await page.locator('input[name="datenschutz_ok"]').count() !== 1)
            problems.push("Consent input missing");
        }
        if (["/fotobox/", "/fotospiegel/", "/fotowohnwagen/"].includes(route)) {
          if (await page.locator("[data-product-request]").count() !== 1)
            problems.push("Product enquiry missing");
          if (await page.locator('select[name="vorlage"] option').count() !== 45)
            problems.push("Product design picker incomplete");
        }
        if (route === "/designvorlagen/") {
          const count = await page.evaluate(async () => {
            const res = await fetch("/assets/design-gallery-data.json");
            return res.ok ? (await res.json()).length : -1;
          });
          if (count !== 44) problems.push("Design catalog not 44 items");
        }
        if (route === "/" && width === 390) {
          const menu = page.locator("[data-menu-toggle]");
          await menu.click();
          const expanded = await menu.getAttribute("aria-expanded");
          if (expanded !== "true") problems.push("Mobile navigation toggle did not open");
          await menu.click();
        }
        if ([390, 1440].includes(width) || problems.length) {
          await page.screenshot({
            path: join(out, key + ".png"), fullPage: true, animations: "disabled"
          });
        }
        records.push({ route, width, ...data, status: problems.length ? "fail" : "pass", problems });
        for (const problem of problems) errors.push(key + ": " + problem);
      } catch (error) {
        errors.push(key + ": " + error.message);
        records.push({ route, width, status: "error", error: error.message });
        try { await page.screenshot({ path: join(out, key + "-failure.png"), fullPage: true }); } catch {}
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
const report = {
  version: "Studio 10.0",
  checked: records.length,
  failures: errors.length,
  dateUTC: new Date().toISOString(),
  scope: "automated browser checks only; no forms submitted; no human pixel/signature approval",
  viewports: widths,
  routes, results: records, errors
};
await writeFile(join(out, "report.json"), JSON.stringify(report, null, 2));
console.log("Studio 10 browser QA: " + records.length + " combinations, " + errors.length + " issues");
if (errors.length) {
  console.error(errors.slice(0, 40).join("\n"));
  process.exitCode = 1;
}
