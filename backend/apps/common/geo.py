"""
Lightweight geo utilities. Kept pure-Python (no GDAL/PostGIS dependency) to
stay compatible with SQLite + PythonAnywhere.
"""
from __future__ import annotations

import math
from decimal import Decimal
from typing import Optional

Number = float | int | Decimal


def _to_float(value: Optional[Number]) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def haversine_km(
    lat1: Optional[Number],
    lng1: Optional[Number],
    lat2: Optional[Number],
    lng2: Optional[Number],
) -> Optional[float]:
    """Great-circle distance in kilometers between two points. None if any input missing."""
    la1, lo1, la2, lo2 = map(_to_float, (lat1, lng1, lat2, lng2))
    if None in (la1, lo1, la2, lo2):
        return None

    r = 6371.0
    to_rad = math.radians
    dlat = to_rad(la2 - la1)
    dlng = to_rad(lo2 - lo1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(to_rad(la1)) * math.cos(to_rad(la2)) * math.sin(dlng / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))
