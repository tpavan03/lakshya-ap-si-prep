# Hosted backend verification

Checked on 28 October 2026 using the existing Vercel-linked environment, without printing credentials or creating accounts.

- The frontend has both Supabase URL and publishable key configured. The existing `user_state` payload model can store the new exam-scoped version3 JSON without a table migration.
- The configured project host, `hasoucogsrzntyfguqzj.supabase.co`, fails local DNS resolution. An independent Google Public DNS-over-HTTPS A-record query returns status3 (NXDOMAIN) with no answers. A control query for `supabase.com` returns status0 with an address.
- Therefore `/auth/v1/health`, `/auth/v1/settings`, and anonymous `user_state` read/write-denial probes could not reach a server. No probe mutation was executed. Hosted RLS behaviour, Google-provider settings, and an authenticated save/reload roundtrip remain unverified. No authenticated test session was available.
- Existing SQL enables RLS and limits select, insert and update to `auth.uid() = user_id`. This source inspection is not proof that a currently reachable hosted database has those policies installed.
- Restoring the existing Supabase project, or supplying the correct current linked project URL and publishable key in Vercel, is required for live cloud authentication and progress sync. The app retains device-only use and JSON backups in the meantime.

The sync hook now gates writes until the current account’s hydration succeeds, rejects stale results from earlier accounts, keeps separate local account caches, preserves work across same-account token refreshes, serializes writes, and retries failed hydration through **Sync now**. Unknown legacy local ownership is not copied into a newly restored account. Existing cloud rows remain authoritative; guest work can seed an empty row only after explicit sign-in, and a previous account’s data can never seed another account.

Initialization, hydration and writes are bounded to12 seconds so an unreachable backend cannot leave the app indefinitely on its restoration screen. Native callback handling validates the registered scheme and host. AP and NICL progress continue to share the established per-user backend row, with separate exam namespaces inside its payload.
