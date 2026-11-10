// FOTOPOLIS development build. Only the public Neon Auth URL is bundled.
import {build} from "esbuild";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";

const jobs=[
 {source:"concepts/premium-v2/admin/login/login.js",target:"preview-build/admin/login/login-bundle.js",html:"preview-build/admin/login/index.html"},
 {source:"concepts/premium-v2/admin/dashboard/dashboard.js",target:"preview-build/admin/dashboard/dashboard-bundle.js",html:"preview-build/admin/dashboard/index.html"},
 {source:"concepts/premium-v2/admin/designstudio/boot.js",target:"preview-build/admin/designstudio/boot-bundle.js",html:"preview-build/admin/designstudio/index.html"}
];
for(const item of jobs){
  if(!existsSync(item.html)){
    // Older Studio 12 workflows deliberately build the untouched historical baseline.
    // They may omit the Studio 13 hardening stage ONLY within GitHub Actions QA.
    // A real Netlify preview deployment must fail rather than publish a public editor.
    if(item.source.includes("/designstudio/") && process.env.GITHUB_ACTIONS==="true" && !process.env.NETLIFY){
      console.warn("Legacy GitHub QA: Studio 13 secure-editor bootstrap not in historical Studio 12 build");
      continue;
    }
    throw Error("Private Studio 13 hardening missing: do not deploy a public editor");
  }
  await build({
    entryPoints:[item.source],outfile:item.target,
    bundle:true,minify:true,format:"esm",platform:"browser",target:["es2022"],
    sourcemap:false,legalComments:"none",logLevel:"info",
    define:{"process.env.NODE_ENV":'"production"'}
  });
  const code=readFileSync(item.target,"utf8");
  if(!code.includes("ep-withered-hat-b930f72a.neonauth"))throw Error("Wrong Neon Auth development branch endpoint");
  if(/postgresql:\/\/|FOTOPOLIS_NEON_DEV_(AUTH_READER|DASHBOARD_READER)_URL|service_role/i.test(code))throw Error("Secrets or database credentials in browser output");
}
console.log("FOTOPOLIS 3.6: password login and protected dashboard clients bundled without database credentials");
