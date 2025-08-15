"use client"

export const ACTIVE_ORG_COOKIE_NAME = "active_org_id"
export const ACTIVE_ORG_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function getActiveOrgIdFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const cookies = document.cookie.split(";").map((c) => c.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith(`${ACTIVE_ORG_COOKIE_NAME}=`)) {
      const value = cookie.split("=")[1]
      try {
        return decodeURIComponent(value)
      } catch {
        return value
      }
    }
  }
  return null
}

export function setActiveOrgIdCookie(
  orgId: string,
  maxAge: number = ACTIVE_ORG_COOKIE_MAX_AGE
) {
  if (typeof document === "undefined") return
  const encoded = encodeURIComponent(orgId)
  document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=${encoded}; path=/; max-age=${maxAge}`
}

export function clearActiveOrgIdCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${ACTIVE_ORG_COOKIE_NAME}=; path=/; max-age=0`
}


