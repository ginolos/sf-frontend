"use client";

import { useRef, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  ADDRESS_TYPES,
  type AddressFormValue,
} from "@/lib/contacts/types";

const CONTROL =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-input";

type EditableAddress = AddressFormValue & { key: string };

function blankAddress(key: string): EditableAddress {
  return {
    key,
    type: "Home",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  };
}

export default function AddressEditor({
  initialAddresses,
  error,
  errorToken,
}: {
  initialAddresses: AddressFormValue[];
  error?: string;
  errorToken: object;
}) {
  const nextKey = useRef(initialAddresses.length);
  const [addresses, setAddresses] = useState<EditableAddress[]>(() =>
    initialAddresses.map((address, index) => ({ ...address, key: `address-${index}` })),
  );
  const [dismissedErrorFor, setDismissedErrorFor] = useState<object | null>(null);

  function changeAddress<Field extends keyof AddressFormValue>(
    key: string,
    field: Field,
    value: AddressFormValue[Field],
  ) {
    setAddresses((current) =>
      current.map((address) =>
        address.key === key ? { ...address, [field]: value } : address,
      ),
    );
    setDismissedErrorFor(errorToken);
  }

  const serialized = addresses.map((address) => ({
    type: address.type,
    street_address: address.street_address,
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country,
  }));
  const message = dismissedErrorFor === errorToken ? undefined : error;

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Addresses</legend>
      <input type="hidden" name="addresses" value={JSON.stringify(serialized)} />

      <div className="flex items-end justify-between gap-4 border-b border-hairline pb-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">
            Addresses
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Add home, work, or other postal details.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={addresses.length >= 20}
          onClick={() => {
            const key = `address-${nextKey.current++}`;
            setAddresses((current) => [...current, blankAddress(key)]);
            setDismissedErrorFor(errorToken);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add address
        </Button>
      </div>

      {addresses.length ? (
        <div className="space-y-3">
          {addresses.map((address, index) => {
            const prefix = `address-${address.key}`;
            return (
              <div key={address.key} className="rounded-lg border border-border bg-secondary/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Address {index + 1}
                      </p>
                      <label htmlFor={`${prefix}-type`} className="sr-only">
                        Address {index + 1} type
                      </label>
                      <select
                        id={`${prefix}-type`}
                        value={address.type}
                        onChange={(event) =>
                          changeAddress(
                            address.key,
                            "type",
                            event.target.value as AddressFormValue["type"],
                          )
                        }
                        className="mt-0.5 rounded border border-border bg-input px-2 py-1 text-[12px] font-medium text-foreground"
                      >
                        {ADDRESS_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove address ${index + 1}`}
                    onClick={() => {
                      setAddresses((current) =>
                        current.filter((candidate) => candidate.key !== address.key),
                      );
                      setDismissedErrorFor(errorToken);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["street_address", "Street address", "1 Market St, Suite 400", "street-address"],
                      ["city", "City", "San Francisco", "address-level2"],
                      ["state", "State / region", "CA", "address-level1"],
                      ["postal_code", "Postal code", "94105", "postal-code"],
                      ["country", "Country", "USA", "country-name"],
                    ] as const
                  ).map(([field, label, placeholder, autoComplete]) => (
                    <div
                      key={field}
                      className={field === "street_address" ? "sm:col-span-2" : undefined}
                    >
                      <label
                        htmlFor={`${prefix}-${field}`}
                        className="mb-1.5 block text-[13px] font-medium text-foreground"
                      >
                        {label}
                      </label>
                      <input
                        id={`${prefix}-${field}`}
                        value={address[field]}
                        maxLength={field === "street_address" ? 300 : field === "postal_code" ? 20 : 120}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        onChange={(event) => changeAddress(address.key, field, event.target.value)}
                        className={CONTROL}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
          <MapPin className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 text-[13px] text-muted-foreground">
            No addresses yet. Add as many as this contact needs.
          </p>
        </div>
      )}

      {message ? (
        <p role="alert" className="text-[13px] text-destructive">
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}
