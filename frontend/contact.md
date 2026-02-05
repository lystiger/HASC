CONTACT_PAGE_SPEC.md - Direct & Geometric (Scoped MVP)

1. Objective
Provide a fast, credible path for procurement inquiries without duplicating the About page.

2. Scope (MVP)
Ship the split-panel layout with real contact details and a front-end form stub.
Do not block launch on backend form submission; add that in Phase 1.5.

3. Layout (MVP)
A. Inquiry Panel (Left)
- Fields: Name, Company, Email, Industry Sector (select), Message.
- CTA: “Send Technical Inquiry” in Safety Orange (#EA580C).
- Validation: Required fields + basic email format.
- Feedback: Immediate “Sending…” state, then local success toast.

B. Information Hub (Right)
- Address, phone, email, hours (must match Footer).
- Use JetBrains Mono for phone/email.

4. Localization
All labels and helper text must use i18n keys (prefer `contact.*`).

5. Out of Scope (MVP)
- Map embed or directions panel (handled elsewhere).
- Real API submission.
- Complex validation or spam protection.
- Advanced animations.

6. Phase 1.5 Enhancements
- Add `/contact` API endpoint + real submission.
- Add success/error toasts tied to server responses.
- Optional: interactive map embed (if needed in this page later).
