import { describe, it, expect } from "vitest";
import {
  isUuid,
  azureConsentUrl,
  azureRoleCommand,
  AZURE_ROLE_NAME,
  TENANT_PLACEHOLDER,
  CLIENT_PLACEHOLDER,
  SUBSCRIPTION_PLACEHOLDER,
} from "../lib/azure-template";

const TENANT = "11111111-1111-1111-1111-111111111111";
const CLIENT = "22222222-2222-2222-2222-222222222222";
const SUB = "33333333-3333-3333-3333-333333333333";

describe("azure cross-tenant connect", () => {
  it("validates GUIDs (tenant / subscription / client ids)", () => {
    expect(isUuid(TENANT)).toBe(true);
    expect(isUuid("  " + CLIENT.toUpperCase() + "  ")).toBe(true); // trims + case-insensitive
    expect(isUuid("33333333-3333-3333-3333-33333333333")).toBe(false);  // too short
    expect(isUuid("33333333-3333-3333-3333-3333333333333")).toBe(false); // too long
    expect(isUuid("zzzzzzzz-3333-3333-3333-333333333333")).toBe(false);  // non-hex
    expect(isUuid("not-a-guid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });

  it("bakes the tenant + client id and the adminconsent path into the consent URL", () => {
    const url = azureConsentUrl(CLIENT, TENANT);
    expect(url).toContain(TENANT);
    expect(url).toContain(CLIENT);
    expect(url).toContain("/adminconsent");
    expect(url).toContain("client_id=");
  });

  it("bakes the client id, subscription, and read-only role into the az command", () => {
    const cmd = azureRoleCommand(CLIENT, SUB);
    expect(cmd).toContain(CLIENT);
    expect(cmd).toContain(`/subscriptions/${SUB}`);
    expect(cmd).toContain("Cost Management Reader");
    expect(cmd).toContain(AZURE_ROLE_NAME);
    // least-privilege: never a write/owner/contributor role
    expect(cmd).not.toContain("Contributor");
    expect(cmd).not.toContain("Owner");
  });

  it("falls back to clear placeholders when ids aren't set yet", () => {
    const url = azureConsentUrl("", "");
    expect(url).toContain(TENANT_PLACEHOLDER);
    expect(url).toContain(CLIENT_PLACEHOLDER);
    const cmd = azureRoleCommand("", "");
    expect(cmd).toContain(CLIENT_PLACEHOLDER);
    expect(cmd).toContain(SUBSCRIPTION_PLACEHOLDER);
  });
});
