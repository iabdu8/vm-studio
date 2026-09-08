-- ============================================================
--  SECURITY TEST PLAN
--  Run in an isolated Supabase test project, never production.
-- ============================================================
-- These assertions describe the security invariants introduced by
-- database/migrations/045_security_core_safety.sql.

-- 1. A normal authenticated user cannot update their own role.
-- expect: ERROR "Users cannot change administrative profile fields"
-- update public.profiles set role = 'manager' where id = auth.uid();

-- 2. A normal authenticated user cannot move themselves to another company.
-- expect: ERROR "Users cannot change administrative profile fields"
-- update public.profiles set company_id = gen_random_uuid() where id = auth.uid();

-- 3. A normal authenticated user cannot move themselves to another branch.
-- expect: ERROR "Users cannot change administrative profile fields"
-- update public.profiles set branch_id = gen_random_uuid() where id = auth.uid();

-- 4. Signup completion must use complete_profile_from_invite().
-- expect: direct metadata from auth.users is ignored by handle_new_user().

-- 5. Expired or used scoped invites must be rejected by the database.
-- expect: lookup_scoped_invite() returns no row when expires_at <= now()
-- or used_by/used_at are set.
-- expect: complete_profile_from_invite() raises
-- "Invalid, expired, or already used invite" for expired/used codes.

-- 6. Existing scoped invites without expires_at remain valid until used.
-- expect: lookup_scoped_invite() can return a matching unused row when
-- expires_at is null.

-- 7. A VM can only mark assigned/all tasks done through mark_task_done().
-- expect: direct task row update is denied by RLS; RPC succeeds only in scope.

-- 8. A reviewer can update only review fields through review_submission_secure().
-- expect: cross-company or out-of-branch review raises "not permitted".

-- 9. A VM attendee can update own attendance status only.
-- expect: updating score/note directly raises "Attendees can only update...".

-- 10. send-push rejects requests without a valid JWT.
-- expect: HTTP 401.

-- 11. send-push rejects target users outside caller's company.
-- expect: HTTP 403 or user excluded from delivery.

-- 12. Head VM can operate inside own company only.
-- expect: company_id = public.my_company_id() is required for managed tables.

-- 13. Area manager/store manager scopes are enforced by branch in RLS.
-- expect: reads/mutations outside managed/current branch return no rows.

-- 14. A user cannot self-escalate through profiles.
-- expect: role/company_id/branch_id/is_active changes raise
-- "Users cannot change administrative profile fields".
