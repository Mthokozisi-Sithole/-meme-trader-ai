"""
Narrative classification engine.
Infers the category and hype potential of a token from its name/symbol.
"""
import re
from dataclasses import dataclass

# Keyword sets per narrative category (order matters — first match wins for primary)
CATEGORIES: dict[str, list[str]] = {
    "AI": [
        "ai", "gpt", "agent", "neural", "llm", "gemini", "claude", "robot",
        "bot", "ml", "deep", "brain", "agi", "compute", "matrix", "skynet",
        "jarvis", "hal", "openai", "vertex", "copilot", "sentient",
    ],
    "Political": [
        "trump", "maga", "biden", "kamala", "harris", "potus", "president",
        "america", "usa", "vote", "republican", "democrat", "election",
        "congress", "senate", "woke", "patriot", "freedom", "liberty",
    ],
    "Cult": [
        "pepe", "chad", "sigma", "wojak", "gigachad", "kek", "honk",
        "clown", "based", "redpill", "npc", "boomer", "zoomer", "yolo",
        "ngmi", "wagmi", "degen", "ape", "fren", "gm", "vibes",
    ],
    "Animal": [
        "doge", "shib", "inu", "dog", "puppy", "woof", "bone", "cat",
        "kitty", "meow", "nyan", "kitten", "frog", "pepe", "toad",
        "bear", "bull", "panda", "wolf", "fox", "bunny", "rabbit",
        "hamster", "monkey", "ape", "gorilla", "snake", "horse",
    ],
    "Space": [
        "moon", "rocket", "mars", "cosmos", "space", "alien", "ufo",
        "nasa", "starship", "galaxy", "nebula", "orbit", "saturn",
        "jupiter", "astro", "stellar", "solar", "cosmic",
    ],
    "Celebrity": [
        "elon", "musk", "taylor", "swift", "trump", "kanye", "ye",
        "hawk", "tuah", "grimes", "saylor", "vitalik", "sbf",
    ],
    "Gaming": [
        "game", "rpg", "quest", "warrior", "dragon", "knight", "guild",
        "raid", "dungeon", "sword", "shield", "epic", "loot", "nft",
        "metaverse", "pixel", "arcade", "gamer",
    ],
    "Food": [
        "pizza", "burger", "taco", "donut", "cookie", "cake", "sushi",
        "ramen", "bacon", "cheese", "sandwich", "nugget", "fries",
    ],
    "Finance": [
        "defi", "yield", "stake", "earn", "vault", "safe", "dao",
        "treasury", "fund", "bank", "credit", "loan", "swap",
    ],
}

# How "hot" each narrative is in the current market cycle (0-30 bonus)
NARRATIVE_HEAT: dict[str, float] = {
    "AI": 28,
    "Political": 22,
    "Cult": 18,
    "Celebrity": 20,
    "Animal": 14,
    "Space": 12,
    "Gaming": 10,
    "Food": 8,
    "Finance": 6,
}


@dataclass
class NarrativeResult:
    category: str
    keywords_found: list[str]
    hype_velocity: float        # 0-100
    score: float                # 0-100


def classify_narrative(name: str, symbol: str, description: str = "") -> NarrativeResult:
    """Classify token narrative and score its sentiment/hype potential."""
    text = re.sub(r"[^a-z0-9 ]", " ", f"{name} {symbol} {description}".lower())
    tokens = set(text.split())

    primary_category = "Other"
    matched_keywords: list[str] = []

    for category, keywords in CATEGORIES.items():
        hits = [kw for kw in keywords if kw in tokens or kw in text]
        if hits:
            if primary_category == "Other":
                primary_category = category
            matched_keywords.extend(hits)

    # Remove duplicates while preserving order
    seen: set[str] = set()
    unique_keywords: list[str] = []
    for kw in matched_keywords:
        if kw not in seen:
            seen.add(kw)
            unique_keywords.append(kw)

    # Base score
    base = 40.0

    # Category heat bonus
    heat = NARRATIVE_HEAT.get(primary_category, 4)
    base += heat

    # Keyword density bonus (more keywords = stronger narrative signal)
    base += min(15.0, len(unique_keywords) * 3.0)

    # Hype velocity: how fast is this narrative spreading?
    # For now derived from score — in production this would use trend data
    hype_velocity = min(100.0, base * 1.1)

    return NarrativeResult(
        category=primary_category,
        keywords_found=unique_keywords[:10],  # cap stored keywords
        hype_velocity=round(hype_velocity, 1),
        score=round(min(100.0, base), 1),
    )
