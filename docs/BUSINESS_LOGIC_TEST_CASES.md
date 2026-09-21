# TaxFlow Business Logic — Test Cases Inventory

This document lists **every automated business-logic test case** in the API suite.
After each suite section, the cases from that suite are enumerated with IDs used in the test files.

**How to run**

```bash
# Pure unit tests (Jest)
npm run test:api

# Service / integration-style tests (Vitest)
npm run test:api:vitest

# Both
npm run test:api:all
```

---

## Suite A — Due Date Engine (`tests/due-date-engine.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-ITR-01 | Non-audit ITR-1 | 31 Jul of AY year |
| TC-ITR-02 | ITR-2 non-audit | 31 Jul |
| TC-ITR-03 | ITR-4 non-audit | 31 Jul |
| TC-ITR-04 | Audit required flag | 31 Oct |
| TC-ITR-05 | ITR-3 form | 31 Oct |
| TC-ITR-06 | ITR-5 form | 31 Oct |
| TC-ITR-07 | ITR-6 company | 30 Nov |
| TC-ITR-08 | Transfer pricing | 30 Nov |
| TC-ITR-09 | Belated filing | 31 Dec |
| TC-ITR-10 | Revised filing | 31 Dec |
| TC-ITR-11 | Updated return | 31 Mar next year |
| TC-GST-01 | GSTR-9 annual | 31 Dec |
| TC-GST-02 | GSTR-1 monthly | 11th next month |
| TC-GST-03 | GSTR-1 QRMP | 13th |
| TC-GST-04 | GSTR-3B monthly | 20th next month |
| TC-GST-05 | GSTR-3B QRMP | 22nd |

---

## Suite B — RBAC Permissions (`tests/permissions.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-RBAC-01 | SuperAdmin scope | Query passthrough |
| TC-RBAC-02 | Admin scope | Query passthrough |
| TC-RBAC-03 | Staff scope | Adds email / assignedStaffId OR |
| TC-RBAC-04 | Staff empty query | OR filter still applied |

---

## Suite C — Pagination Utils (`tests/utils-pagination.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-PAGE-01 | Defaults | page=1, pageSize=10, skip=0 |
| TC-PAGE-02 | Skip math | page 3 × 20 → skip 40 |
| TC-PAGE-03 | Max pageSize | Clamped to 100 |
| TC-PAGE-04 | Invalid page | Floored to 1 |
| TC-PAGE-05 | Format response | totalPages = ceil(total/size) |
| TC-PAGE-06 | Zero total | totalPages = 0 |

---

## Suite D — Billing Math (`tests/billing.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-BILL-01 | 18% GST multi-line | subtotal 15000, tax 2700, total 17700 |
| TC-BILL-02 | Exact 18% on 100 | tax 18, total 118 |
| TC-BILL-03 | Empty lines | all zeros |
| TC-BILL-04 | 0% tax rate | tax 0 |
| TC-BILL-05 | UPI deep link | encodes amount + invoice no |

---

## Suite E — TDS/TCS Reconciliation (`tests/tds-reconciliation.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-TDS-01 | Exact match | MATCHED, mismatch 0 |
| TC-TDS-02 | Under credit | MISMATCH_UNDER |
| TC-TDS-03 | Over credit | MISMATCH_OVER |
| TC-TDS-04 | Abs difference | mismatch always ≥ 0 |

---

## Suite F — AI Query Classification (`tests/ai-prompts.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-AI-01 | Pending ITR text | practice-data = true |
| TC-AI-02 | GST due this month | practice-data = true |
| TC-AI-03 | Missing documents | practice-data = true |
| TC-AI-04 | Compliance risk summary | practice-data = true |
| TC-AI-05 | Section 80C explain | practice-data = false |
| TC-AI-06 | Latest GST deadline | grounding = true |
| TC-AI-07 | Rate / circular signals | grounding = true |
| TC-AI-08 | List clients | grounding = false |

---

## Suite G — Tax Audit (`tests/tax-audit.vitest.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-AUDIT-01 | Create engagement | 9 Form 3CD clauses, stage ENGAGEMENT |
| TC-AUDIT-02 | Cash txn > 5% | isCashLimitCompliant = false |
| TC-AUDIT-03 | UDIN validation | rejects short UDIN; accepts 18 chars |
| TC-AUDIT-04 | Summary counts | totalEngagements / form counts |
| TC-AUDIT-05 | List stage filter | only ENGAGEMENT rows |

---

## Suite H — GST Registration (`tests/gst-registration.vitest.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-GSTREG-01 | PAN length | ValidationError if ≠ 10 |
| TC-GSTREG-02 | Create application | Uppercase PAN, TRN auto, stage TRN_GENERATED |
| TC-GSTREG-03 | Advance to ARN | Stores ARN, stage ARN_SUBMITTED |
| TC-GSTREG-04 | Pipeline summary | Aggregates stage counts |
| TC-GSTREG-05 | Search filter | Matches business name |

---

## Suite I — Dashboard & Tasks (`tests/dashboard-tasks.vitest.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-DASH-01 | Fallback KPIs | active/lead/ITR/GST counts from memory |
| TC-TASK-01 | Create with circuit open | Memory task created |
| TC-TASK-02 | Status transitions | TODO → IN_PROGRESS → DONE |

---

## Suite J — AI Assistant Service (`tests/ai-assistant.vitest.test.ts`)

| ID | Case | Expected |
|----|------|----------|
| TC-AI-SVC-01 | Empty / practice summary | structured answer (or DB skip) |
| TC-AI-SVC-02 | Empty query | Validation reject |
| TC-AI-SVC-03 | Query > 2000 chars | Validation reject |
| TC-AI-SVC-04 | Pending ITR intent | sourceType = structured |

---

## Suite K — Existing Vitest Suites (already in repo)

### `clients-crud.vitest.test.ts`
- Create / read / update / delete client
- Duplicate PAN conflict
- Lead lifecycle
- Work-type filters

### `multiple-services.vitest.test.ts`
- Multiple independent services per client (ITR / GST / GST Reg)
- Fee and status defaults

### `business-requirements.vitest.test.ts`
- Client lifecycle + auto tasks
- ITR / GST due date spot checks
- Billing UPI string shape
- Tax audit cash / UDIN spot checks
- Task status updates
- Dashboard fallback smoke

---

## Coverage map (business modules → suites)

| Module | Covered by |
|--------|------------|
| Due dates (ITR/GST) | Suite A + K |
| RBAC scoping | Suite B |
| Pagination | Suite C |
| Billing totals / UPI | Suite D + K |
| TDS reconciliation | Suite E |
| AI prompts / intents | Suite F + J |
| Tax audit | Suite G + K |
| GST registration | Suite H |
| Dashboard / Tasks | Suite I + K |
| Clients / Client services | Suite K |
| WhatsApp / Documents / Admin / Auth | E2E Playwright (`e2e/*`) + future unit expansion |

---

## Notes

1. **Jest** runs pure unit tests only (`*.test.ts`, excluding `*.vitest.test.ts`).
2. **Vitest** runs service tests that use in-memory fallbacks / circuit breaker (`e2e-http-business-logic.vitest.test.ts` is excluded from default `test:vitest` — needs a live API).
3. Gemini live calls are **not** asserted in unit tests (quota / network); structured intents and classifiers are covered.
4. After adding a new business rule, add a `TC-*` case here **and** a matching `it("TC-...")` in the suite file.

### Latest run summary

| Runner | Suites | Tests |
|--------|--------|-------|
| Jest (`npm run test:api`) | 6 | **43 passed** |
| Vitest (`npm run test:api:vitest`) | 7 | **49 passed** |
| **Total automated business cases** | | **92 passed** |
