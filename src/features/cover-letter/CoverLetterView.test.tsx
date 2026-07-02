import { render, screen, fireEvent } from "@testing-library/react";

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

let capturedOpts: { onFinish?: (prompt: string, text: string) => void } | undefined;
jest.mock("@ai-sdk/react", () => ({
  useCompletion: (opts: { onFinish?: (prompt: string, text: string) => void }) => {
    capturedOpts = opts;
    return mockState;
  },
}));

type TextCv = { kind: "text"; text: string; layout: null; file: null };
let mockCv: TextCv | null = null;
jest.mock("@/shared/cv/cvStore", () => ({
  useCurrentCv: () => ({
    cv: mockCv,
    setText: jest.fn(),
    setUpload: jest.fn(),
    clear: jest.fn(),
    loading: false,
  }),
}));

import { CoverLetterView } from "./CoverLetterView";

const longJd = "Senior React engineer building streaming AI interfaces on Next.js and AWS.";
const longCv = "Five years of React and TypeScript, shipped multiple Next.js products.";

describe("CoverLetterView", () => {
  beforeEach(() => {
    complete.mockClear();
    mockCv = null;
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
    fireEvent.change(screen.getByLabelText("Job description"), { target: { value: longJd } });
    expect(button).toBeEnabled();
  });

  it("blocks drafting and warns when the CV is missing", () => {
    render(<CoverLetterView />);
    fireEvent.change(screen.getByLabelText("Job description"), { target: { value: longJd } });
    fireEvent.click(screen.getByRole("button", { name: /draft letter/i }));
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/add your cv/i);
  });

  it("drafts with the JD and CV in the request body", () => {
    mockCv = { kind: "text", text: longCv, layout: null, file: null };
    render(<CoverLetterView />);
    fireEvent.change(screen.getByLabelText("Job description"), { target: { value: longJd } });
    fireEvent.click(screen.getByRole("button", { name: /draft letter/i }));
    expect(complete).toHaveBeenCalledWith(
      "",
      expect.objectContaining({ body: expect.objectContaining({ jd: longJd, cv: longCv }) }),
    );
  });

  it("copies the draft to the clipboard", () => {
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

  it("post-processes the finished draft to strip slop", () => {
    render(<CoverLetterView />);
    capturedOpts?.onFinish?.("", "**Dear** team,\n\n\n\nThanks.");
    expect(setCompletion).toHaveBeenCalledWith("Dear team,\n\nThanks.");
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
