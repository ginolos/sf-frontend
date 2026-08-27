import { render } from "@testing-library/react";
import ContactAvatar from "@/components/contacts/ContactAvatar";
import { makeContact } from "../mocks/handlers";

describe("ContactAvatar", () => {
  it("shows initials when the contact has no photo", () => {
    const { container } = render(<ContactAvatar contact={makeContact()} />);

    expect(container).toHaveTextContent("AL");
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("shows a circular, cropped photo when one is available", () => {
    const photo = "data:image/png;base64,aGVsbG8=";
    const { container } = render(
      <ContactAvatar contact={makeContact({ photo })} />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", photo);
    expect(image).toHaveClass("rounded-full", "aspect-square", "object-cover");
    expect(container).not.toHaveTextContent("AL");
  });
});
