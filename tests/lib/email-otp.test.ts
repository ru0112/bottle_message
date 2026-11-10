import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("../../lib/supabase/client", () => ({
  getSupabaseClient: () => ({ auth: authMocks }),
}));

import { sendEmailOtp, verifyEmailOtp } from "../../lib/supabase/email-otp";

describe("email OTP authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.signInWithOtp.mockResolvedValue({ error: null });
    authMocks.verifyOtp.mockResolvedValue({ error: null });
  });

  it("requests an email OTP without a magic-link redirect", async () => {
    await sendEmailOtp("user@example.com");

    expect(authMocks.signInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
    });
  });

  it("verifies the six-digit email OTP", async () => {
    await verifyEmailOtp("user@example.com", "012345");

    expect(authMocks.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "012345",
      type: "email",
    });
  });

  it("surfaces email send errors", async () => {
    authMocks.signInWithOtp.mockResolvedValue({
      error: new Error("email send failed"),
    });

    await expect(sendEmailOtp("user@example.com")).rejects.toThrow(
      "email send failed",
    );
  });

  it("surfaces invalid or expired OTP errors", async () => {
    authMocks.verifyOtp.mockResolvedValue({
      error: new Error("Token has expired or is invalid"),
    });

    await expect(
      verifyEmailOtp("user@example.com", "012345"),
    ).rejects.toThrow("Token has expired or is invalid");
  });
});
