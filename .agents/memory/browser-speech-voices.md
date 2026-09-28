---
name: Browser speech voices
description: Browser SpeechSynthesis voice availability and fallback behavior.
---

SpeechSynthesis voice lists are not guaranteed to be populated when the page first initializes.

**Why:** Some browsers populate `getVoices()` asynchronously, so selecting only during component mount can miss the best English voice or incorrectly fall back.

**How to apply:** Refresh the preferred voice when `voiceschanged` fires, prefer a natural English voice when available, and leave the utterance voice unset when no English/default voice is available so the browser can use its own default.