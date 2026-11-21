"use client";

import { RefObject } from "react";

const FRENCH_CHARS = ["é", "è", "ê", "ë", "à", "â", "ç", "î", "ï", "ô", "û", "ù", "ü", "œ", "’"];

type Props = {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
};

/** Tap-to-insert French characters at the cursor of the given input. */
export function AccentKeyboard({ inputRef, value, onChange }: Props) {
  function insert(ch: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    onChange(next);
    // Restore focus and put the caret after the inserted character.
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  return (
    <div className="flex flex-wrap gap-1" aria-label="French characters">
      {FRENCH_CHARS.map((ch) => (
        <button
          key={ch}
          type="button"
          // Keep focus in the text field so mobile keyboards stay open.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(ch)}
          className="min-w-9 border border-line bg-paper px-2 py-1 text-base text-ink transition hover:bg-paper-deep"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
