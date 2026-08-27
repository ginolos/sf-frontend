"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { Shield, Sparkles, X, Zap } from "lucide-react";
import ContactAvatar from "./ContactAvatar";
import Button from "@/components/ui/Button";
import { avatarHue } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

type HeroStyle = CSSProperties & {
  "--hero-hue": number;
  "--hero-top": string;
  "--hero-delay": string;
  "--hero-duration": string;
  "--hero-size": number;
  "--hero-rest": string;
};

function heroStyle(contact: Contact, index: number): HeroStyle {
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

function ContactHero({ contact, index }: { contact: Contact; index: number }) {
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

export default function SuperheroMode({ contacts }: { contacts: Contact[] }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  return (
    <>
      <Button
        type="button"
        variant={active ? "primary" : "secondary"}
        disabled={!contacts.length}
        aria-pressed={active}
        onClick={() => setActive((current) => !current)}
        className="hero-launch-button relative overflow-hidden"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {active ? "Stop hero mode" : "Hero mode"}
      </Button>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Contact superhero mode"
          className="hero-universe"
        >
          <div className="hero-halftone" aria-hidden="true" />
          <div className="hero-burst hero-burst-one" aria-hidden="true" />
          <div className="hero-burst hero-burst-two" aria-hidden="true" />

          <div className="hero-title" aria-live="polite">
            <span>SF CONTACTS</span>
            <strong>ASSEMBLE!</strong>
          </div>

          <button
            type="button"
            onClick={() => setActive(false)}
            className="hero-stop-button"
            aria-label="Stop hero mode and return contacts to normal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            Back to normal
          </button>

          <div className="hero-flight-deck">
            {contacts.map((contact, index) => (
              <ContactHero key={contact.id} contact={contact} index={index} />
            ))}
          </div>

          <p className="hero-hint">Press Esc or “Back to normal” to land the team</p>
        </div>
      ) : null}
    </>
  );
}
