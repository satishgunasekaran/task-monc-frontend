import { cookies } from "next/headers"

export const ACTIVE_ORG_COOKIE_NAME = "active_org_id"
export const ACTIVE_ORG_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function getActiveOrgIdServer(): Promise<string | null> {
  const store = await cookies()
  const c = store.get(ACTIVE_ORG_COOKIE_NAME)
  return c?.value ?? null
}

export async function setActiveOrgIdServer(orgId: string) {
  const store = await cookies()
  store.set(ACTIVE_ORG_COOKIE_NAME, orgId, {
    path: "/",
    maxAge: ACTIVE_ORG_COOKIE_MAX_AGE,
    sameSite: "lax",
  })
}

export async function clearActiveOrgIdServer() {
  const store = await cookies()
  store.set(ACTIVE_ORG_COOKIE_NAME, "", { path: "/", maxAge: 0 })
}


