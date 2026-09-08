import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const migration045 = read("database/migrations/045_security_core_safety.sql");
const migration046 = read("database/migrations/046_invite_expiration.sql");
const migrations = `${migration045}\n${migration046}`;
const sendPush = read("supabase/functions/send-push/index.ts");
const register = read("src/components/shared/RegisterPage.jsx");
const appContext = read("src/context/AppContext.jsx");
const dataService = read("src/services/data.service.js");
const training = read("src/components/manager/Training.jsx");
const i18n = read("src/lib/i18n.js");
const storeVisits = read("src/components/manager/StoreVisits.jsx");

const checks = [
  ["profile self escalation guard exists", /guard_profile_sensitive_update/.test(migrations)],
  ["own profile update policy was replaced", /drop policy if exists "user_update_own_profile"/.test(migrations)],
  ["invite completion RPC exists", /complete_profile_from_invite/.test(migrations)],
  ["head vm invite does not require branch", /v_role in \('store_manager','vm'\)/.test(migrations) && /'area_manager','manager'/.test(migrations)],
  ["flat company invite codes complete server-side", /controller_invite_code/.test(migrations) && /manager_invite_code/.test(migrations) && /v_single_use_invite/.test(migrations)],
  ["signup trigger no longer trusts role metadata", /role,\s*company_id,\s*branch_id,\s*is_active/.test(migrations) && !/raw_user_meta_data->>'role'/.test(migrations)],
  ["invite expiration column is backward-compatible", /add column if not exists expires_at timestamptz/.test(migration046)],
  ["expired scoped invites are hidden server-side", /lookup_scoped_invite/.test(migration046) && /expires_at is null or i\.expires_at > now\(\)/.test(migration046)],
  ["expired invite completion is rejected server-side", /complete_profile_from_invite/.test(migration046) && /expires_at is null or expires_at > now\(\)/.test(migration046)],
  ["used invite completion is rejected server-side", /used_by is null/.test(migration046) && /used_at is null/.test(migration046)],
  ["task done RPC exists", /mark_task_done/.test(migrations) && /drop policy if exists "vm_update_task_done"/.test(migrations)],
  ["submission review RPC exists", /review_submission_secure/.test(migrations)],
  ["attendance self-update guard exists", /guard_attendance_self_update/.test(migrations)],
  ["attendance status uses schema value present", /p_status not in \('pending','present','absent'\)/.test(migrations) && /"present"/.test(training) && !/'attended'/.test(migrations)],
  ["role-scoped task reads exist", /role_scoped_read_tasks/.test(migrations)],
  ["role-scoped submission reads exist", /role_scoped_read_submissions/.test(migrations)],
  ["production wide visit policies are dropped", /drop policy if exists "company_all_store_visits"/.test(migrations) && /drop policy if exists "company_all_floor_walks"/.test(migrations) && /drop policy if exists "company_all_visit_findings"/.test(migrations)],
  ["visit workflows are branch scoped for managers", /public\.can_manage_branch\(branch_id\)/.test(migrations) && /public\.can_manage_branch\(v\.branch_id\)/.test(migrations)],
  ["area manager scope comes from manager_branches", /manager_branches where manager_id = auth\.uid\(\)/.test(migrations)],
  ["store manager scope is own branch only", /p_branch_id = \(select branch_id from public\.profiles where id = auth\.uid\(\)\)/.test(migrations)],
  ["private storage buckets are planned", /vm-photos-private/.test(migrations) && /vm-guidelines-private/.test(migrations)],
  ["client no longer sends role/company metadata in signup", /options:\s*\{\s*data:\s*\{\s*full_name/.test(register) && !/options:\s*\{\s*data:\s*\{[^}]*role/.test(register)],
  ["registration accepts scoped invite RPC fallback", /lookupCompanyByCode\(upperCode\) \?\? await lookupScopedInvite\(upperCode\)/.test(register)],
  ["new invites can carry an optional expiration", /expiresAt = null/.test(read("src/services/enterprise.service.js")) && /expires_at: expiresAt/.test(read("src/services/enterprise.service.js"))],
  ["client completes profile through invitation RPC", /completeProfileFromInvite/.test(register)],
  ["pending invite survives email confirmation", /vismo_pending_invite/.test(register) && /vismo_pending_invite/.test(appContext)],
  ["task toggle uses RPC path", /markTaskDone/.test(dataService) && /rpc\("mark_task_done"/.test(dataService)],
  ["submission review uses RPC path", /rpc\("review_submission_secure"/.test(dataService)],
  ["send-push requires authorization header", /Authentication required/.test(sendPush) && /auth\.getUser/.test(sendPush)],
  ["send-push filters targets by caller company", /\.eq\("company_id", caller\.company_id\)/.test(sendPush)],
  ["send-push applies role scoped targets", /managedBranchIds/.test(sendPush) && /caller\.role === "store_manager"/.test(sendPush) && /return false/.test(sendPush)],
  ["send-push validates UUID targets", /\[0-9a-f-\]\{36\}/.test(sendPush)],
  ["send-push has recipient guard", /uniqueUserIds\.length > 100/.test(sendPush)],
  ["language switch is dynamic", /setLanguage/.test(i18n) && /toggleLanguage/.test(i18n) && /document\.documentElement\.dir/.test(i18n)],
  ["store visit draft creation is guarded against duplicate inserts", /draftVisitRef/.test(storeVisits) && /creatingVisitRef/.test(storeVisits) && /if \(creatingVisitRef\.current\) return creatingVisitRef\.current/.test(storeVisits)],
  ["store visit finish clears the current draft reference", /draftVisitRef\.current = null/.test(storeVisits)],
  ["floor walk uses selected managed branch", /branch_id:\s*branchId/.test(storeVisits) && !/branch_id:\s*profile\.branch_id/.test(storeVisits)],
  ["floor walk completion notifies the selected branch", /notifyBranch\(company\.id,\s*fw\.branch_id/.test(storeVisits)],
  ["floor walk form exposes branch selection", /Floor Walk Details/.test(storeVisits) && /<select style=\{S\.sel\} value=\{branchId\}/.test(storeVisits)],
];

for (const [name, pass] of checks) {
  assert.ok(pass, name);
  console.log(`ok - ${name}`);
}
