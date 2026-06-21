// ─────────────────────────────────────────────────────────────────────────────
// AWS cross-account connect — the exact, least-privilege setup a customer runs in
// THEIR account to grant GridMind READ-ONLY Cost Explorer access, plus Role-ARN
// validation. Pure & import-safe on client + server (the wizard renders these,
// tests assert them). No secrets, no env reads — all inputs are passed in.
// ─────────────────────────────────────────────────────────────────────────────

export const AWS_ROLE_NAME = "GridMindCostReadOnly";
export const DEFAULT_AWS_REGION = "us-east-1";
export const ACCOUNT_PLACEHOLDER = "<YOUR_GRIDMIND_AWS_ACCOUNT_ID>";

/** A real IAM role ARN: arn:aws:iam::<12-digit account>:role/<name>. */
export function isRoleArn(s: string): boolean {
  return /^arn:aws:iam::\d{12}:role\/[A-Za-z0-9+=,.@_/-]+$/.test((s || "").trim());
}

/** CloudFormation template the customer deploys in their own AWS account. */
export function cloudFormationTemplate(externalId: string, gridmindAccountId: string): string {
  const acct = gridmindAccountId || ACCOUNT_PLACEHOLDER;
  return `AWSTemplateFormatVersion: '2010-09-09'
Description: Grants GridMind read-only access to AWS Cost Explorer (cross-account, least-privilege).
Resources:
  GridMindCostReadOnlyRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ${AWS_ROLE_NAME}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              AWS: 'arn:aws:iam::${acct}:root'
            Action: 'sts:AssumeRole'
            Condition:
              StringEquals:
                'sts:ExternalId': '${externalId}'
      Policies:
        - PolicyName: GridMindCostExplorerReadOnly
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: 'ce:GetCostAndUsage'
                Resource: '*'
Outputs:
  RoleArn:
    Description: Paste this ARN back into GridMind to finish connecting.
    Value: !GetAtt GridMindCostReadOnlyRole.Arn`;
}

/** Terraform equivalent, for teams that manage IAM as code. */
export function terraformSnippet(externalId: string, gridmindAccountId: string): string {
  const acct = gridmindAccountId || ACCOUNT_PLACEHOLDER;
  return `resource "aws_iam_role" "gridmind_cost_readonly" {
  name = "${AWS_ROLE_NAME}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${acct}:root" }
      Action    = "sts:AssumeRole"
      Condition = { StringEquals = { "sts:ExternalId" = "${externalId}" } }
    }]
  })
}

resource "aws_iam_role_policy" "gridmind_ce_readonly" {
  name   = "GridMindCostExplorerReadOnly"
  role   = aws_iam_role.gridmind_cost_readonly.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "ce:GetCostAndUsage", Resource = "*" }]
  })
}

output "gridmind_role_arn" {
  value = aws_iam_role.gridmind_cost_readonly.arn
}`;
}
