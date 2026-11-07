// Read signed Neon Auth JWTs without persisting or logging credentials.
const jwtPattern=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
export function readJwt(result) {
  const candidates=[result?.data?.session?.token,result?.data?.token,result?.token];
  return candidates.find(t=>typeof t==="string"&&t.length<=6000&&jwtPattern.test(t))||null;
}
export async function getAdminJwt(client,sessionResult){
  // Neon Auth 0.7 injects the verified session's signed JWT via set-auth-jwt.
  const sessionJwt=readJwt(sessionResult);
  if(sessionJwt)return sessionJwt;
  // Some SDK versions require a separate Better Auth JWT plugin request.
  try{
    const issued=readJwt(await client.token());
    if(issued)return issued;
  }catch{ /* Fail closed; no auth details in logs. */ }
  // Avoid a stale cached session after a successful password login.
  try{
    return readJwt(await client.getSession({fetchOptions:{headers:{"X-Force-Fetch":"true"}}}));
  }catch{return null}
}
