"""
HTTP client for Warpdrive S3-compatible API. Signs requests with user's API key (SigV4).
Used to fetch list-buckets-with-stats for merging with Console bucket list.
"""
from __future__ import annotations

import logging
from typing import List, Optional
from urllib.parse import urlparse

import requests
from requests_aws4auth import AWS4Auth

from config import get_settings

logger = logging.getLogger(__name__)


def get_warpdrive_url() -> Optional[str]:
    url = get_settings().warpdrive_url
    return url.strip() if url else None


def list_buckets_with_stats_sync(access_key: str, secret_key: str) -> List[dict]:
    """
    Call Warpdrive GET /s3/ with SigV4 using the given credentials.
    Returns list of {"name": str, "object_count": int, "total_size": int}.
    On missing URL or request failure, returns [].
    """
    base = get_warpdrive_url()
    if not base:
        return []
    base = base.rstrip("/")
    # Use /s3 (no trailing slash) so the signed path matches what Warpdrive sees (path can differ with /s3/)
    url = f"{base}/s3"

    # requests_aws4auth uses urlparse().netloc.split(':')[0] for Host when not set, which drops the port.
    # Warpdrive sees Host: localhost:9710, so we must sign with that. Set Host explicitly so the signer uses it.
    parsed = urlparse(base)
    host_header = parsed.hostname or ""
    if parsed.port is not None:
        host_header = f"{host_header}:{parsed.port}"

    region = "us-east-1"
    auth = AWS4Auth(access_key, secret_key, region, "s3")

    try:
        r = requests.get(url, auth=auth, headers={"Host": host_header}, timeout=10)
        r.raise_for_status()
        data = r.json()
        buckets = data.get("buckets") or []
        if buckets:
            logger.info("Warpdrive GET /s3 ok: %s buckets with stats", len(buckets))
        return [
            {
                "name": b.get("name", ""),
                "object_count": int(b.get("object_count", 0)),
                "total_size": int(b.get("total_size", 0)),
            }
            for b in buckets
        ]
    except requests.RequestException as e:
        logger.warning("Warpdrive GET /s3/ failed (stats will show 0): %s", e)
        return []
    except Exception as e:
        logger.warning("Warpdrive list_buckets_with_stats error (stats will show 0): %s", e)
        return []
