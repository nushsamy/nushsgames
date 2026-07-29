import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getGamekeyState = vi.fn();
vi.mock("@/api/gamekey", () => ({
  getGamekeyState: (...args: unknown[]) => getGamekeyState(...args),
}));

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

const { JoinPage } = await import("@/routes/JoinPage");

describe("JoinPage", () => {
  beforeEach(() => {
    getGamekeyState.mockReset();
    navigate.mockReset();
  });

  it("navigates to the display route when the gamekey is valid", async () => {
    getGamekeyState.mockResolvedValue({ status: "in_progress" });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("BEE-A7F2K9"), "bee-a7f2k9");
    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(getGamekeyState).toHaveBeenCalledWith("BEE-A7F2K9");
    expect(navigate).toHaveBeenCalledWith("/display/BEE-A7F2K9");
  });

  it("shows an inline error and allows retry when the gamekey is invalid", async () => {
    const { ApiError } = await import("@/api/httpClient");
    getGamekeyState.mockRejectedValue(new ApiError(404, { error: { code: "NOT_FOUND", message: "nope" } }));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <JoinPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("BEE-A7F2K9"), "BEE-NOPE99");
    await user.click(screen.getByRole("button", { name: /join/i }));

    expect(await screen.findByText("Invalid game key. Please try again.")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    getGamekeyState.mockResolvedValue({ status: "in_progress" });
    await user.click(screen.getByRole("button", { name: /join/i }));
    expect(navigate).toHaveBeenCalledWith("/display/BEE-NOPE99");
  });
});
