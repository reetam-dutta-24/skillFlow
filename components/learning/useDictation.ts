"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { dictationErrorText, dictationLang } from "@/lib/explain/dictation";

/**
 * Speech to text with the browser's own speech recognition (the Web Speech API). Chrome and Edge send the audio to
 * their speech service; Safari uses Apple's. LearnProof never receives or stores audio: final phrases are handed to
 * `onPhrase` and land in the text box, and only that text is sent, exactly like typed text.
 */

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; length: number; [index: number]: RecognitionAlternative };
type RecognitionEvent = { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } };
type RecognitionErrorEvent = { error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

const subscribe = () => () => {};

/** "unknown" on the server and during hydration, so the server render and the first client render match. */
export type DictationSupport = "unknown" | "yes" | "no";

export function useDictation(onPhrase: (text: string) => void) {
  const support = useSyncExternalStore<DictationSupport>(
    subscribe,
    () => (recognitionCtor() ? "yes" : "no"),
    () => "unknown",
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const phrase = useRef(onPhrase);

  useEffect(() => {
    phrase.current = onPhrase;
  }, [onPhrase]);

  const stop = useCallback(() => {
    recognition.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    recognition.current?.abort();
    const next = new Ctor();
    next.lang = dictationLang(navigator.language);
    next.continuous = true;
    next.interimResults = true;
    next.onresult = (event) => {
      let live = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript ?? "";
        if (result?.isFinal) phrase.current(text);
        else live += text;
      }
      setInterim(live);
    };
    next.onerror = (event) => {
      const message = dictationErrorText(event.error);
      if (message) setError(message);
    };
    next.onend = () => {
      if (recognition.current === next) recognition.current = null;
      setListening(false);
      setInterim("");
    };
    recognition.current = next;
    setError(null);
    setListening(true);
    try {
      next.start();
    } catch {
      recognition.current = null;
      setListening(false);
      setError(dictationErrorText("start-failed"));
    }
  }, []);

  // Leaving the step, or the page, stops listening at once.
  useEffect(() => () => recognition.current?.abort(), []);

  return { support, listening, interim, error, start, stop };
}
