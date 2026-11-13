// Studio 14 secure verified-Form intake for the isolated FOTOPOLIS preview.
// Netlify verifies the platform event's JWS before invoking formSubmitted.
// No HTTP endpoint, notification emails, production bookings or PII logging.
import {neon} from "@neondatabase/serverless";
import {validateEnquiry} from "./fotopolis-studio13-public.mjs";

const formName="fotopolis-studio9-anfrage";
const acceptedConsent=new Set(["ja","on","true","1"]);

export function normalizeVerifiedForm(data){
 if(!data||typeof data!=="object"||Array.isArray(data))return null;
 const declared=data["form-name"]||data.form_name||"";
 if(declared&&declared!==formName)return null;
 // The key is generated before posting to Netlify Forms and shared with
 // the browser fallback. Never fabricate a replacement key.
 if(typeof data.fp_request_key!=="string"||typeof data.name!=="string"||
    typeof data.email!=="string")return null;
 if(typeof data.datenschutz_ok!=="string"||
    !acceptedConsent.has(data.datenschutz_ok.trim().toLowerCase()))return null;
 const payload={
   requestKey:data.fp_request_key,
   source:"website",
   fullName:data.name,
   email:data.email,
   phone:data.telefon||"",
   product:data.produkt||"Noch offen",
   eventDate:data.datum||null,
   eventLocation:data.ort||"",
   templateId:data.vorlage||null,
   notes:data.details||data.notiz||"",
   consentConfirmed:true,
   website:data.website||""
 };
 return validateEnquiry(payload);
}

// Netlify exposes environment variables in the current deploy context.
// The platform FormSubmittedEvent formally guarantees event.data only; do not
// infer a deploy/branch from user-controlled form fields or undocumented metadata.
// Context-specific Netlify Functions secrets select the existing isolated DEV DB.
// Production has neither DEV alias and MUST NOT fall back to DEV.
export function selectVerifiedFormDatabase(getEnv){
 const preview=getEnv("FOTOPOLIS_STUDIO13_DEV_DB_URL");
 const staging=getEnv("FOTOPOLIS_STAGING_STUDIO13_DEV_DB_URL");
 if(preview&&staging)throw new Error("Ambiguous FOTOPOLIS form database context");
 if(preview)return {connection:preview,context:"deploy-preview"};
 if(staging)return {connection:staging,context:"branch-deploy"};
 return null;
}

export async function formSubmitted(event){
 const submission=normalizeVerifiedForm(event?.data);
 // Silently ignore unrelated forms, honeypot spam, and invalid payloads.
 if(!submission||submission.honeypot)return;
 const database=selectVerifiedFormDatabase(name=>Netlify.env.get(name));
 if(!database)throw new Error("FOTOPOLIS verified-form intake: no authorized database for deploy context");
 const sql=neon(database.connection);
 // Idempotency: a browser-side mirror, a retried event, or a delayed delivery
 // must never create two inbox items. The unique request_key is shared.
 // Only the initial insert creates the audit entry.
 const saved=await sql`
   WITH inserted AS (
     INSERT INTO fotopolis_studio13.inquiries
       (request_key,source,full_name,email,phone,product,event_date,
        event_location,template_id,notes,consent_confirmed)
     VALUES (${submission.key}::uuid,${submission.source},${submission.name},
        ${submission.email},${submission.phone},${submission.product},
        ${submission.date}::date,${submission.location},${submission.template},
        ${submission.notes},true)
     ON CONFLICT(request_key) DO NOTHING RETURNING id
   ), history AS (
     INSERT INTO fotopolis_studio13.inquiry_history(inquiry_id,action)
     SELECT id,'eingegangen' FROM inserted
     RETURNING inquiry_id
   ) SELECT id FROM inserted`;
 // Do not log customer data; a count alone is enough for server audit.
 console.info("FOTOPOLIS verified form intake:",saved.length?"stored":"already-synced");
}

// Netlify's event API invokes this only for a platform-verified form
// submission; it has no publicly addressable unauthenticated fetch handler.
export default {formSubmitted};
