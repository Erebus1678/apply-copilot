import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/lib/cv/client", () => ({ uploadCv: jest.fn() }));
import { uploadCv } from "@/lib/cv/client";
const mockUploadCv = uploadCv as jest.Mock;

const complete = jest.fn();
const stop = jest.fn();
const setCompletion = jest.fn();
let mockState = {
  completion: "",
  complete,
  setCompletion,
  stop,
  isLoading: false,
  error: undefined as Error | undefined,
};

jest.mock("@ai-sdk/react", () => ({
  useCompletion: () => mockState,
}));

import { CoverLetterView } from "./CoverLetterView";

const longJd = "Senior React engineer building streaming AI interfaces on Next.js and AWS.";
const longCv = "Five years of React and TypeScript, shipped multiple Next.js products.";

describe("CoverLetterView", () => {
  beforeEach(() => {
    complete.mockClear();
    localStorage.clear();
    mockState = {
      completion: "",
      complete,
      setCompletion,
      stop,
      isLoading: false,
      error: undefined,
    };
  });

  it("keeps the draft button disabled until the JD is long enough", () => {
    render(<CoverLetterView />);
    const button = screen.getByRole("button", { name: /draft letter/i });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: longJd } });
    expect(button).toBeEnabled();
  });

  it("blocks drafting and warns when the CV is missing", () => {
    render(<CoverLetterView />);
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: longJd } });
    fireEvent.click(screen.getByRole("button", { name: /draft letter/i }));
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/add your cv/i);
  });

  it("drafts with the JD and CV in the request body", () => {
    render(<CoverLetterView />);
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: longJd } });
    fireEvent.change(screen.getByLabelText(/your cv/i), { target: { value: longCv } });
    fireEvent.click(screen.getByRole("button", { name: /draft letter/i }));
    expect(complete).toHaveBeenCalledWith(
      "",
      expect.objectContaining({ body: expect.objectContaining({ jd: longJd, cv: longCv }) }),
    );
  });

  it("copies the draft to the clipboard", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    mockState = { ...mockState, completion: "Dear hiring manager, ..." };

    render(<CoverLetterView />);
    fireEvent.click(screen.getByRole("button", { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledWith("Dear hiring manager, ...");
  });

  it("shows a generation error", () => {
    mockState = { ...mockState, error: new Error("provider unreachable") };
    render(<CoverLetterView />);
    expect(screen.getByRole("alert")).toHaveTextContent("provider unreachable");
  });

  it("fills the CV and clears the warning from an upload", async () => {
    mockUploadCv.mockResolvedValue("uploaded cv body");
    render(<CoverLetterView />);
    // Trigger the missing-CV warning first.
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: longJd } });
    fireEvent.click(screen.getByRole("button", { name: /draft letter/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("CV file"), {
      target: { files: [new File(["x"], "cv.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() =>
      expect((screen.getByLabelText(/your cv/i) as HTMLTextAreaElement).value).toBe(
        "uploaded cv body",
      ),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("edits the streamed draft via setCompletion", () => {
    mockState = { ...mockState, completion: "Draft body" };
    render(<CoverLetterView />);
    fireEvent.change(screen.getByLabelText(/cover letter draft/i), {
      target: { value: "Edited body" },
    });
    expect(setCompletion).toHaveBeenCalledWith("Edited body");
  });
});
