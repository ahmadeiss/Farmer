"""
Palestinian governorates registry with central coordinates.
Used for location-based filtering, nearest-farmer sorting, and shipping zones.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Governorate:
    code: str
    name_ar: str
    name_en: str
    latitude: float
    longitude: float
    region: str  # west_bank | gaza


GOVERNORATES: list[Governorate] = [
    # West Bank
    Governorate("jenin",       "جنين",       "Jenin",       32.4597, 35.2966, "west_bank"),
    Governorate("tubas",       "طوباس",      "Tubas",       32.3214, 35.3691, "west_bank"),
    Governorate("tulkarm",     "طولكرم",     "Tulkarm",     32.3104, 35.0286, "west_bank"),
    Governorate("nablus",      "نابلس",      "Nablus",      32.2211, 35.2544, "west_bank"),
    Governorate("qalqilya",    "قلقيلية",    "Qalqilya",    32.1904, 34.9706, "west_bank"),
    Governorate("salfit",      "سلفيت",      "Salfit",      32.0855, 35.1807, "west_bank"),
    Governorate("ramallah",    "رام الله والبيرة", "Ramallah", 31.9038, 35.2034, "west_bank"),
    Governorate("jericho",     "أريحا والأغوار", "Jericho",  31.8667, 35.4500, "west_bank"),
    Governorate("jerusalem",   "القدس",      "Jerusalem",   31.7683, 35.2137, "west_bank"),
    Governorate("bethlehem",   "بيت لحم",    "Bethlehem",   31.7054, 35.2024, "west_bank"),
    Governorate("hebron",      "الخليل",     "Hebron",      31.5326, 35.0998, "west_bank"),
    # Gaza Strip
    Governorate("north_gaza",  "شمال غزة",   "North Gaza",  31.5500, 34.5000, "gaza"),
    Governorate("gaza",        "غزة",        "Gaza",        31.5017, 34.4668, "gaza"),
    Governorate("deir_balah",  "دير البلح",  "Deir al-Balah", 31.4181, 34.3510, "gaza"),
    Governorate("khan_yunis",  "خان يونس",   "Khan Yunis",  31.3462, 34.3027, "gaza"),
    Governorate("rafah",       "رفح",        "Rafah",       31.2968, 34.2459, "gaza"),
]


GOVERNORATE_BY_CODE: dict[str, Governorate] = {g.code: g for g in GOVERNORATES}
GOVERNORATE_NAMES_AR: list[str] = [g.name_ar for g in GOVERNORATES]


def get_governorate_coords(code_or_name: str) -> tuple[float, float] | None:
    """Return (lat, lng) for a governorate by code or Arabic name. None if unknown."""
    if not code_or_name:
        return None
    g = GOVERNORATE_BY_CODE.get(code_or_name)
    if g is None:
        for candidate in GOVERNORATES:
            if candidate.name_ar == code_or_name or candidate.name_en.lower() == code_or_name.lower():
                g = candidate
                break
    return (g.latitude, g.longitude) if g else None


def governorate_choices() -> list[tuple[str, str]]:
    """Django model-style choices (code, Arabic name)."""
    return [(g.code, g.name_ar) for g in GOVERNORATES]
