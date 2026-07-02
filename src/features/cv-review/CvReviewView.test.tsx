import { render, screen, fireEvent } from "@testing-library/react";

const submit = jest.fn();
const stop = jest.fn();
let mockState = {
  object: undefined as unknown,
  submit,
  stop,
  isLoading: false,
  error: undefined as Error | undefined,
};
jest.mock("@ai-sdk/react", () => ({ experimental_useObject: () => mockState }));

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

import { CvReviewView } from "./CvReviewView";

function textCv(text: string): TextCv {
  return { kind: "text", text, layout: null, file: null };
}
const longCv =
  "Senior frontend engineer with eight years of React, TypeScript, and AWS experience.";

describe("CvReviewView", () => {
  beforeEach(() => {
    submit.mockClear();
    mockCv = null;
    mockState = { object: undefined, submit, stop, isLoading: false, error: undefined };
  });

  it("renders the CV input and check button", () => {
    render(<CvReviewView />);
    expect(screen.getByLabelText(/your cv/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check my cv/i })).toBeInTheDocument();
  });

  it("does not submit a CV that is too short", () => {
    mockCv = textCv("short");
    render(<CvReviewView />);
    fireEvent.click(screen.getByRole("button", { name: /check my cv/i }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits the CV text, its layout, and the active provider", () => {
    mockCv = textCv(longCv);
    render(<CvReviewView />);
    fireEvent.click(screen.getByRole("button", { name: /check my cv/i }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ cv: longCv, layout: null }));
  });
});
