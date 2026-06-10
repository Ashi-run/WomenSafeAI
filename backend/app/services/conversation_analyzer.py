"""
ConversationAnalyzer
====================
Loads a fine-tuned DistilBERT model exported to ONNX and runs CPU inference
to classify conversation text into four scam-risk categories.

Model location (resolved at startup):
    backend/models/womensafe_distilbert.onnx
    backend/models/tokenizer.json
    backend/models/config.json

Usage
-----
    # In FastAPI lifespan (startup):
    analyzer = ConversationAnalyzer()
    analyzer.load()                         # raises RuntimeError on failure

    # Per request (async, thread-safe):
    result = await analyzer.analyze(raw_text)
    # result.predicted_class  → "Financial Scam"
    # result.confidence       → 0.91  (the winning class probability)
    # result.scores           → {"Safe": 0.04, "Financial Scam": 0.91, ...}
    # result.risk_score       → 91    (int 0-100 for AnalysisResponse)
    # result.is_scam          → True
"""

import asyncio
import logging
import math
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Optional heavy imports — caught here so the startup error is readable
# ---------------------------------------------------------------------------
try:
    import onnxruntime as ort
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "onnxruntime is not installed. "
        "Run: pip install onnxruntime"
    ) from exc

try:
    from tokenizers import Tokenizer as HFTokenizer
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "tokenizers is not installed. "
        "Run: pip install tokenizers"
    ) from exc


logger = logging.getLogger(__name__)


# ─── Label map ────────────────────────────────────────────────────────────────
# These must match the label order your fine-tuning used (id2label in config.json).
# They are also used as a fallback if config.json cannot be parsed.

_DEFAULT_LABELS: List[str] = [
    "Safe",           # class 0
    "Financial Scam", # class 1
    "Sextortion",     # class 2
    "Blackmail",      # class 3
]

# ─── Chunking settings ────────────────────────────────────────────────────────
# DistilBERT hard limit is 512 tokens; we trained at 128.
# For longer inputs we use first+last strategy: take the first CHUNK_TOKENS//2
# tokens and the last CHUNK_TOKENS//2 tokens so both the opening
# (often love-bombing / grooming) and closing (often financial ask / threat)
# of a conversation are always represented.

_MAX_TOKENS = 128          # must match your training max_length
_SPECIAL_TOKENS = 2        # [CLS] + [SEP]
_CONTENT_TOKENS = _MAX_TOKENS - _SPECIAL_TOKENS   # 126 usable token slots


# ─── Return type ──────────────────────────────────────────────────────────────

@dataclass
class ConversationResult:
    predicted_class: str                       # e.g. "Financial Scam"
    confidence:      float                     # 0.0–1.0, winning class prob
    scores:          Dict[str, float]          # all class probabilities
    risk_score:      int                       # 0–100 int for AnalysisResponse
    is_scam:         bool                      # True for any non-Safe class
    labels:          List[str] = field(default_factory=list)   # label list used


# ─── Service ──────────────────────────────────────────────────────────────────

class ConversationAnalyzer:
    """
    Singleton-friendly async service that wraps an ONNX-exported DistilBERT
    model.  Call `load()` once at startup; call `analyze()` per request.

    Thread safety: onnxruntime InferenceSession is thread-safe for inference.
    We run inference in an executor so we don't block the event loop.
    """

    def __init__(self, models_dir: Optional[Path] = None) -> None:
        # Resolve models directory relative to this file's location:
        #   backend/app/services/conversation_analyzer.py
        #   → backend/models/
        if models_dir is None:
            models_dir = Path(__file__).resolve().parents[2] / "models"

        self._models_dir   = models_dir
        self._onnx_path    = models_dir / "womensafe_distilbert.onnx"
        self._tokenizer_path = models_dir / "tokenizer.json"
        self._config_path  = models_dir / "config.json"

        self._session:   Optional[ort.InferenceSession] = None
        self._tokenizer: Optional[HFTokenizer] = None
        self._labels:    List[str] = _DEFAULT_LABELS
        self._loaded:    bool = False

    # ── Startup ───────────────────────────────────────────────────────────────

    def load(self) -> None:
        """
        Load the ONNX model and tokenizer from disk.
        Raises RuntimeError with a clear message if any file is missing.
        Call this once during FastAPI lifespan startup.
        """
        self._validate_paths()
        self._load_labels_from_config()
        self._load_tokenizer()
        self._load_onnx_session()
        self._loaded = True
        logger.info(
            "ConversationAnalyzer ready — model: %s | labels: %s",
            self._onnx_path.name,
            self._labels,
        )

    def _validate_paths(self) -> None:
        missing = [
            p for p in (self._onnx_path, self._tokenizer_path, self._config_path)
            if not p.exists()
        ]
        if missing:
            raise RuntimeError(
                f"ConversationAnalyzer: missing model file(s) in {self._models_dir}:\n"
                + "\n".join(f"  ✗ {p.name}" for p in missing)
                + "\nEnsure womensafe_distilbert.onnx, tokenizer.json, and config.json "
                  "are present in backend/models/"
            )

    def _load_labels_from_config(self) -> None:
        """
        Read id2label from config.json so the label order is always
        authoritative from the checkpoint, not from this source file.
        Falls back to _DEFAULT_LABELS on any parse error.
        """
        import json
        try:
            with open(self._config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)

            id2label: Dict = cfg.get("id2label", {})
            if id2label:
                # Keys may be ints or stringified ints — sort numerically
                self._labels = [
                    id2label[k]
                    for k in sorted(id2label.keys(), key=lambda x: int(x))
                ]
                logger.info("Labels loaded from config.json: %s", self._labels)
            else:
                logger.warning(
                    "config.json has no id2label — using default labels: %s",
                    _DEFAULT_LABELS,
                )
        except Exception as exc:
            logger.warning(
                "Could not parse config.json (%s) — using default labels.", exc
            )

    def _load_tokenizer(self) -> None:
        self._tokenizer = HFTokenizer.from_file(str(self._tokenizer_path))
        # We control padding/truncation manually in _tokenize(); disable both
        # here so the fast tokenizer does not silently clip our chunked input.
        self._tokenizer.no_padding()
        self._tokenizer.no_truncation()
        logger.info("Tokenizer loaded from %s", self._tokenizer_path.name)

    def _load_onnx_session(self) -> None:
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = 2   # conservative for web servers
        sess_options.inter_op_num_threads = 1
        sess_options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        )

        self._session = ort.InferenceSession(
            str(self._onnx_path),
            sess_options=sess_options,
            providers=["CPUExecutionProvider"],
        )
        # Validate expected input names
        input_names = {inp.name for inp in self._session.get_inputs()}
        expected = {"input_ids", "attention_mask"}
        if not expected.issubset(input_names):
            raise RuntimeError(
                f"ONNX model inputs are {input_names}; expected at minimum {expected}. "
                "Re-export the model with standard HuggingFace input names."
            )
        logger.info(
            "ONNX session created — inputs: %s | outputs: %s",
            [i.name for i in self._session.get_inputs()],
            [o.name for o in self._session.get_outputs()],
        )

    # ── Inference ─────────────────────────────────────────────────────────────

    async def analyze(self, text: str) -> ConversationResult:
        """
        Async entry point for per-request inference.
        Tokenizes, chunks if needed, runs ONNX in a thread pool,
        applies softmax, and returns a ConversationResult.

        Raises:
            RuntimeError  if load() has not been called.
            ValueError    if text is empty after cleaning.
        """
        if not self._loaded:
            raise RuntimeError(
                "ConversationAnalyzer.load() must be called before analyze()."
            )

        text = self._clean_text(text)
        if not text:
            raise ValueError("Cannot analyze empty or whitespace-only text.")

        # Run the CPU-bound work in a thread so the async event loop is free
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, self._run_inference, text)
        return result

    def _clean_text(self, text: str) -> str:
        """
        Normalize whitespace and remove null bytes.
        Preserve punctuation — it carries strong signal for scam detection
        (e.g., excessive "!!!").
        """
        
        if text is None:
            return ""  # If there's no text, make it an empty string instead of crashing!
        text = text.replace("\x00", "")
        text = re.sub(r"\r\n|\r", "\n", text)       # unify line endings
        text = re.sub(r"[ \t]+", " ", text)          # collapse horizontal whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)       # max two blank lines
        return text.strip()

    def _tokenize(self, text: str) -> Tuple[np.ndarray, np.ndarray]:
        """
        Tokenize text into a (1, _MAX_TOKENS) pair of int64 arrays:
            (input_ids, attention_mask)

        Strategy:
        - If token count ≤ _CONTENT_TOKENS: pad to _MAX_TOKENS.
        - If token count > _CONTENT_TOKENS: first+last chunking.
            Take the first half of _CONTENT_TOKENS tokens and
            the last half, concatenate, then add [CLS] and [SEP].
            This preserves both the grooming opener and the
            financial-ask / threat closer of long conversations.
        """
        encoding = self._tokenizer.encode(text)
        raw_ids: List[int] = encoding.ids

        cls_id = self._tokenizer.token_to_id("[CLS]") or 101
        sep_id = self._tokenizer.token_to_id("[SEP]") or 102
        pad_id = self._tokenizer.token_to_id("[PAD]") or 0

        if len(raw_ids) <= _CONTENT_TOKENS:
            # ── Short text: simple pad ────────────────────────────────────
            content = raw_ids
        else:
            # ── Long text: first+last chunk ───────────────────────────────
            # Split the budget evenly; if odd, give the extra token to the
            # end (threats/requests tend to come last).
            first_n = _CONTENT_TOKENS // 2
            last_n  = _CONTENT_TOKENS - first_n
            content = raw_ids[:first_n] + raw_ids[-last_n:]
            logger.debug(
                "Chunked: %d raw tokens → first %d + last %d = %d content tokens",
                len(raw_ids), first_n, last_n, len(content),
            )

        # Build final sequence: [CLS] + content + [SEP] + padding
        sequence  = [cls_id] + content + [sep_id]
        pad_len   = _MAX_TOKENS - len(sequence)
        sequence += [pad_id] * pad_len

        attention = [1] * (len(content) + 2) + [0] * pad_len

        input_ids      = np.array([sequence],  dtype=np.int64)
        attention_mask = np.array([attention], dtype=np.int64)

        assert input_ids.shape      == (1, _MAX_TOKENS), input_ids.shape
        assert attention_mask.shape == (1, _MAX_TOKENS), attention_mask.shape

        return input_ids, attention_mask

    def _run_inference(self, text: str) -> ConversationResult:
        """
        Synchronous inference — called via run_in_executor.
        Returns a fully populated ConversationResult.
        """
        input_ids, attention_mask = self._tokenize(text)

        # Build feed dict — only pass token_type_ids if the model expects it
        input_names = {inp.name for inp in self._session.get_inputs()}
        feed: Dict[str, np.ndarray] = {
            "input_ids":      input_ids,
            "attention_mask": attention_mask,
        }
        if "token_type_ids" in input_names:
            feed["token_type_ids"] = np.zeros_like(input_ids)

        outputs = self._session.run(None, feed)
        # outputs[0] shape: (1, num_classes) — raw logits
        logits: np.ndarray = outputs[0][0]   # shape: (num_classes,)

        probabilities = self._softmax(logits)

        # Guard: if the checkpoint has more/fewer labels than our list,
        # truncate or pad so zip() doesn't silently drop classes.
        labels = self._labels[: len(probabilities)]
        scores = {label: float(prob) for label, prob in zip(labels, probabilities)}

        best_idx        = int(np.argmax(probabilities))
        predicted_class = labels[best_idx]
        confidence      = float(probabilities[best_idx])
        is_scam         = predicted_class != "Safe"

        # Map confidence → risk score (0–100 int).
        # For Safe class: risk_score reflects residual risk (1 - confidence).
        # For scam classes: risk_score is the raw confidence scaled to 0–100.
        if is_scam:
            risk_score = round(confidence * 100)
        else:
            # confidence = P(Safe); residual = 1 - P(Safe) = total scam prob
            residual_scam_prob = 1.0 - confidence
            risk_score = round(residual_scam_prob * 100)

        logger.info(
            "Inference result: class=%s confidence=%.3f risk_score=%d scores=%s",
            predicted_class, confidence, risk_score,
            {k: f"{v:.3f}" for k, v in scores.items()},
        )

        return ConversationResult(
            predicted_class = predicted_class,
            confidence      = confidence,
            scores          = scores,
            risk_score      = risk_score,
            is_scam         = is_scam,
            labels          = labels,
        )

    @staticmethod
    def _softmax(logits: np.ndarray) -> np.ndarray:
        """
        Numerically stable softmax.
        Subtracting max(logits) before exp() prevents overflow with
        large logit values without changing the output distribution.
        """
        shifted = logits - np.max(logits)
        exp_vals = np.exp(shifted)
        return exp_vals / np.sum(exp_vals)

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def labels(self) -> List[str]:
        return list(self._labels)
