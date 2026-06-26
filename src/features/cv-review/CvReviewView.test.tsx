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
jest.mock("@/lib/cv/client", () => ({ uploadCv: jest.fn() }));

import { CvReviewView } from "./CvReviewView";

const longCv =
  "Senior frontend engineer with eight years of React, TypeScript, and AWS experience.";

describe("CvReviewView", () => {
  beforeEach(() => {
    submit.mockClear();
    localStorage.clear();
    mockState = { object: undefined, submit, stop, isLoading: false, error: undefined };
  });

  it("renders the CV input and check button", () => {
    render(<CvReviewView />);
    expect(screen.getByLabelText(/your cv/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check my cv/i })).toBeInTheDocument();
  });

  it("does not submit a CV that is too short", () => {
    render(<CvReviewView />);
    fireEvent.change(screen.getByLabelText(/your cv/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /check my cv/i }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("submits the CV and active provider", () => {
    render(<CvReviewView />);
    fireEvent.change(screen.getByLabelText(/your cv/i), { target: { value: longCv } });
    fireEvent.click(screen.getByRole("button", { name: /check my cv/i }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ cv: longCv }));
  });
});
