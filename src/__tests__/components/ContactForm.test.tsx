import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/components/contacts/ContactForm";
import { makeContact } from "../mocks/handlers";
import type { FormState } from "@/lib/contacts/types";

const PHOTO = "data:image/png;base64,iVBORw0KGgo=";
const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function renderForm(action: jest.Mock, contact?: ReturnType<typeof makeContact>) {
  return render(
    <ContactForm
      action={action as never}
      contact={contact}
      submitLabel="Create contact"
      cancelHref="/contacts"
    />,
  );
}

describe("ContactForm", () => {
  it("renders every editable field", () => {
    renderForm(jest.fn());

    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/last name/i)).toBeRequired();
    expect(screen.getByLabelText(/^email/i)).toBeRequired();
    expect(screen.getByLabelText(/phone/i)).not.toBeRequired();
    expect(screen.getByLabelText(/notes/i).tagName).toBe("TEXTAREA");
  });

  it("prefills from an existing contact", () => {
    renderForm(jest.fn(), makeContact());

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Ada");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("ada@example.com");
    expect(screen.getByLabelText(/street address/i)).toHaveValue("1 Market St");
    expect(screen.getByLabelText(/address 1 type/i)).toHaveValue("Work");
  });

  it("carries an existing photo through a full edit submission", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action, makeContact({ photo: PHOTO }));

    expect(screen.getByText("Profile photo ready")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));
    await waitFor(() => expect(action).toHaveBeenCalled());

    expect(action.mock.calls[0][1].get("photo")).toBe(PHOTO);
    expect(JSON.parse(String(action.mock.calls[0][1].get("addresses")))).toHaveLength(1);
  });

  it("adds and submits multiple typed addresses", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action);

    await userEvent.click(screen.getByRole("button", { name: "Add address" }));
    await userEvent.selectOptions(screen.getByLabelText(/address 1 type/i), "Home");
    await userEvent.type(screen.getByLabelText("Street address"), "12 Home Lane");
    await userEvent.click(screen.getByRole("button", { name: "Add address" }));
    await userEvent.selectOptions(screen.getByLabelText(/address 2 type/i), "Work");
    await userEvent.type(screen.getAllByLabelText("City")[1], "San Francisco");

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/^email/i), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));
    await waitFor(() => expect(action).toHaveBeenCalled());

    expect(JSON.parse(String(action.mock.calls[0][1].get("addresses")))).toEqual([
      expect.objectContaining({ type: "Home", street_address: "12 Home Lane" }),
      expect.objectContaining({ type: "Work", city: "San Francisco" }),
    ]);
  });

  it("uploads a photo and includes its data URL", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action);

    await userEvent.upload(
      screen.getByLabelText("Choose profile photo"),
      new File([PNG_SIGNATURE], "avatar.png", { type: "image/png" }),
    );
    await screen.findByText("Profile photo ready");

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/^email/i), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));
    await waitFor(() => expect(action).toHaveBeenCalled());

    expect(action.mock.calls[0][1].get("photo")).toBe(PHOTO);
  });

  it("clears a server photo error after a valid replacement", async () => {
    const action = jest.fn(
      async (): Promise<FormState> => ({
        status: "error",
        message: "The API rejected these values.",
        fieldErrors: { photo: "Photo content does not match its declared image type" },
      }),
    );
    renderForm(action);

    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));
    expect(await screen.findByText(/photo content does not match/i)).toBeInTheDocument();

    await userEvent.upload(
      screen.getByLabelText("Choose profile photo"),
      new File([PNG_SIGNATURE], "fixed.png", { type: "image/png" }),
    );
    await screen.findByText("Profile photo ready");
    expect(screen.queryByText(/photo content does not match/i)).not.toBeInTheDocument();
  });

  it("submits the entered values to the action", async () => {
    const action = jest.fn<Promise<FormState>, [FormState, FormData]>(
      async () => ({ status: "idle" }),
    );
    renderForm(action);

    await userEvent.type(screen.getByLabelText(/first name/i), "Grace");
    await userEvent.type(screen.getByLabelText(/last name/i), "Hopper");
    await userEvent.type(screen.getByLabelText(/^email/i), "grace@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    await waitFor(() => expect(action).toHaveBeenCalled());

    const formData = action.mock.calls[0][1];
    expect(formData.get("first_name")).toBe("Grace");
    expect(formData.get("email")).toBe("grace@example.com");
  });

  it("shows the summary and the per-field errors the action returns", async () => {
    const action = jest.fn(
      async (): Promise<FormState> => ({
        status: "error",
        message: "That email address is already taken.",
        fieldErrors: { email: "This email is already in use." },
        values: { first_name: "Grace" },
      }),
    );
    renderForm(action);

    await userEvent.click(screen.getByRole("button", { name: /create contact/i }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((node) => node.textContent)).toEqual(
      expect.arrayContaining([
        "That email address is already taken.",
        "This email is already in use.",
      ]),
    );
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("links back out without submitting", () => {
    renderForm(jest.fn());
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/contacts",
    );
  });
});
