"use client";

import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import ContactAvatar from "./ContactAvatar";
import Button from "@/components/ui/Button";
import { photoDataUrlSchema } from "@/lib/contacts/schema";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface PhotoUploadProps {
  initialPhoto: string | null;
  contact: {
    first_name: string;
    last_name: string;
    email: string;
  };
  serverError?: string;
  serverErrorToken: object;
}

export default function PhotoUpload({
  initialPhoto,
  contact,
  serverError,
  serverErrorToken,
}: PhotoUploadProps) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [dismissedServerErrorFor, setDismissedServerErrorFor] =
    useState<object | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const readVersionRef = useRef(0);

  function readPhoto(file?: File) {
    readerRef.current?.abort();
    readerRef.current = null;
    const readVersion = ++readVersionRef.current;

    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      if (readVersion !== readVersionRef.current || typeof reader.result !== "string") {
        return;
      }

      const parsed = photoDataUrlSchema.safeParse(reader.result);
      if (!parsed.success || !parsed.data) {
        setError(parsed.error?.issues[0]?.message ?? "That file is not a valid image.");
        return;
      }

      setPhoto(parsed.data);
      setError(undefined);
      setDismissedServerErrorFor(serverErrorToken);
      readerRef.current = null;
    };
    reader.onerror = () => {
      if (readVersion === readVersionRef.current) {
        setError("That photo could not be read. Try another file.");
        readerRef.current = null;
      }
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    readPhoto(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    readPhoto(event.dataTransfer.files?.[0]);
  }

  const message =
    error ?? (dismissedServerErrorFor === serverErrorToken ? undefined : serverError);
  const previewContact = { ...contact, photo };

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`flex flex-col gap-4 rounded-lg border border-dashed p-4 transition-colors sm:flex-row sm:items-center ${
        dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/20"
      }`}
    >
      <input type="hidden" name="photo" value={photo ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onFileChange}
        className="sr-only"
        aria-label="Choose profile photo"
      />

      <div className="relative w-fit">
        <ContactAvatar contact={previewContact} size="lg" />
        <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
          <Camera className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {photo ? "Profile photo ready" : "Add a profile photo"}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          JPEG, PNG, WebP, or GIF up to 2 MB. You can also drop it here.
        </p>
        {message ? (
          <p role="alert" className="mt-1.5 text-[13px] text-destructive">
            {message}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {photo ? "Replace" : "Upload"}
        </Button>
        {photo ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Remove profile photo"
            onClick={() => {
              readVersionRef.current += 1;
              readerRef.current?.abort();
              readerRef.current = null;
              setPhoto(null);
              setError(undefined);
              setDismissedServerErrorFor(serverErrorToken);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
