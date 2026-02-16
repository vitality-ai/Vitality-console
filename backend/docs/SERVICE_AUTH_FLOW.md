# Service auth: Vitality Console ↔ Warpdrive

## Who has the secret?

- **End user / S3 client (boto3, demo):** Has one API key pair (`access_key` + `secret_key`) from Console (Developer Settings). Uses it to sign S3 requests (SigV4) and call Warpdrive directly.
- **Vitality Console:** Stores API keys in DB (`api_keys`). When the **backend** needs to call Warpdrive (e.g. to get bucket stats for the dashboard), it uses the **logged-in user’s** API key and signs the request the same way a client would. So Console does **not** use a separate “service identity”; it acts **as the user**.
- **Warpdrive:** Does **not** store user secrets. For every S3 request it only sees the `access_key` in the `Authorization` header. It then calls **Vitality Console** to resolve that key and get the `secret_key` so it can verify the SigV4 signature.

So: **Warpdrive always verifies “is this a valid user?” by asking Console** (s3-credentials). The “service” auth is only the shared secret `WARPDRIVE_SERVICE_SECRET` that Warpdrive sends when calling Console; that proves the caller is Warpdrive, so Console returns the user’s `secret_key`.

## Flow when the client (e.g. demo) calls Warpdrive

1. Client signs `GET /s3` with its `access_key` + `secret_key` (SigV4), sends request to Warpdrive.
2. Warpdrive reads `access_key` from `Authorization`.
3. Warpdrive calls **Console** `POST /api/auth/s3-credentials` with `{ "access_key": "..." }` and header `X-Warpdrive-Secret: <WARPDRIVE_SERVICE_SECRET>`.
4. Console checks `X-Warpdrive-Secret` and looks up the key; returns `{ "owner_id", "secret_key" }` or 401.
5. Warpdrive verifies the **original** request’s SigV4 signature using that `secret_key`. If it matches → 200; else → 401.

## Flow when Vitality Console backend calls Warpdrive (e.g. GET /s3 for stats)

Same as above. The Console backend:

1. Looks up the **logged-in user’s** API key (`get_by_owner_id(current_user.email)`).
2. Signs `GET /s3` with that key (same SigV4 as a client).
3. Sends the request to Warpdrive.

Warpdrive cannot tell whether the HTTP client is the demo or the Console backend; it only sees a signed request. It again calls Console’s s3-credentials with the `access_key` from the request, gets the `secret_key`, and verifies the signature. So **Console→Warpdrive works the same as client→Warpdrive** as long as the same key is used and the signed path/headers match what Warpdrive expects.

## Why you might still get 401

1. **Console s3-credentials returns 401**
   - **Service secret mismatch:** `WARPDRIVE_SERVICE_SECRET` in Warpdrive’s `.env` must equal `WARPDRIVE_SERVICE_SECRET` in Console’s `.env`. Check Console logs for: `s3-credentials: 401 service secret mismatch`.
   - **Key missing/inactive:** The `access_key` in the request must exist in Console’s `api_keys` and be `status=active`. Check for: `s3-credentials: 401 access_key not found or inactive`.

2. **SigV4 signature mismatch**
   - Warpdrive logs: `SigV4 signature mismatch (canonical_uri=..., query_len=...)`. The path, query string, or headers used by the signer (e.g. Python `requests_aws4auth`) must match exactly what Warpdrive builds (path from request, same host, same signed headers). Common causes: path `/s3` vs `/s3/`, different Host, or query/encoding differences.

## Quick debug

- **Console:** After a failed request, look for log lines starting with `s3-credentials:`.  
  - `s3-credentials: 200 for access_key=...` → Console accepted Warpdrive’s call and returned the secret; if the user still gets 401, the failure is in Warpdrive (likely SigV4).
  - `s3-credentials: 401 service secret mismatch` → Fix `WARPDRIVE_SERVICE_SECRET` in both apps.
  - `s3-credentials: 401 access_key not found or inactive` → Ensure the user has an active API key in Developer Settings.
- **Warpdrive:** Look for `Vitality Console s3-credentials returned 401` (Console rejected) or `SigV4 signature mismatch` (signature verification failed).
