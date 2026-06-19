"""Shared AI helper (Ollama Cloud via the OpenAI-compatible client).

Centralises every AI interaction so we can:
  * enforce the hard daily call budget (``MAX_AI_CALLS_PER_DAY``),
  * always use the configured ``llama3.2`` model on Ollama Cloud,
  * log usage after every call,
  * degrade gracefully (return ``None``) when the API is unavailable.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import config

logger = logging.getLogger(__name__)

try:  # pragma: no cover - import guard
    from openai import OpenAI
except ImportError:  # pragma: no cover
    OpenAI = None  # type: ignore[assignment]

# Process-wide counter guarding the daily AI-call budget.
_call_count: int = 0


def calls_made() -> int:
    """Return the number of AI calls made so far this run."""
    return _call_count


def reset_calls() -> None:
    """Reset the call counter (useful for tests)."""
    global _call_count
    _call_count = 0


def is_available() -> bool:
    """Whether real Ollama Cloud calls can be made."""
    return OpenAI is not None and bool(config.OLLAMA_API_KEY)


def chat_json(
    system_prompt: str,
    user_content: str,
) -> dict[str, Any] | list[Any] | None:
    """Send a single chat completion expecting a JSON response.

    Returns the parsed JSON object/array, or ``None`` if the call could not be
    made (missing SDK/key, budget exceeded, or any runtime error).
    """
    global _call_count

    if not is_available():
        logger.warning("Ollama Cloud unavailable (missing SDK or OLLAMA_API_KEY); skipping call")
        return None

    if _call_count >= config.MAX_AI_CALLS_PER_DAY:
        logger.warning(
            "AI call budget reached (%d/%d); skipping further calls",
            _call_count, config.MAX_AI_CALLS_PER_DAY,
        )
        return None

    prompt = f"{system_prompt}\n\n{user_content}"

    try:
        client = OpenAI(
            base_url=config.OLLAMA_BASE_URL,
            api_key=config.OLLAMA_API_KEY,
        )
        _call_count += 1
        logger.info(
            "Ollama Cloud call %d/%d using model %s",
            _call_count, config.MAX_AI_CALLS_PER_DAY, config.AI_MODEL,
        )
        response = client.chat.completions.create(
            model=config.AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )

        usage = getattr(response, "usage", None)
        if usage is not None:
            logger.info(
                "Token usage — prompt: %s, completion: %s, total: %s",
                getattr(usage, "prompt_tokens", "?"),
                getattr(usage, "completion_tokens", "?"),
                getattr(usage, "total_tokens", "?"),
            )

        result = response.choices[0].message.content or ""
        return json.loads(result)
    except json.JSONDecodeError as exc:
        logger.error("Ollama Cloud returned non-JSON content: %s", exc)
        return None
    except Exception as exc:  # noqa: BLE001
        logger.error("Ollama Cloud call failed: %s", exc)
        return None
