// ─────────────────────────────────────────────────────────────────────────────
// Google Cloud cross-account connect — the exact, least-privilege gcloud the
// customer runs against THEIR project to grant GridMind's own service account
// READ-ONLY access to their BigQuery billing export, plus project-id / billing-
// table validation. Pure & import-safe on client + server (the wizard renders
// these, tests assert them). No secrets, no env reads — all inputs are passed in.
// ─────────────────────────────────────────────────────────────────────────────

export const PROJECT_PLACEHOLDER = "<YOUR_GCP_PROJECT_ID>";
export const SA_PLACEHOLDER = "<YOUR_GRIDMIND_SA_EMAIL>";

/** A GCP project id: 6–30 chars, starts lowercase letter, lowercase + digits + hyphens. */
export function isGcpProjectId(s: string): boolean {
  return /^[a-z][a-z0-9-]{5,29}$/.test((s || "").trim());
}

/** A BigQuery billing-export table: project.dataset.table (backticks/whitespace tolerated). */
export function isBillingTable(s: string): boolean {
  const t = (s || "").trim().replace(/^`|`$/g, "").trim();
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
}

/** The exact gcloud commands the customer runs in their own project to grant
 *  GridMind's service account read-only access to their billing export. */
export function gcloudGrantCommands(saEmail: string, projectId: string): string {
  const sa = saEmail || SA_PLACEHOLDER;
  const proj = projectId || PROJECT_PLACEHOLDER;
  return `# Grant GridMind read-only access to your BigQuery billing export (least-privilege).
# Run in the GCP project that owns your Cloud Billing → BigQuery export.

gcloud projects add-iam-policy-binding ${proj} \\
  --member="serviceAccount:${sa}" \\
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding ${proj} \\
  --member="serviceAccount:${sa}" \\
  --role="roles/bigquery.jobUser"`;
}
