import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, unknown> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    photo: "",
    addresses: [],
    notes: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("rejects arbitrary bytes with an allowed image label", () => {
    const result = contactInputSchema.safeParse(
      values({ photo: "data:image/png;base64,aGVsbG8=" }),
    );
    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo content does not match its declared image type",
    );
  });

  it("rejects image bytes that do not match the declared type", () => {
    const result = contactInputSchema.safeParse(
      values({ photo: "data:image/png;base64,/9j/2Q==" }),
    );
    expect(zodFieldErrors(result.error!).photo).toBe(
      "Photo content does not match its declared image type",
    );
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({
        first_name: "a".repeat(101),
        addresses: [
          {
            type: "Home",
            street_address: "1 Main St",
            city: "",
            state: "",
            postal_code: "9".repeat(21),
            country: "",
          },
        ],
      }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
      addresses: "Postal code must be 20 characters or fewer",
    });
  });

  it("requires each typed address to contain a location", () => {
    const result = contactInputSchema.safeParse(
      values({
        addresses: [
          {
            type: "Other",
            street_address: "",
            city: "",
            state: "",
            postal_code: "",
            country: "",
          },
        ],
      }),
    );
    expect(zodFieldErrors(result.error!).addresses).toBe(
      "Enter at least one location field",
    );
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("ignored", "nope");

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(extracted.photo).toBeNull();
    expect(extracted.addresses).toEqual([]);
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "photo", "addresses"].sort(),
    );
  });

  it("deserializes the complete address collection", () => {
    const formData = new FormData();
    formData.set(
      "addresses",
      JSON.stringify([
        {
          type: "Work",
          street_address: "1 Market St",
          city: "San Francisco",
          state: "CA",
          postal_code: "94105",
          country: "USA",
        },
      ]),
    );

    expect(formDataToValues(formData).addresses).toHaveLength(1);
    expect(formDataToValues(formData).addresses[0].type).toBe("Work");
  });
});
