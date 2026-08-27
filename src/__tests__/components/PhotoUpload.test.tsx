import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoUpload from "@/components/contacts/PhotoUpload";

const PHOTO = "data:image/png;base64,iVBORw0KGgo=";

describe("PhotoUpload", () => {
  it("does not let a pending read restore a removed photo", async () => {
    const originalFileReader = globalThis.FileReader;
    const readers: FakeFileReader[] = [];

    class FakeFileReader {
      result: string | ArrayBuffer | null = null;
      onload: FileReader["onload"] = null;
      onerror: FileReader["onerror"] = null;
      abort = jest.fn();

      constructor() {
        readers.push(this);
      }

      readAsDataURL() {}
    }

    globalThis.FileReader = FakeFileReader as unknown as typeof FileReader;
    try {
      const { container } = render(
        <PhotoUpload
          initialPhoto={PHOTO}
          contact={{ first_name: "Ada", last_name: "Lovelace", email: "ada@example.com" }}
          serverErrorToken={{}}
        />,
      );

      await userEvent.upload(
        screen.getByLabelText("Choose profile photo"),
        new File(["replacement"], "replacement.png", { type: "image/png" }),
      );
      await userEvent.click(screen.getByRole("button", { name: "Remove profile photo" }));

      readers[0].result = PHOTO;
      readers[0].onload?.call(
        readers[0] as unknown as FileReader,
        new ProgressEvent("load") as ProgressEvent<FileReader>,
      );

      expect(readers[0].abort).toHaveBeenCalled();
      expect(container.querySelector<HTMLInputElement>('input[name="photo"]')).toHaveValue("");
    } finally {
      globalThis.FileReader = originalFileReader;
    }
  });
});
