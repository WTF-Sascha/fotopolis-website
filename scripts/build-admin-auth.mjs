// FOTOPOLIS development build. Only the public Neon Auth URL is bundled.
import {build} from "esbuild";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";

const jobs=[
 {source:"concepts/premium-v2/admin/login/login.js",target:"preview-build/admin/login/login-bundle.js",html:"preview-build/admin/login/index.html"},
 {source:"concepts/premium-v2/admin/dashboard/dashboard.js",target:"preview-build/admin/dashboard/dashboard-bundle.js",html:"preview-build/admin/dashboard/index.html"}
];
for(const item of jobs){
  if(!existsSync(item.html))throw Error("Run Python preview build first");
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
