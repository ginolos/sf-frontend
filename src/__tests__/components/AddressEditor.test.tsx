import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressEditor from "@/components/contacts/AddressEditor";
import type { AddressFormValue } from "@/lib/contacts/types";

const ADDRESSES: AddressFormValue[] = [
  {
    type: "Home",
    street_address: "12 Home Lane",
    city: "Oakland",
    state: "CA",
    postal_code: "94612",
    country: "USA",
  },
  {
    type: "Work",
    street_address: "1 Market St",
    city: "San Francisco",
    state: "CA",
    postal_code: "94105",
    country: "USA",
  },
];

describe("AddressEditor", () => {
  it("labels each address group and gives its fields a stable autocomplete section", async () => {
    render(
      <AddressEditor
        initialAddresses={ADDRESSES}
        errorToken={{}}
      />,
    );

    const firstGroup = screen.getByRole("group", { name: "Address 1" });
    const secondGroup = screen.getByRole("group", { name: "Address 2" });

    expect(within(firstGroup).getByLabelText("Street address")).toHaveAttribute(
      "autocomplete",
      "section-address-0 street-address",
    );
    expect(within(firstGroup).getByLabelText("Postal code")).toHaveAttribute(
      "autocomplete",
      "section-address-0 postal-code",
    );
    expect(within(secondGroup).getByLabelText("Street address")).toHaveAttribute(
      "autocomplete",
      "section-address-1 street-address",
    );

    await userEvent.click(
      within(firstGroup).getByRole("button", { name: "Remove address 1" }),
    );

    const remainingGroup = screen.getByRole("group", { name: "Address 1" });
    expect(within(remainingGroup).getByLabelText("Street address")).toHaveAttribute(
      "autocomplete",
      "section-address-1 street-address",
    );
  });
});
