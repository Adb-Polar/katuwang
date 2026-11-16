# Tutor question-bank search fix

The session-test builder starts with an empty bank picker, only searches prompt
text when Search is clicked, and cannot browse beyond its first 50 results.
The empty message also fails to distinguish an unsubmitted search from no matches.

- Load active bank questions for the class subject when the picker opens.
- Submit keyword searches with Enter or Search; match prompt text and topic names.
- Apply topic changes immediately and reset new searches to page one.
- Provide pagination and retain selected questions across pages and searches.
- Show loading, error, and no-match states; cancel superseded requests.
- Verify the API filters with Vitest and the picker interactions in Chromium with
  sample API responses. The configured database is unreachable in this workspace.

Subject scoping and active/BANK restrictions continue to match the test-save API.

Integration on current develop preserves certified-topic authorization, review
status labels, mobile control sizes, active-session checks and safe response fields.
