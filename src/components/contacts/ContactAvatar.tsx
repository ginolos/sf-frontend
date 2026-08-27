import type { CSSProperties } from "react";
import { avatarHue, initials } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

/** Circular profile photo with a deterministic initials fallback. */
export default function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: Pick<Contact, "first_name" | "last_name" | "email" | "photo">;
  size?: keyof typeof SIZES;
}) {
  const style = {
    "--avatar-hue": avatarHue(contact.email),
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      style={style}
      className={`contact-avatar inline-flex aspect-square shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-display font-semibold ${SIZES[size]}`}
    >
      {contact.photo ? (
        // Data URLs are user-provided and cannot use Next's image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={contact.photo}
          alt=""
          className="h-full w-full aspect-square rounded-full object-cover"
        />
      ) : (
        initials(contact)
      )}
    </span>
  );
}
