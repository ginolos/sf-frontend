import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuperheroMode from "@/components/contacts/SuperheroMode";
import { makeContact } from "../mocks/handlers";

describe("SuperheroMode", () => {
  it("launches every contact and returns them to normal", async () => {
    const contacts = [
      makeContact(),
      makeContact({ id: 2, first_name: "Grace", last_name: "Hopper", full_name: "Grace Hopper" }),
    ];
    render(<SuperheroMode contacts={contacts} />);

    await userEvent.click(screen.getByRole("button", { name: "Hero mode" }));

    expect(screen.getByRole("dialog", { name: "Contact superhero mode" })).toBeVisible();
    expect(screen.getByLabelText("Ada Lovelace, flying superhero")).toBeVisible();
    expect(screen.getByLabelText("Grace Hopper, flying superhero")).toBeVisible();
    expect(document.body).toHaveStyle({ overflow: "hidden" });

    await userEvent.click(
      screen.getByRole("button", { name: /stop hero mode and return contacts/i }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("lands the team when Escape is pressed", async () => {
    render(<SuperheroMode contacts={[makeContact()]} />);
    await userEvent.click(screen.getByRole("button", { name: "Hero mode" }));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is disabled when there are no contacts", () => {
    render(<SuperheroMode contacts={[]} />);
    expect(screen.getByRole("button", { name: "Hero mode" })).toBeDisabled();
  });
});
