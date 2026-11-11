#!/usr/bin/env node
// Studio 15 contract checks, not a substitute for authenticated browser E2E.
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {validateHoldAction} from "../netlify/functions/fotopolis-admin-reservations.mjs";
const read=path=>readFileSync(path,"utf8");
const root="preview-build/";
const manifest=JSON.parse(read(root+"manifest.webmanifest"));
assert.equal(manifest.id,"/");
assert.equal(manifest.scope,"/");
assert.equal(manifest.start_url,"/");
assert.equal(manifest.display,"standalone");
assert.ok(!existsSync(root+"admin/manifest.webmanifest"),"Competing private app identity must not deploy");
for(const path of ["admin/index.html","admin/login/index.html","admin/dashboard/index.html","admin/designstudio/index.html"]){
 const html=read(root+path);
 assert.equal((html.match(/rel="manifest"/g)||[]).length,1,"Only one manifest on "+path);
 assert.ok(html.includes('href="/manifest.webmanifest"'),"Wrong manifest "+path);
 assert.ok(html.includes('src="/pwa-update.js"'),"Missing unified update logic "+path);
}
const worker=read(root+"service-worker.js");
assert.ok(worker.includes("url.pathname.startsWith('/admin/')"),"Never cache staff routes");
assert.ok(worker.includes("url.pathname.startsWith('/api/')"),"Never cache protected API replies");
assert.ok(!worker.includes("'/admin/'"),"Never pre-cache private entry points");
assert.ok(worker.includes("v15-one-app-secure-r1"),"Old app cache not invalidated");

const example={
 resourceId:"11111111-1111-4111-8111-111111111111",
 eventStartUtc:"2026-12-01T12:00:00Z",
 eventEndUtc:"2026-12-01T14:00:00Z",
 occupiedFromUtc:"2026-12-01T11:00:00Z",
 occupiedUntilUtc:"2026-12-01T15:00:00Z"
};
const reference="22222222-2222-4222-8222-222222222222";
assert.equal(validateHoldAction({...example,inquiryId:reference},"POST").value.inquiryId,reference);
assert.equal(validateHoldAction(example,"POST").value.inquiryId,null);
assert.ok(validateHoldAction({...example,inquiryId:"unknown"},"POST").error);
assert.ok(validateHoldAction({...example,inquiryId:reference,confirmed:true},"POST").error,
 "Client must not force a binding confirmation");

const api=read("netlify/functions/fotopolis-admin-reservations.mjs");
assert.ok(api.includes("inquiry_id")&&api.includes('e?.code==="23503"'),
 "Reservation link must use database foreign key and safe missing-inquiry response");
assert.ok(api.includes("23P01"),"No-overlap conflict handling must survive");
const calendar=read("netlify/functions/fotopolis-admin-overview.mjs");
assert.ok(calendar.includes("occupied_until,inquiry_id"),"Calendar must expose linked inquiry id");
const editor=read("concepts/premium-v2/admin/dashboard/reservations-manager.js");
assert.ok(editor.includes("fotopolis:open-booking")&&editor.includes("inquiryId:linkedInquiryId"),
 "Calendar workflow must preserve an enquiry link");
const inbox=read("concepts/premium-v2/admin/dashboard/command-center-app.js");
assert.ok(inbox.includes("Vormerkung aus Anfrage planen")&&inbox.includes('["owner","manager"].includes(role)'),
 "Only staff roles allowed to book may receive the handoff action");
const migration=read("database/neon/007_studio15_inquiry_booking_link_dev.sql");
assert.ok(migration.includes("REFERENCES fotopolis_studio13.inquiries(id) ON DELETE RESTRICT"));
assert.ok(migration.includes("GRANT INSERT (inquiry_id)"));
assert.ok(migration.includes("GRANT SELECT (inquiry_id)"));
console.log("Studio 15 contract PASS: single app ID, uncached private routes, linked CRM-to-hold flow and database constraints.");
console.log("REAL E2E STILL OPEN: authenticated owner, form intake, conflict race, physical prints, migration rollback.");
