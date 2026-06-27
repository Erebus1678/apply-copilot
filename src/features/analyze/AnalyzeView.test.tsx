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
jest.mock("@/features/cv/cvStore", () => ({
  useCurrentCv: () => ({
    cv: mockCv,
    setText: jest.fn(),
    setUpload: jest.fn(),
    clear: jest.fn(),
    loading: false,
  }),
}));

import { AnalyzeView } from "./AnalyzeView";

const jd = "Senior React engineer building streaming UIs on AWS.";

describe("AnalyzeView", () => {
  beforeEach(() => {
    submit.mockClear();
    mockCv = null;
    mockState = { object: undefined, submit, stop, isLoading: false, error: undefined };
  });

  it("renders the JD and CV inputs", () => {
    render(<AnalyzeView />);
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your cv/i)).toBeInTheDocument();
  });

  it("keeps Analyze disabled until the JD is long enough", () => {
    render(<AnalyzeView />);
    const button = screen.getByRole("button", { name: /analyze/i });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: jd } });
    expect(button).toBeEnabled();
  });

  it("submits the JD and the stored CV text", () => {
    mockCv = { kind: "text", text: "10 years of React.", layout: null, file: null };
    render(<AnalyzeView />);
    fireEvent.change(screen.getByLabelText(/job description/i), { target: { value: jd } });
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ jd, cv: "10 years of React." }));
  });
});
