"use client";

type SpeakButtonProps = {
  text: string;
  language: "EN" | "FR";
  label?: string;
  className?: string;
};

export function SpeakButton({
  text,
  language,
  label = "Listen",
  className = "",
}: SpeakButtonProps) {
  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === "FR" ? "fr-FR" : "en-US";
    utter.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      language === "FR"
        ? v.lang.toLowerCase().startsWith("fr")
        : v.lang.toLowerCase().startsWith("en"),
    );
    if (preferred) utter.voice = preferred;

    window.speechSynthesis.speak(utter);
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={`Listen to pronunciation of ${text}`}
      className={
        className ||
        "inline-flex items-center gap-1.5 border border-line bg-paper px-2.5 py-1 text-sm font-medium text-ink-soft transition hover:bg-paper-deep hover:text-ink"
      }
    >
      <span aria-hidden>▶</span>
      {label}
    </button>
  );
}
