from __future__ import annotations

import re
from typing import Iterable

# Stable topic vocabulary. Classifiers should only emit labels from this list.
TOPICS = [
    "Arithmetic Sequences", "Algebra", "Algebraic Fractions", "Angles", "Area and Perimeter",
    "Bearings", "Bounds", "Circle Theorems", "Compound Interest", "Differentiation", "Estimated Mean",
    "Expanding", "Factorising", "Fractions", "Functions", "Graphs", "Grouped Data", "HCF and LCM",
    "Histograms", "Indices", "Inequalities", "Linear Equations", "Probability", "Proof", "Ratio",
    "Reverse Percentages", "Sequences", "Sets", "Similar Shapes", "Simultaneous Equations", "Standard Form",
    "Statistics", "Surface Area and Volume", "Trigonometry", "Vectors", "Percentages", "Quadratics"
]

RULES: list[tuple[str, list[str]]] = [
    ("Vectors", [r"\bvector\b", r"\bOA\b.*\bOB\b", r"\ba\b.*\bb\b.*midpoint"]),
    ("Differentiation", [r"gradient is", r"dy\s*/\s*dx", r"turning point.*gradient"]),
    ("Histograms", [r"histogram", r"frequency density"]),
    ("Grouped Data", [r"modal class", r"frequency.*40\s*<", r"grouped"]),
    ("Estimated Mean", [r"estimate for the mean", r"estimated mean"]),
    ("Circle Theorems", [r"points on a circle", r"diameter of the circle", r"angle.*circle"]),
    ("Bearings", [r"bearing of", r"due north"]),
    ("Trigonometry", [r"sine rule", r"cosine rule", r"sin\b", r"cos\b", r"tan\b"]),
    ("Surface Area and Volume", [r"volume of", r"surface area", r"hemisphere", r"cylinder", r"cone", r"prism"]),
    ("Similar Shapes", [r"similar solids", r"similar shapes"]),
    ("Bounds", [r"upper bound", r"lower bound", r"correct to .*decimal place", r"nearest whole number"]),
    ("Probability", [r"probability", r"chosen at random", r"takes at random", r"probability tree"]),
    ("Sets", [r"\bset\b", r"\bvenn\b", r"∩", r"∪", r"universal set", r"empty set"]),
    ("Standard Form", [r"standard form", r"×\s*10"]),
    ("HCF and LCM", [r"highest common factor", r"lowest common multiple", r"\bHCF\b", r"\bLCM\b"]),
    ("Compound Interest", [r"compound interest", r"fixed-term bond"]),
    ("Reverse Percentages", [r"% more than", r"before the increase", r"original.*percentage"]),
    ("Percentages", [r"\bpercent", r"\d+(?:\.\d+)?%"]),
    ("Arithmetic Sequences", [r"arithmetic sequence", r"arithmetic series", r"common difference"]),
    ("Sequences", [r"nth term", r"sequence"]),
    ("Simultaneous Equations", [r"simultaneous equations"]),
    ("Algebraic Fractions", [r"single fraction", r"algebraic fraction"]),
    ("Functions", [r"inverse function", r"f\s*\(x\)", r"function f"]),
    ("Graphs", [r"draw the graph", r"curve has equation", r"graph of"]),
    ("Quadratics", [r"x\s*2", r"x²", r"quadratic", r"complete the square", r"factorise.*(?:x|n|y).*2"]),
    ("Factorising", [r"factorise"]),
    ("Expanding", [r"expand and simplify"]),
    ("Indices", [r"simplify.*\^", r"simplify.*[xyap]\s*\d", r"index", r"indices", r"power"]),
    ("Inequalities", [r"inequality", r"number line", r"[<>≤≥]"]),
    ("Proof", [r"prove that", r"using algebra, prove", r"show that"]),
    ("Angles", [r"angle", r"regular pentagon", r"polygon"]),
    ("Area and Perimeter", [r"perimeter", r"area of sector", r"area of the shaded"]),
    ("Ratio", [r"ratio", r"ratios", r"\d+\s*:\s*\d+"]),
    ("Fractions", [r"fraction", r"\bof the\b"]),
    ("Linear Equations", [r"\bsolve\b.*=", r"linear equation"]),
    ("Statistics", [r"median", r"mode", r"range", r"mean"]),
    ("Algebra", [r"\bsolve\b", r"\bfactorise\b", r"\bexpand\b", r"\bfunction\b", r"\bequation\b"]),
]


def classify_text(text: str, max_topics: int = 5) -> list[str]:
    normal = re.sub(r"\s+", " ", text.lower())
    scored: list[tuple[int, str]] = []
    for topic, patterns in RULES:
        score = sum(1 for pattern in patterns if re.search(pattern, normal, re.I))
        if score:
            scored.append((score, topic))

    scored.sort(key=lambda item: (-item[0], TOPICS.index(item[1])))
    topics = [topic for _, topic in scored[:max_topics]]
    return topics or ["Algebra"]


def difficulty_from_marks(marks: int, topics: Iterable[str]) -> str:
    topic_count = len(set(topics))
    if marks <= 2 and topic_count <= 2:
        return "Easy"
    if marks >= 6 or topic_count >= 4:
        return "Hard"
    return "Medium"
