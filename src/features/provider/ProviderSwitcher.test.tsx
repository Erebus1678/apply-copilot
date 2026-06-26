import { render, screen, fireEvent } from "@testing-library/react";
import { ProviderSwitcher } from "./ProviderSwitcher";

describe("ProviderSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
  });

  afterEach(() => {
    // @ts-expect-error reset injected mock
    delete global.fetch;
  });

  it("shows the active provider on the trigger and defaults to Local", () => {
    render(<ProviderSwitcher />);
    expect(screen.getByRole("button", { name: /local/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens the menu and selects a provider, persisting the choice", () => {
    render(<ProviderSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /local/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /openai/i }));
    expect(screen.getByRole("menuitemradio", { name: /openai/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(localStorage.getItem("apply-copilot:provider")).toBe("openai");
  });

  it("stores a BYO API key for the active cloud provider on this device", () => {
    render(<ProviderSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /local/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /openai/i }));
    fireEvent.change(screen.getByLabelText(/openai api key/i), { target: { value: "sk-byo" } });
    const cfg = JSON.parse(localStorage.getItem("apply-copilot:provider-config") ?? "{}");
    expect(cfg.openai.apiKey).toBe("sk-byo");
  });

  it("stores a model override for the active provider", () => {
    render(<ProviderSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /local/i }));
    fireEvent.change(screen.getByLabelText(/^model$/i), { target: { value: "my-model" } });
    const cfg = JSON.parse(localStorage.getItem("apply-copilot:provider-config") ?? "{}");
    expect(cfg.local.model).toBe("my-model");
  });
});
