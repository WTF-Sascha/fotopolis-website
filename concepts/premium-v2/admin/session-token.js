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
  // Prefer the managed SDK's JWT accessor when available. It handles
  // cross-origin session refresh without reading opaque session cookies.
  try{
    if(typeof client?.getJWTToken==="function"){
      const issued=await client.getJWTToken();
      if(typeof issued==="string"&&issued.length<=6000&&jwtPattern.test(issued))return issued;
    }
  }catch{ /* Continue with the legacy signed-token endpoint. */ }
  // Compatibility path for pinned SDK versions exposing the JWT plugin.
  try{
    const issued=readJwt(await client.token());
    if(issued)return issued;
  }catch{ /* Fail closed; no auth details in logs. */ }
  // Avoid a stale cached session after a successful password login.
  try{
    return readJwt(await client.getSession({fetchOptions:{headers:{"X-Force-Fetch":"true"}}}));
  }catch{return null}
}
