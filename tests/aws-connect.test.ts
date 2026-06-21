import { describe, it, expect } from "vitest";
import { isRoleArn, cloudFormationTemplate, terraformSnippet, ACCOUNT_PLACEHOLDER, AWS_ROLE_NAME } from "../lib/aws-template";

describe("aws cross-account connect", () => {
  it("validates IAM role ARNs", () => {
    expect(isRoleArn("arn:aws:iam::123456789012:role/GridMindCostReadOnly")).toBe(true);
    expect(isRoleArn("  arn:aws:iam::123456789012:role/path/Role_1  ")).toBe(true);
    expect(isRoleArn("arn:aws:iam::123:role/ShortAccount")).toBe(false); // account must be 12 digits
    expect(isRoleArn("arn:aws:s3:::bucket")).toBe(false);
    expect(isRoleArn("not-an-arn")).toBe(false);
    expect(isRoleArn("")).toBe(false);
  });

  it("bakes the ExternalId + least-privilege scope into the CloudFormation", () => {
    const tpl = cloudFormationTemplate("gridmind-abc123", "999988887777");
    expect(tpl).toContain("gridmind-abc123");
    expect(tpl).toContain("arn:aws:iam::999988887777:root");
    expect(tpl).toContain("sts:ExternalId");
    expect(tpl).toContain("ce:GetCostAndUsage");
    expect(tpl).toContain(AWS_ROLE_NAME);
    // least-privilege: no compute/storage/write actions sneak in
    expect(tpl).not.toContain("ec2:");
    expect(tpl).not.toContain("s3:");
    expect(tpl).not.toContain("iam:Put");
  });

  it("falls back to a clear placeholder when the operator account isn't set", () => {
    expect(cloudFormationTemplate("gridmind-x", "")).toContain(ACCOUNT_PLACEHOLDER);
  });

  it("offers an equivalent Terraform snippet", () => {
    const tf = terraformSnippet("gridmind-xyz", "999988887777");
    expect(tf).toContain("gridmind-xyz");
    expect(tf).toContain("999988887777");
    expect(tf).toContain("ce:GetCostAndUsage");
    expect(tf).toContain("sts:ExternalId");
  });
});
