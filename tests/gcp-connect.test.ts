import { describe, it, expect } from "vitest";
import { isGcpProjectId, isBillingTable, gcloudGrantCommands, PROJECT_PLACEHOLDER, SA_PLACEHOLDER } from "../lib/gcp-template";

describe("gcp cross-account connect", () => {
  it("validates GCP project ids", () => {
    expect(isGcpProjectId("my-gcp-project")).toBe(true);
    expect(isGcpProjectId("  proj01-billing  ")).toBe(true);
    expect(isGcpProjectId("abc12")).toBe(false);        // under 6 chars
    expect(isGcpProjectId("1myproject")).toBe(false);   // must start with a letter
    expect(isGcpProjectId("My-Project")).toBe(false);   // no uppercase
    expect(isGcpProjectId("my_project")).toBe(false);   // no underscores
    expect(isGcpProjectId("a".repeat(31))).toBe(false); // over 30 chars
    expect(isGcpProjectId("")).toBe(false);
  });

  it("validates billing-export tables (project.dataset.table)", () => {
    expect(isBillingTable("myproj.billing.gcp_billing_export_v1_0123AB")).toBe(true);
    expect(isBillingTable("  `myproj.billing.gcp_billing_export_v1_0123AB`  ")).toBe(true);
    expect(isBillingTable("myproj.billing")).toBe(false);          // only 2 parts
    expect(isBillingTable("myproj.billing.table.extra")).toBe(false); // 4 parts
    expect(isBillingTable("myproj..table")).toBe(false);           // empty dataset
    expect(isBillingTable("")).toBe(false);
  });

  it("bakes the SA email + project + least-privilege roles into the gcloud", () => {
    const cmd = gcloudGrantCommands("gridmind@gm.iam.gserviceaccount.com", "my-gcp-project");
    expect(cmd).toContain("gridmind@gm.iam.gserviceaccount.com");
    expect(cmd).toContain("my-gcp-project");
    expect(cmd).toContain("roles/bigquery.dataViewer");
    expect(cmd).toContain("roles/bigquery.jobUser");
    expect(cmd).toContain("gcloud projects add-iam-policy-binding");
    // least-privilege: no admin/write roles sneak in
    expect(cmd).not.toContain("roles/owner");
    expect(cmd).not.toContain("roles/editor");
    expect(cmd).not.toContain("dataEditor");
  });

  it("falls back to clear placeholders when SA email / project aren't set", () => {
    const cmd = gcloudGrantCommands("", "");
    expect(cmd).toContain(SA_PLACEHOLDER);
    expect(cmd).toContain(PROJECT_PLACEHOLDER);
  });
});
