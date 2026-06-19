"""Shared OpenAI helper.

Centralises every OpenAI interaction so we can:
  * enforce the hard daily call budget (``MAX_AI_CALLS_PER_DAY``),
  * always use the cheap ``gpt-4o-mini`` model,
  * log token usage after every call,
  * degrade gracefully (return ``None``) when no key is configured.
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
    """Return the number of OpenAI calls made so far this run."""
    return _call_count


def reset_calls() -> None:
    """Reset the call counter (useful for tests)."""
    global _call_count
    _call_count = 0


def is_available() -> bool:
    """Whether real OpenAI calls can be made."""
    return OpenAI is not None and bool(config.OPENAI_API_KEY)


def chat_json(
    system_prompt: str,
    user_content: str,
    max_tokens: int = config.MAX_TOKENS,
) -> dict[str, Any] | list[Any] | None:
    """Send a single chat completion expecting a JSON response.

    Returns the parsed JSON object/array, or ``None`` if the call could not be
    made (missing key/SDK, budget exceeded, or any runtime error).
    """
    global _call_count

    if not is_available():
        logger.warning("OpenAI unavailable (missing SDK or OPENAI_API_KEY); skipping call")
        return None

    if _call_count >= config.MAX_AI_CALLS_PER_DAY:
        logger.warning(
            "AI call budget reached (%d/%d); skipping further calls",
            _call_count, config.MAX_AI_CALLS_PER_DAY,
        )
        return None

    try:
        client = OpenAI(api_key=config.OPENAI_API_KEY)
        _call_count += 1
        logger.info(
            "OpenAI call %d/%d using model %s",
            _call_count, config.MAX_AI_CALLS_PER_DAY, config.AI_MODEL,
        )
        response = client.chat.completions.create(
            model=config.AI_MODEL,
            max_tokens=max_tokens,
            temperature=0.7,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )

        usage = getattr(response, "usage", None)
        if usage is not None:
            logger.info(
                "Token usage — prompt: %s, completion: %s, total: %s",
                getattr(usage, "prompt_tokens", "?"),
                getattr(usage, "completion_tokens", "?"),
                getattr(usage, "total_tokens", "?"),
            )

        content = response.choices[0].message.content or ""
        return json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("OpenAI returned non-JSON content: %s", exc)
        return None
    except Exception as exc:  # noqa: BLE001
        logger.error("OpenAI call failed: %s", exc)
        return None
