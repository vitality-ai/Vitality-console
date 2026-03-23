# Service auth: Vitality Console ↔ Warpdrive

## Who has the secret?

- **End user / S3 client (boto3, demo):** Has one API key pair (`access_key` + `secret_key`) from Console (Developer Settings). Uses it to sign S3 requests (SigV4) and call Warpdrive directly.
- **Vitality Console:** Stores API keys in DB (`api_keys`). When the **backend** needs to call Warpdrive (e.g. to get bucket stats for the dashboard), it uses the **logged-in user’s** API key and signs the request the same way a client would. So Console does **not** use a separate “service identity”; it acts **as the user**.
- **Warpdrive:** Does **not** store user secrets. For every S3 request it only sees the `access_key` in the `Authorization` header. It then calls **Vitality Console** to resolve that key and get the `secret_key` so it can verify the SigV4 signature.

So: **Warpdrive always verifies “is this a valid user?” by asking Console** (s3-credentials). The “service” auth is only the shared secret `WARPDRIVE_SERVICE_SECRET` that Warpdrive sends when calling Console; that proves the caller is Warpdrive, so Console returns the user’s `secret_key`.

## Flow when the client (e.g. demo) calls Warpdrive

1. Client signs `GET /s3` with its `access_key` + `secret_key` (SigV4), sends request to Warpdrive.
2. Warpdrive reads `access_key` from `Authorization`.
3. On **cache miss/expiry**, Warpdrive calls **once**:  
   `POST /api/auth/s3-credentials` with `{ "access_key": "..." }` + `X-Warpdrive-Secret`.  
   Console **always** returns `registered_buckets` (names from its `buckets` table). The `default` bucket row is created when the user **registers** in Console (`POST /register` or first-time Google login), not on this endpoint. Warpdrive caches `secret_key`, `owner_id`, and that set (TTL: `S3_AUTH_CACHE_TTL_SECS`, default 300s).
4. For each request, if the path contains `/s3/{bucket}/…`, Warpdrive checks that `{bucket}` is in the **cached** allowlist; if not → **403** (before SigV4). ListBuckets (`GET /s3`) skips this check.
5. Warpdrive verifies SigV4 with the cached `secret_key`. If it matches → handler runs; else → 401.

**Stale allowlist:** New buckets created in the UI appear in S3 after the cache TTL refreshes (or restart Warpdrive). Lower `S3_AUTH_CACHE_TTL_SECS` if needed.

If the cache ever held an **empty** `registered_buckets` (e.g. first request before the `default` row existed), Warpdrive **invalidates and re-fetches** once when a path-style request targets a bucket so you are not stuck at 403 until TTL.

## Flow when Vitality Console backend calls Warpdrive (e.g. GET /s3 for stats)

Same as above. The Console backend:

1. Looks up the **logged-in user’s** API key (`get_by_owner_id(current_user.email)`).
2. Signs `GET /s3` with that key (same SigV4 as a client). Warpdrive returns **ListAllMyBucketsResult** XML (S3-compatible), which the Console backend parses for bucket stats.
3. Sends the request to Warpdrive.

Warpdrive cannot tell whether the HTTP client is the demo or the Console backend; it only sees a signed request. It again calls Console’s s3-credentials with the `access_key` from the request, gets the `secret_key`, and verifies the signature. So **Console→Warpdrive works the same as client→Warpdrive** as long as the same key is used and the signed path/headers match what Warpdrive expects.

The **ListBuckets** XML uses the same **allowed bucket list** as the credential bundle (merged with haystack stats for counts/sizes). Haystack is not the source of truth for which bucket names exist in Console.

## Why you might still get 401

1. **Console s3-credentials returns 401**
   - **Service secret mismatch:** `WARPDRIVE_SERVICE_SECRET` in Warpdrive’s `.env` must equal `WARPDRIVE_SERVICE_SECRET` in Console’s `.env`. Check Console logs for: `s3-credentials: 401 service secret mismatch`.
   - **Key missing/inactive:** The `access_key` in the request must exist in Console’s `api_keys` and be `status=active`. Check for: `s3-credentials: 401 access_key not found or inactive`.

2. **Warpdrive 403 “Bucket is not registered…”**
   - Path bucket is not in the **cached** allowlist from the bundle’s `registered_buckets`. Create the bucket in the UI, wait for cache TTL, or restart Warpdrive.

3. **SigV4 signature mismatch**
   - Warpdrive logs: `SigV4 signature mismatch (canonical_uri=..., query_len=...)`. The path, query string, or headers used by the signer (e.g. Python `requests_aws4auth`) must match exactly what Warpdrive builds (path from request, same host, same signed headers). Common causes: path `/s3` vs `/s3/`, different Host, or query/encoding differences.

## Quick debug

- **Console:** After a failed request, look for log lines starting with `s3-credentials:`.  
  - `s3-credentials: 200 for access_key=...` → Console accepted Warpdrive’s call and returned the secret; if the user still gets 401, the failure is in Warpdrive (likely SigV4).
  - `s3-credentials: 401 service secret mismatch` → Fix `WARPDRIVE_SERVICE_SECRET` in both apps.
  - `s3-credentials: 401 access_key not found or inactive` → Ensure the user has an active API key in Developer Settings.
- **Warpdrive:** Look for `Vitality Console s3-credentials returned 401` / `403` (Console rejected) or `SigV4 signature mismatch` (signature verification failed).
