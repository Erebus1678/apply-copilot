import { stripFencesStream } from "./json-stream";

function streamOf(chunks: string[]): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

describe("stripFencesStream", () => {
  it("strips a leading + trailing ```json fence", async () => {
    const out = await readAll(
      stripFencesStream(streamOf(["```json\n", '{"a":1', ',"b":2}', "\n```"])),
    );
    expect(out).toBe('{"a":1,"b":2}');
  });

  it("passes clean JSON through unchanged", async () => {
    const out = await readAll(stripFencesStream(streamOf(['{"a":', "1}"])));
    expect(out).toBe('{"a":1}');
  });

  it("handles an opening fence split across chunks", async () => {
    const out = await readAll(
      stripFencesStream(streamOf(["``", "`json", '\n{"x":', "true}\n```"])),
    );
    expect(out).toBe('{"x":true}');
  });

  it("fails with a clean provider-agnostic message when the upstream errors mid-stream", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Emit a partial object, then reject — mimics a provider dying mid-response.
    const upstream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('{"techStack":[');
        controller.error(new Error("Anthropic API key invalid — secret leak risk"));
      },
    });

    await expect(readAll(stripFencesStream(upstream))).rejects.toThrow(/try again, or switch/i);
    // The raw provider error is logged server-side, never surfaced to the client.
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("surfaces a paid-model (402) provider error as an actionable credits message", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const apiError = Object.assign(new Error("[402]: Paid Model - Credits Required"), {
      statusCode: 402,
    });
    const upstream = new ReadableStream<string>({
      start(controller) {
        controller.error(apiError);
      },
    });

    await expect(readAll(stripFencesStream(upstream))).rejects.toThrow(/needs credits/i);
    errorSpy.mockRestore();
  });

  it("does not log a teardown 'Controller is already closed' error as a provider failure", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Consumer tore the stream down first (client disconnect / body timeout).
    const upstream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue('{"a":');
        controller.error(new TypeError("Invalid state: Controller is already closed"));
      },
    });

    await expect(readAll(stripFencesStream(upstream))).rejects.toThrow(/try again, or switch/i);
    // Teardown noise must not be logged as an "[ai:stream]" provider error.
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
