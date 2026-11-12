#!/usr/bin/env node
/* Fail-closed release interlock.
 * Studio 15 has no dedicated production DB/Neon Auth wiring yet. A git merge
 * must never silently make the new admin UI look usable on an incomplete main.
 * Remove/replace this block ONLY in a separately approved, fully tested release
 * commit after production authorization, data migration and rollback signoff.
 *
 * Direct manual deploy uploads bypass build commands and require an independent
 * deployment permission gate in Netlify. This interlock is defense in depth,
 * NOT a replacement for GitHub branch protection or Netlify deploy controls.
 */
const context=process.env.CONTEXT||"local";
if(context==="production"){
 console.error(
  "FOTOPOLIS RELEASE NO-GO: Studio 15 cannot be built for production "+
  "before approval, separate production database/Auth/API setup, real E2E "+
  "and rollback validation. No DEV credential fallback is allowed."
 );
 process.exitCode=1;
}else{
 console.log("FOTOPOLIS release interlock: non-production context "+context);
}
