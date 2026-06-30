// Some OpenAI-compatible routers (e.g. 9Router → Antigravity → Claude) ignore
// JSON mode and wrap the object in a ```json … ``` markdown fence. The client's
// partial-JSON parser (experimental_useObject) chokes on the leading fence, so
// the structured views render nothing. Strip markdown fences from the streamed
// text — provider-agnostic, so native-JSON providers are unaffected (no fence →
// passthrough). Returns a plain text stream compatible with useObject.
//
// HOLD chars are kept back each tick so a *trailing* fence forming at the end can
// be removed on flush; the leading fence is detected and dropped up front.
const HOLD = 4; // enough to buffer a forming "```" (+ optional newline)
const LEADING_FENCE = /^\s*```[a-zA-Z0-9]*[ \t]*\r?\n/;
const PARTIAL_FENCE = /^\s*`{1,3}[a-zA-Z0-9]*$/;
const TRAILING_FENCE = /\s*```+\s*$/;

export function stripFencesStream(textStream: ReadableStream<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const reader = textStream.getReader();
  let buf = "";
  let leadingStripped = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      // Loop until we enqueue something or close, so pull always makes progress
      // (a no-op return wouldn't reliably re-invoke pull, hanging the reader).
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            const out = buf.replace(TRAILING_FENCE, "");
            if (out) controller.enqueue(encoder.encode(out));
            controller.close();
            return;
          }

          buf += value;

          if (!leadingStripped) {
            const open = LEADING_FENCE.exec(buf);
            if (open) {
              buf = buf.slice(open[0].length);
              leadingStripped = true;
            } else if (PARTIAL_FENCE.test(buf)) {
              continue; // could still be an opening fence — read more
            } else {
              leadingStripped = true; // real content, no fence
            }
          }

          if (buf.length > HOLD) {
            const emit = buf.slice(0, buf.length - HOLD);
            buf = buf.slice(buf.length - HOLD);
            controller.enqueue(encoder.encode(emit));
            return;
          }
          // not enough buffered to safely emit yet — read more
        }
      } catch (err) {
        // A provider/model failure mid-stream (bad model id, 404, timeout) rejects
        // the upstream read. Surface it as a clean stream error — the client shows
        // its error state — instead of letting it bubble into an unhandled rejection
        // that can take down the server.
        controller.error(err);
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return stream;
}

export function toFenceStrippedTextResponse(textStream: ReadableStream<string>): Response {
  return new Response(stripFencesStream(textStream), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
