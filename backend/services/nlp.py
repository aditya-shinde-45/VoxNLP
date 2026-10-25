import re
import unicodedata
from dataclasses import dataclass

from backend.config import LANGUAGES


CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
TOKEN_RE = re.compile(r"\w+(?:['’-]\w+)*|[^\w\s]", re.UNICODE)


def normalize_text(text: str) -> str:
    return " ".join(CONTROL_CHARS.sub("", unicodedata.normalize("NFC", text)).split())


@dataclass
class NlpService:
    pipeline: object | None = None
    load_error: str | None = None

    def __post_init__(self) -> None:
        try:
            import spacy

            self.pipeline = spacy.load("en_core_web_sm")
        except Exception as exc:
            self.load_error = "English spaCy model is not installed."
            self.pipeline = None

    @property
    def available(self) -> bool:
        return self.pipeline is not None

    def analyze(self, text: str, language: str) -> dict:
        normalized = normalize_text(text)
        if not normalized:
            raise ValueError("Text must not be empty.")

        if language != "en" or self.pipeline is None:
            raw_tokens = [
                {"text": match.group(0), "start": match.start(), "end": match.end(), "lemma": None, "pos": None, "tag": None}
                for match in TOKEN_RE.finditer(normalized)
            ]
            return self._response(normalized, language, raw_tokens, [], "basic preprocessing")

        try:
            doc = self.pipeline(normalized)
        except Exception:
            self.load_error = "English NLP analysis failed; using basic preprocessing."
            return self._response(normalized, language, self._basic_tokens(normalized), [], "basic preprocessing")
        tokens = [
            {
                "text": token.text,
                "start": token.idx,
                "end": token.idx + len(token.text),
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
            }
            for token in doc
        ]
        entities = [
            {"text": entity.text, "label": entity.label_, "start": entity.start_char, "end": entity.end_char}
            for entity in doc.ents
        ]
        return self._response(normalized, language, tokens, entities, "spacy:en_core_web_sm")

    @staticmethod
    def _basic_tokens(text: str) -> list[dict]:
        return [
            {"text": match.group(0), "start": match.start(), "end": match.end(), "lemma": None, "pos": None, "tag": None}
            for match in TOKEN_RE.finditer(text)
        ]

    def _response(self, text: str, language: str, tokens: list, entities: list, analyzer: str) -> dict:
        return {
            "text": text,
            "language": language,
            "analyzer": analyzer,
            "advanced_analysis_available": language == "en" and self.available,
            "tokens": tokens,
            "entities": entities,
            "summary": {
                "characters": len(text),
                "words": len(re.findall(r"\w+", text, re.UNICODE)),
                "sentences": len([part for part in re.split(r"[.!?]+", text) if part.strip()]),
                "tokens": len(tokens),
                "entities": len(entities),
            },
        }


def language_metadata(english_pipeline_available: bool) -> list[dict]:
    return [
        {"code": code, "name": name, "nlp_available": code == "en" and english_pipeline_available}
        for code, (name, _) in LANGUAGES.items()
    ]
