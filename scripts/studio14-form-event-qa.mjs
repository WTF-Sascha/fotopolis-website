#!/usr/bin/env node
/* Data-contract tests only. Never send a real Netlify Form or write a customer row. */
import assert from "node:assert/strict";
import {normalizeVerifiedForm,formSubmitted} from "../netlify/functions/fotopolis-studio14-form-events.mjs";
const id="c5c09d1e-c2eb-40eb-8bb9-fb68b9f58df1";
const verified={
 "form-name":"fotopolis-studio9-anfrage",
 fp_request_key:id,
 name:"Synthetic Test",
 email:"not-a-customer@invalid.example",
 telefon:"",
 produkt:"Fotospiegel",
 datum:"2026-12-12",
 ort:"Testort",
 vorlage:"FP-033",
 details:"Nur QA, niemals an Netlify senden",
 datenschutz_ok:"Ja",
 website:""
};
const mapped=normalizeVerifiedForm(verified);
assert.ok(mapped,"Verified consented submission must map to CRM intake");
assert.equal(mapped.key,id);
assert.equal(mapped.name,"Synthetic Test");
assert.equal(mapped.product,"Fotospiegel");
assert.equal(mapped.template,"FP-033");
assert.equal(mapped.date,"2026-12-12");
assert.equal(mapped.source,"website");
assert.equal(mapped.honeypot,false);
assert.equal(normalizeVerifiedForm({...verified, "form-name":"unrelated"}),null);
assert.equal(normalizeVerifiedForm({...verified, fp_request_key:""}),null);
assert.equal(normalizeVerifiedForm({...verified, datenschutz_ok:""}),null);
assert.equal(normalizeVerifiedForm({...verified, datenschutz_ok:"Nein"}),null);
assert.equal(normalizeVerifiedForm({...verified, email:"invalid"}),null);
assert.equal(normalizeVerifiedForm({...verified, datum:"2026-02-30"}),null);
assert.equal(normalizeVerifiedForm({...verified, vorlage:"FP-000"}),null);
assert.equal(normalizeVerifiedForm({...verified, website:"bot"}).honeypot,true);
assert.ok(normalizeVerifiedForm({...verified, "form-name":undefined}),
 "Netlify may omit its hidden technical form-name after verification");
await formSubmitted({data:{"form-name":"different-form"}});
await formSubmitted({data:{...verified,datenschutz_ok:""}});
console.log("STUDIO 14 VERIFIED-FORM EVENT QA PASS: known form, shared UUID, consent, validation, honeypot and unrelated-form rejection; no data written.");
