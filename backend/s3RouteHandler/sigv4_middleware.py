# sigv4_middleware.py
import hmac, hashlib, datetime, urllib.parse, os
from typing import Dict, List, Tuple
from werkzeug.exceptions import HTTPException

from flask import current_app, request, abort, jsonify


CREDENTIALS: Dict[str, str] = {
    os.getenv("AWS_ACCESS_KEY_ID", "dVtT6RrzkmX99PJpFnIq"):
    os.getenv("AWS_SECRET_ACCESS_KEY", "pRZjBiGtZQ5riHIVDjGCNb6MXTxPMzYSXJKJQrY8")
}


# ────────────────────────────────
# 2.  SigV4 helper functions
# ────────────────────────────────
_ALGORITHM = "AWS4-HMAC-SHA256"

def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

def _get_signing_key(secret: str, date: str, region: str, service: str) -> bytes:
    k_date   = _sign(("AWS4" + secret).encode("utf-8"), date)
    k_region = _sign(k_date, region)
    k_service= _sign(k_region, service)
    return  _sign(k_service, "aws4_request")

def _hash_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

def _canonical_query(pairs: List[Tuple[str, str]]) -> str:
    return "&".join(
        f"{urllib.parse.quote_plus(k, safe='~')}={urllib.parse.quote_plus(v, safe='~')}"
        for k, v in sorted(pairs)
    )

def _canonical_headers(headers: dict, signed: List[str]) -> Tuple[str, str]:
    lowered = {k.lower(): " ".join(v.strip().split()) for k, v in headers.items()}
    canon = ""
    for h in signed:
        if h not in lowered:
            abort(400, f"Missing signed header '{h}'")
        canon += f"{h}:{lowered[h]}\n"
    return canon, ";".join(signed)

def _parse_auth_header(h: str) -> Dict[str, str]:
    if not h.startswith(_ALGORITHM):
        abort(400, "Unsupported Authorization header")
    _, rest = h.split(" ", 1)
    return dict(kv.split("=", 1) for kv in rest.replace(" ", "").split(","))


# ────────────────────────────────
# 3.  Flask hook
# ────────────────────────────────
def _verify_sigv4() -> None:
    """
    Runs for every request; aborts if the signature is bad.
    """
    try:
        hdrs = {k.lower(): v for k, v in request.headers.items()}

        print("hdrs: ", hdrs)

        # ----- A) HEADER‑SIGNED STYLE -----
        if "authorization" in hdrs:
            auth = _parse_auth_header(hdrs["authorization"])
            signature_provided = auth["Signature"]
            access_key, scope = auth["Credential"].split("/", 1)
            date, region, service, _ = scope.split("/")
            signed_headers = auth["SignedHeaders"].split(";")

            method = request.method
            path   = urllib.parse.quote(request.path or "/", safe="/~")
            query  = _canonical_query(request.args.items(multi=True))
            canon_hdrs, hdr_list = _canonical_headers(hdrs, signed_headers)
            body_hash = hdrs.get("x-amz-content-sha256",
                                 _hash_sha256(request.get_data(as_text=True) or ""))

            canonical_request = (
                f"{method}\n{path}\n{query}\n{canon_hdrs}\n{hdr_list}\n{body_hash}"
            )
            string_to_sign = (
                f"{_ALGORITHM}\n"
                f"{hdrs['x-amz-date']}\n"
                f"{scope}\n"
                f"{_hash_sha256(canonical_request)}"
            )

        # ----- B) PRE‑SIGNED URL STYLE -----
        elif "X-Amz-Signature" in request.args:
            qp = request.args
            signature_provided = qp["X-Amz-Signature"]
            access_key, date, region, service = qp["X-Amz-Credential"].split("/", 3)
            signed_headers = qp["X-Amz-SignedHeaders"].split(";")

            method = request.method
            path   = urllib.parse.quote(request.path or "/", safe="/~")
            q_nosig = [(k, v) for k, v in qp.items(multi=True) if k != "X-Amz-Signature"]
            query  = _canonical_query(q_nosig)
            canon_hdrs, hdr_list = _canonical_headers(hdrs, signed_headers)
            body_hash = qp.get("X-Amz-Content-Sha256", "UNSIGNED-PAYLOAD")

            canonical_request = (
                f"{method}\n{path}\n{query}\n{canon_hdrs}\n{hdr_list}\n{body_hash}"
            )
            string_to_sign = (
                f"{_ALGORITHM}\n"
                f"{qp['X-Amz-Date']}\n"
                f"{date}/{region}/{service}/aws4_request\n"
                f"{_hash_sha256(canonical_request)}"
            )
        else:
            # Not an S3‑style call – ignore (or enforce, if you prefer)
            return

        secret = CREDENTIALS.get(access_key)
        if not secret:
            abort(403, "Unknown access key")

        signing_key = _get_signing_key(secret, date, region, service)
        expected_sig = hmac.new(
            signing_key, string_to_sign.encode("utf-8"), hashlib.sha256
        ).hexdigest()
        print("expected_sig: ", expected_sig," signature_provided: ", signature_provided)
        if not hmac.compare_digest(expected_sig, signature_provided):
            abort(403, "Signature mismatch")

    except Exception as exc:
        # `abort()` already handled known errors
        if isinstance(exc, werkzeug.exceptions.HTTPException):
            raise
        abort(400, str(exc))


def init_sigv4(app):
    """
    Call once during app creation.
    """
    # Register a before_request handler at the *top* of the chain
    app.before_request(_verify_sigv4)

