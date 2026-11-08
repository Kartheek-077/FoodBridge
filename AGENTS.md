<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (FoodBridge)

- All HTTP calls go through the single Axios instance and service objects in `src/lib/api.ts`; never call `fetch`/axios directly from components. Why: one place for baseURL, JWT header and 401 handling.
- Mock mode (`VITE_USE_MOCK`, on unless set to `"false"`) swaps in an Axios adapter backed by `src/lib/mock/*`; the mock must enforce the same rules the real Express backend will (roles, verified-NGO-only claims, status transitions). Why: every screen works before the backend exists, and tests in `src/test/foodbridge-rules.test.ts` exercise those rules.
- Real-time events come from `src/lib/socket.ts` (`connectSocket`), consumed only by `NotificationContext`; mock mode uses a BroadcastChannel bus so separate tabs see each other's events. Why: one subscription point for toasts and cache invalidation.
- Auth is a JWT in localStorage read after hydration by `AuthContext`; route protection uses `<ProtectedRoute roles>` inside route components (layouts `donor.tsx`, `ngo.tsx`, `admin.tsx`), not `beforeLoad`. Why: SSR cannot see localStorage.
- Routing is TanStack Router file routes (the brief's "React Router" requirement maps to this); page components live in route files, shared UI in `src/components`.
- Endpoints added beyond the original contract: `PUT /auth/me` (profile), `GET /admin/users` (user list); `GET /admin/stats` must return the public impact counters to anonymous callers. Why: the landing counters, profile page and admin user list need them.
