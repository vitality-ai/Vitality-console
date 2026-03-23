"""
HTTP client for Warpdrive S3-compatible API. Signs requests with user's API key (SigV4).
Used to fetch list-buckets-with-stats for merging with Console bucket list.
"""
from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from typing import List, Optional
from urllib.parse import urlparse

import requests
from requests_aws4auth import AWS4Auth

from config import get_settings

logger = logging.getLogger(__name__)

# Must match warpdrive `S3_XMLNS` / ListAllMyBucketsResult
S3_XMLNS = "http://s3.amazonaws.com/doc/2006-03-01/"
# Must match warpdrive `WARPDRIVE_LIST_BUCKETS_EXT_NS` (ObjectCount / TotalSize on each Bucket)
WARPDRIVE_LIST_BUCKETS_EXT_NS = "http://warpdrive.vitality.dev/doc/listbuckets/1"


def get_warpdrive_url() -> Optional[str]:
    url = get_settings().warpdrive_url
    return url.strip() if url else None


def _s3_tag(local: str) -> str:
    return f"{{{S3_XMLNS}}}{local}"


def _ext_tag(local: str) -> str:
    return f"{{{WARPDRIVE_LIST_BUCKETS_EXT_NS}}}{local}"


def _parse_list_buckets_xml(body: str) -> List[dict]:
    """
    Parse Warpdrive ListAllMyBucketsResult XML (AWS S3 shape + optional Vitality stats extension).
    Returns list of {"name", "object_count", "total_size"}.
    """
    try:
        root = ET.fromstring(body)
    except ET.ParseError as e:
        logger.warning("Warpdrive list buckets: invalid XML: %s", e)
        return []

    buckets_el = root.find(_s3_tag("Buckets"))
    if buckets_el is None:
        return []

    out: List[dict] = []
    for b in buckets_el.findall(_s3_tag("Bucket")):
        name_el = b.find(_s3_tag("Name"))
        name = (name_el.text or "").strip() if name_el is not None else ""
        if not name:
            continue
        oc_el = b.find(_ext_tag("ObjectCount"))
        ts_el = b.find(_ext_tag("TotalSize"))
        try:
            object_count = int((oc_el.text or "0").strip()) if oc_el is not None else 0
        except ValueError:
            object_count = 0
        try:
            total_size = int((ts_el.text or "0").strip()) if ts_el is not None else 0
        except ValueError:
            total_size = 0
        out.append(
            {
                "name": name,
                "object_count": object_count,
                "total_size": total_size,
            }
        )
    return out


def list_buckets_with_stats_sync(access_key: str, secret_key: str) -> List[dict]:
    """
    Call Warpdrive GET /s3 with SigV4 using the given credentials.
    Expects ListAllMyBucketsResult XML (S3-compatible).
    Returns list of {"name": str, "object_count": int, "total_size": int}.
    On missing URL, non-XML response, or request failure, returns [].
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
        body = r.text
        stripped = body.lstrip()
        if stripped.startswith("<?xml") or stripped.startswith("<ListAllMyBucketsResult"):
            buckets = _parse_list_buckets_xml(body)
        else:
            logger.warning(
                "Warpdrive GET /s3 returned non-XML body (expected ListAllMyBucketsResult)"
            )
            buckets = []
        if buckets:
            logger.info("Warpdrive GET /s3 ok: %s buckets with stats", len(buckets))
        return buckets
    except requests.RequestException as e:
        logger.warning("Warpdrive GET /s3/ failed (stats will show 0): %s", e)
        return []
    except Exception as e:
        logger.warning("Warpdrive list_buckets_with_stats error (stats will show 0): %s", e)
        return []
