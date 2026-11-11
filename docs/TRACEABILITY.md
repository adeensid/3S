# Traceability (phase 1 baseline)

| Capability | Acceptance criteria | Automated tests |
| --- | --- | --- |
| Issue types and hierarchy | Epic, story, task, bug, sub-task enforced server-side | `hierarchyService.test.ts` |
| LexoRank ordering | Stable insert between ranks, collision-safe | `lexorank.test.ts` |
| Custom fields per project | Typed validation and option enforcement | `customFieldService.test.ts` |
| Issue links | Directed links with inverse blocked-by | `issueLinkService.test.ts` |
| Field history | Each field change stored per issue | `fieldHistoryService.ts`, `GET .../history` |
| Comments edit/delete | Author or admin; edit history retained | `ticketService` edit/delete |
| Attachments metadata | MIME allow-list, size cap, safe filenames | `attachmentService.test.ts`, `safeFilename.test.ts` |
| Bulk update | Per-issue result summary | `bulkUpdateTickets`, `POST .../tickets/bulk` |
| Work items API | Legacy ticket create still works | `projects.test.ts` |
