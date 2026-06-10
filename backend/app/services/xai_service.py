import numpy as np
import shap
from shap.maskers import Text as TextMasker
import logging
import traceback
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class XaiExplainer:
    def __init__(self, tokenizer, onnx_session):
        """
        Initializes the SHAP Text explainer using the loaded ONNX model and tokenizer.

        We explicitly construct a shap.maskers.Text masker and pass it to
        shap.Explainer. Without this, SHAP inspects the second argument and
        may fall back to a numerical Permutation explainer (which expects a
        numpy feature matrix, not strings), causing the
        'str object has no attribute shape' crash seen in permutation.py.
        With a Text masker, SHAP correctly routes to its Partition / Text
        explainer pathway, which masks whole tokens rather than numeric features.
        """
        self.tokenizer = tokenizer
        self.session = onnx_session
        logger.info("Initializing XAI Explainer Module...")

        # Build an explicit Text masker so SHAP always uses the text-aware
        # explainer pathway regardless of how it infers the masker type.
        # self.tokenizer is a custom ONNX tokenizer that lacks the __call__
        # interface shap.maskers.Text requires. Passing a regex instead tells
        # SHAP to split on non-word characters (spaces, punctuation) to produce
        # its masked variants — functionally correct for word-level attribution
        # and fully compatible with any tokenizer implementation.
        masker = TextMasker(r"\W+")
        self.explainer = shap.Explainer(self._predict_fn, masker=masker)
        logger.info("✓ XAI Explainer Ready.")

    def _predict_fn(self, texts):
        import numpy as np
        clean_texts = [str(t) for t in texts]
        
        encodings = self.tokenizer.encode_batch(clean_texts)
        
        MAX_LEN = 128
        input_ids_list = []
        attention_mask_list = []
        
        for enc in encodings:
            # Truncate if too long
            ids = enc.ids[:MAX_LEN]
            mask = enc.attention_mask[:MAX_LEN]
            
            # Pad with zeros if too short
            pad_len = MAX_LEN - len(ids)
            ids = ids + [0] * pad_len
            mask = mask + [0] * pad_len
            
            input_ids_list.append(ids)
            attention_mask_list.append(mask)
            
        ort_inputs = {
            "input_ids": np.array(input_ids_list, dtype=np.int64),
            "attention_mask": np.array(attention_mask_list, dtype=np.int64)
        }
        
        logits = self.session.run(None, ort_inputs)[0]
        
        # Convert logits to probabilities via softmax
        exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)
        
        return probs

    def get_token_attributions(self, text: str, target_class_index: int = 1) -> List[Dict[str, Any]]:
        """
        Calculates the SHAP attribution weight for every token in the input string.
        Returns a list of dicts mapping each visible token to its risk impact.

        Now that the explainer is correctly initialised with a Text masker, a
        plain Python list is the right input format — no numpy wrapping needed.
        """
        try:
            # The Text explainer expects a list of strings.
            shap_values = self.explainer([text])

            # shap_values.data[0]          → list of token strings for sample 0
            # shap_values.values[0, :, k]  → attribution weights for class k
            tokens  = shap_values.data[0]
            weights = shap_values.values[0, :, target_class_index]

            attributions = []
            for token, weight in zip(tokens, weights):
                # Skip standard BERT special tokens
                if token in ('[CLS]', '[SEP]', '[PAD]'):
                    continue
                # Rejoin WordPiece subword tokens (e.g. '##ing' → 'ing')
                clean_token = token.replace('##', '').strip()
                if not clean_token:
                    continue
                attributions.append({
                    "word":       clean_token,
                    "weight":     float(weight),
                    # True when the token is a strong positive driver of the scam class
                    "is_trigger": float(weight) > 0.15,
                })

            return attributions

        except Exception as e:
            logger.error(
                "XAI Extraction Failed: %s\n%s",
                str(e),
                traceback.format_exc(),
            )
            return []
