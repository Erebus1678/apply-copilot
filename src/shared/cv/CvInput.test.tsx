import { render, screen, fireEvent } from "@testing-library/react";

type Cv =
  | { kind: "text"; text: string; layout: null; file: null }
  | { kind: "file"; text: string; layout: null; file: File };

let mockCv: Cv | null = null;
const setText = jest.fn();
const setUpload = jest.fn();
const clear = jest.fn();
jest.mock("./cvStore", () => ({
  useCurrentCv: () => ({ cv: mockCv, setText, setUpload, clear, loading: false }),
}));
jest.mock("docx-preview", () => ({ renderAsync: jest.fn() }));

import { CvInput } from "./CvInput";

describe("CvInput", () => {
  beforeEach(() => {
    mockCv = null;
    setText.mockClear();
    setUpload.mockClear();
    clear.mockClear();
  });

  it("shows a textarea and upload dropzone when empty, and edits via the store", () => {
    render(<CvInput id="cv" placeholder="Paste your CV" />);
    const textarea = screen.getByLabelText(/your cv/i);
    expect(textarea).toBeInTheDocument();
    expect(screen.getByLabelText("CV file")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "typed cv" } });
    expect(setText).toHaveBeenCalledWith("typed cv");
  });

  it("shows the file preview and a remove control for an uploaded PDF", () => {
    Object.assign(URL, { createObjectURL: () => "blob:mock", revokeObjectURL: jest.fn() });
    mockCv = {
      kind: "file",
      text: "extracted",
      layout: null,
      file: new File(["x"], "resume.pdf", { type: "application/pdf" }),
    };
    render(<CvInput id="cv" placeholder="Paste your CV" />);

    expect(screen.getByText("resume.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("Uploaded PDF preview")).toBeInTheDocument();
    // No raw textarea for the CV in file mode (the extracted text is behind a disclosure).
    expect(screen.queryByPlaceholderText("Paste your CV")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(clear).toHaveBeenCalled();
  });
});
