"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Shield, Sparkles, X, Zap } from "lucide-react";
import ContactAvatar from "./ContactAvatar";
import Button from "@/components/ui/Button";
import { avatarHue } from "@/lib/contacts/format";
import type { HeroContact } from "@/lib/contacts/types";

export const MAX_ACTIVE_HEROES = 12;
const HERO_ROTATION_MS = 6_000;
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type HeroStyle = CSSProperties & {
  "--hero-hue": number;
  "--hero-top": string;
  "--hero-delay": string;
  "--hero-duration": string;
  "--hero-size": number;
  "--hero-rest": string;
};

function heroStyle(contact: HeroContact, index: number): HeroStyle {
  const hue = avatarHue(contact.email);
  return {
    "--hero-hue": hue,
    "--hero-top": `${10 + ((index * 23 + hue) % 70)}%`,
    "--hero-delay": `${-(index * 1.17 + (hue % 5))}s`,
    "--hero-duration": `${8 + (hue % 5)}s`,
    "--hero-size": 0.82 + (hue % 5) * 0.06,
    "--hero-rest": `${5 + (hue % 76)}vw`,
  };
}

function ContactHero({ contact, index }: { contact: HeroContact; index: number }) {
  return (
    <div
      className={`hero-sprite ${index % 2 ? "hero-sprite-reverse" : ""}`}
      style={heroStyle(contact, index)}
      aria-label={`${contact.full_name}, flying superhero`}
    >
      <span className="hero-whoosh" aria-hidden="true">
        {index % 3 === 0 ? "WHOOSH!" : index % 3 === 1 ? "ZAP!" : "UP, UP!"}
      </span>
      <div className="hero-character">
        <span className="hero-cape" aria-hidden="true" />
        <span className="hero-speed-lines" aria-hidden="true" />
        <span className="hero-fist" aria-hidden="true" />

        <div className="hero-portrait">
          <ContactAvatar contact={contact} size="xl" />
          <span className="hero-mask" aria-hidden="true">
            <i />
            <i />
          </span>
        </div>

        <div className="hero-chest" aria-hidden="true">
          <Shield className="h-7 w-7" strokeWidth={2.5} />
          <Zap className="hero-chest-zap h-3.5 w-3.5" fill="currentColor" />
        </div>
      </div>
      <span className="hero-nameplate">{contact.full_name}</span>
    </div>
  );
}

export default function SuperheroMode({ contacts }: { contacts: HeroContact[] }) {
  const [active, setActive] = useState(false);
  const [batchStart, setBatchStart] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setActive(false), []);

  function open() {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setBatchStart(0);
    setActive(true);
  }

  const visibleHeroes = Array.from(
    { length: Math.min(MAX_ACTIVE_HEROES, contacts.length) },
    (_, index) => contacts[(batchStart + index) % contacts.length],
  );

  useEffect(() => {
    if (!active) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog)
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));
    for (const { element } of background) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    stopButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialog!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0] ?? dialog!;
      const last = focusable.at(-1) ?? dialog!;
      const focused = document.activeElement;

      if (event.shiftKey && (focused === first || !dialog!.contains(focused))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (focused === last || !dialog!.contains(focused))) {
        event.preventDefault();
        first.focus();
      }
    }

    function containFocus(event: FocusEvent) {
      if (!dialog!.contains(event.target as Node)) stopButtonRef.current?.focus();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", containFocus);
      for (const { element, inert, ariaHidden } of background) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      previousFocusRef.current?.focus();
    };
  }, [active, close]);

  useEffect(() => {
    if (!active || contacts.length <= MAX_ACTIVE_HEROES) return;
    const rotation = window.setInterval(
      () => setBatchStart((start) => (start + MAX_ACTIVE_HEROES) % contacts.length),
      HERO_ROTATION_MS,
    );
    return () => window.clearInterval(rotation);
  }, [active, contacts.length]);

  const dialog = active ? (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Contact superhero mode"
      className="hero-universe"
      tabIndex={-1}
    >
      <div className="hero-halftone" aria-hidden="true" />
      <div className="hero-burst hero-burst-one" aria-hidden="true" />
      <div className="hero-burst hero-burst-two" aria-hidden="true" />

      <div className="hero-title" aria-live="polite">
        <span>SF CONTACTS</span>
        <strong>ASSEMBLE!</strong>
      </div>

      <button
        ref={stopButtonRef}
        type="button"
        onClick={close}
        className="hero-stop-button"
        aria-label="Stop hero mode and return contacts to normal"
      >
        <X className="h-5 w-5" aria-hidden="true" />
        Back to normal
      </button>

      <div className="hero-flight-deck">
        {visibleHeroes.map((contact, index) => (
          <ContactHero
            key={contact.id}
            contact={contact}
            index={batchStart + index}
          />
        ))}
      </div>

      <p className="hero-hint">Press Esc or “Back to normal” to land the team</p>
    </div>
  ) : null;

  return (
    <>
      <Button
        type="button"
        variant={active ? "primary" : "secondary"}
        disabled={!contacts.length}
        aria-pressed={active}
        onClick={open}
        className="hero-launch-button relative overflow-hidden"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {active ? "Stop hero mode" : "Hero mode"}
      </Button>

      {dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}
