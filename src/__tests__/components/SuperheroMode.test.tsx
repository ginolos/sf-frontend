import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuperheroMode from "@/components/contacts/SuperheroMode";
import { makeContact } from "../mocks/handlers";

describe("SuperheroMode", () => {
  it("makes the page inert, contains focus, and restores focus when closed", async () => {
    const contacts = [
      makeContact(),
      makeContact({ id: 2, first_name: "Grace", last_name: "Hopper", full_name: "Grace Hopper" }),
    ];
    const { container } = render(
      <>
        <button type="button">Neighboring control</button>
        <SuperheroMode contacts={contacts} />
      </>,
    );
    const launchButton = screen.getByRole("button", { name: "Hero mode" });

    await userEvent.click(launchButton);

    expect(screen.getByRole("dialog", { name: "Contact superhero mode" })).toBeVisible();
    expect(screen.getByLabelText("Ada Lovelace, flying superhero")).toBeVisible();
    expect(screen.getByLabelText("Grace Hopper, flying superhero")).toBeVisible();
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(container).toHaveAttribute("aria-hidden", "true");
    expect(container.inert).toBe(true);

    const stopButton = screen.getByRole("button", {
      name: /stop hero mode and return contacts/i,
    });
    expect(stopButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(stopButton).toHaveFocus();
    container.querySelector<HTMLButtonElement>("button")?.focus();
    expect(stopButton).toHaveFocus();

    await userEvent.click(stopButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    expect(container).not.toHaveAttribute("aria-hidden");
    expect(container.inert).not.toBe(true);
    expect(launchButton).toHaveFocus();
  });

  it("lands the team when Escape is pressed", async () => {
    render(<SuperheroMode contacts={[makeContact()]} />);
    const launchButton = screen.getByRole("button", { name: "Hero mode" });
    await userEvent.click(launchButton);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(launchButton).toHaveFocus();
  });

  it("limits the number of simultaneously animated contacts", async () => {
    const contacts = Array.from({ length: 20 }, (_, index) =>
      makeContact({
        id: index + 1,
        email: `hero-${index + 1}@example.com`,
        full_name: `Hero ${index + 1}`,
      }),
    );
    render(<SuperheroMode contacts={contacts} />);

    await userEvent.click(screen.getByRole("button", { name: "Hero mode" }));

    expect(screen.getAllByLabelText(/flying superhero$/)).toHaveLength(12);
  });

  it("is disabled when there are no contacts", () => {
    render(<SuperheroMode contacts={[]} />);
    expect(screen.getByRole("button", { name: "Hero mode" })).toBeDisabled();
  });
});
