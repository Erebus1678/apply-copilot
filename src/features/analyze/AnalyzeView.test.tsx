import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/lib/cv/client", () => ({ uploadCv: jest.fn() }));
import { uploadCv } from "@/lib/cv/client";
const mockUploadCv = uploadCv as jest.Mock;

const submit = jest.fn();
const stop = jest.fn();
let mockState = {
  object: undefined as unknown,
  submit,
  stop,
  isLoading: false,
  error: undefined as Error | undefined,
};

jest.mock("@ai-sdk/react", () => ({
  experimental_useObject: () => mockState,
}));

import { AnalyzeView } from "./AnalyzeView";

describe("AnalyzeView", () => {
  beforeEach(() => {
    submit.mockClear();
    localStorage.clear();
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

    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: "Senior React engineer building streaming UIs on AWS." },
    });
    expect(button).toBeEnabled();
  });

  it("submits the JD (and CV) on analyze", () => {
    render(<AnalyzeView />);
    fireEvent.change(screen.getByLabelText(/job description/i), {
      target: { value: "Senior React engineer building streaming UIs on AWS." },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ jd: expect.stringContaining("Senior React engineer") }),
    );
  });

  it("fills and persists the CV from an upload", async () => {
    mockUploadCv.mockResolvedValue("uploaded cv text");
    render(<AnalyzeView />);
    fireEvent.change(screen.getByLabelText("CV file"), {
      target: { files: [new File(["x"], "cv.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() =>
      expect((screen.getByLabelText(/your cv/i) as HTMLTextAreaElement).value).toBe(
        "uploaded cv text",
      ),
    );
    expect(localStorage.getItem("apply-copilot:cv")).toBe("uploaded cv text");
  });

  it("persists the CV to local storage", () => {
    render(<AnalyzeView />);
    fireEvent.change(screen.getByLabelText(/your cv/i), {
      target: { value: "10 years of React." },
    });
    expect(localStorage.getItem("apply-copilot:cv")).toBe("10 years of React.");
  });
});
