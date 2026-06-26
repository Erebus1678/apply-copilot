import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/lib/cv/client", () => ({ uploadCv: jest.fn() }));

import { uploadCv } from "@/lib/cv/client";
import { CvUpload } from "./CvUpload";

const mockUploadCv = uploadCv as jest.Mock;

function pick(text = "parsed cv") {
  const input = screen.getByLabelText("CV file");
  const file = new File([text], "cv.pdf", { type: "application/pdf" });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("CvUpload", () => {
  beforeEach(() => mockUploadCv.mockReset());

  it("calls onExtracted with the extracted text", async () => {
    mockUploadCv.mockResolvedValue("parsed cv");
    const onExtracted = jest.fn();
    render(<CvUpload onExtracted={onExtracted} />);

    pick();
    await waitFor(() => expect(onExtracted).toHaveBeenCalledWith("parsed cv"));
  });

  it("shows an error when extraction fails", async () => {
    mockUploadCv.mockRejectedValue(new Error("Unsupported file."));
    const onExtracted = jest.fn();
    render(<CvUpload onExtracted={onExtracted} />);

    pick();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported file.");
    expect(onExtracted).not.toHaveBeenCalled();
  });

  it("disables the trigger when disabled", () => {
    render(<CvUpload onExtracted={jest.fn()} disabled />);
    expect(screen.getByRole("button", { name: /upload cv file/i })).toBeDisabled();
  });

  it("reflects drag state and reads a dropped file", async () => {
    mockUploadCv.mockResolvedValue("dropped cv");
    const onExtracted = jest.fn();
    render(<CvUpload onExtracted={onExtracted} />);
    const zone = screen.getByRole("button", { name: /upload cv file/i });

    fireEvent.dragOver(zone);
    expect(zone).toHaveTextContent(/drop to read/i);
    fireEvent.dragLeave(zone);
    expect(zone).toHaveTextContent(/click to upload/i);

    const file = new File(["x"], "cv.pdf", { type: "application/pdf" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    await waitFor(() => expect(onExtracted).toHaveBeenCalledWith("dropped cv"));
  });
});
