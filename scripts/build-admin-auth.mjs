// Bundles only the official Neon Auth browser SDK, no database driver/secret.
import { build } from "esbuild";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outDir="preview-build/admin/login";
if(!existsSync(join(outDir,"index.html")))throw Error("Run Python review build first");
mkdirSync(outDir,{recursive:true});
await build({
  entryPoints:["concepts/premium-v2/admin/login/login.js"],
  outfile:join(outDir,"login-bundle.js"),
  bundle:true,
  minify:true,
  format:"esm",
  platform:"browser",
  target:["es2022"],
  sourcemap:false,
  legalComments:"none",
  logLevel:"info",
  define:{"process.env.NODE_ENV":'"production"'}
});
const data=readFileSync(join(outDir,"login-bundle.js"),"utf8");
if(!data.includes("ep-withered-hat-b930f72a.neonauth"))throw Error("Incorrect development Neon Auth endpoint");
if(/postgresql:\/\/|FOTOPOLIS_NEON_DEV_AUTH_READER_URL/.test(data))throw Error("No database credentials allowed in browser bundle");
console.log("FOTOPOLIS 3.5: isolated, minified Neon Auth OTP client built");
