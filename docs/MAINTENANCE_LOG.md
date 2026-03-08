# CDSS Maintenance & Business Continuity Plan (Req 5.4)

## Maintenance Notification Protocols
In the event of scheduled maintenance or system downtime, the following notification procedure must be followed:

1.  **Advance Notice**: Send system-wide "INFO" notification to all users 48 hours prior to the window.
2.  **Imminent Notice**: Send "WARNING" notification 1 hour prior to shutdown.
3.  **Active Downtime**: Update the `/health` endpoint to return `{"status": "maintenance"}` and serve a static "System Maintenance" page on the frontend.

## Alternative Access Paths
If the primary CDSS Dashboard is unavailable, clinical staff should use the following fallback procedures:

1.  **Direct Aurora Access (Read-Only)**: Authorized senior staff can access the Aurora database via the backup SSH tunnel to retrieve patient records.
2.  **S3 Document Recovery**: Critical consultation transcripts and AI summaries are synced to the `cdss-clinical-documents` S3 bucket. Access via AWS Console if the API is down.
3.  **Manual Protocol**: In total outage, clinical teams must revert to paper-based charting as per Hospital SOP Section 12.A.

## Escalation Contacts
- **Ops/DevOps**: devops-oncall@cdss.ai
- **Clinical Lead**: medical-admin@cdss.ai
- **AWS Support**: Business Support Plan (24/7)

---
*Last updated: 2026-03-08*
