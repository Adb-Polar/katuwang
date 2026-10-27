# Design audit fix backlog

Audit date: October 22, 2026  
Target: https://katuwang-dev-test.onrender.com  
Preset: `landing-page`  
Baseline score: **3.3/5**

## Scope

The audit covered the public landing page, account role selection, learner registration, sign-in, and password recovery. Desktop was inspected at 1440px wide and mobile at 390px wide. Authenticated dashboards were not assessed.

The items below capture the fixes identified in that audit. Local source references point to corresponding components; deployment parity was not verified. All items are open.

## High priority: form accessibility and mobile usability

### 1. Associate visible labels with form controls

- [ ] Give each real form input and select a unique, stable `id`.
- [ ] Connect each visible label to its control with `htmlFor`.
- [ ] Extend the shared `FormField` component to support this association, including controls nested inside password wrappers.
- [ ] Apply the pattern to learner registration, sign-in, and password recovery.

**Finding:** Visible labels exist, but inspected registration and sign-in inputs have no associated labels. Registration selects also lack an accessible name.

**Relevant files:**

- `src/components/ui/FormField.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`

**Done when:** Each control has the intended accessible name, clicking its label focuses it, and keyboard navigation preserves a logical order and visible focus.

### 2. Associate helper text and validation feedback

- [ ] Give helper text and field-specific errors stable IDs.
- [ ] Reference relevant helper and error text with `aria-describedby`.
- [ ] Set `aria-invalid` when a field has a validation error.
- [ ] Preserve working required-field validation while adding these associations.

**Finding:** Inspected registration fields have no helper/error associations, including the optional contact information hint.

**Relevant files:** `src/components/ui/FormField.tsx`, `src/components/auth/RegisterForm.tsx`, and the other inspected authentication forms.

**Done when:** Assistive technology can identify a field's instructions and current error without relying on surrounding visual placement.

### 3. Add appropriate autocomplete attributes

- [ ] Mark sign-in email and password controls with appropriate autocomplete values such as `username` and `current-password`.
- [ ] Use appropriate registration values such as `given-name`, `family-name`, `email`, and `new-password`.
- [ ] Check password recovery email autocomplete.

**Finding:** Inspected sign-in inputs have no explicit autocomplete values.

**Relevant files:** `src/components/auth/LoginForm.tsx`, `src/components/auth/RegisterForm.tsx`, and `src/components/auth/ForgotPasswordForm.tsx`.

**Done when:** Browser autofill and password managers can distinguish account identity, existing passwords, and new passwords.

### 4. Increase mobile form text and control sizes

- [ ] Increase mobile input text from the observed 12px to approximately 16px.
- [ ] Increase primary form control and submit-button heights from the observed compact sizing to approximately 44px or greater.
- [ ] Give password visibility buttons sufficient tap area.
- [ ] Recheck wrapping, spacing, and page scrolling after increasing sizes.

**Finding:** Registration and sign-in fields use 12px text and 32px heights, making them harder to read and tap on mobile.

**Relevant files:** `src/components/auth/RegisterForm.tsx`, `src/components/auth/LoginForm.tsx`, and `src/components/auth/ForgotPasswordForm.tsx`.

**Done when:** Forms remain readable and easy to operate at 390px wide, with no clipped controls or horizontal overflow, while retaining a coherent desktop layout.

## Medium priority: purpose and introductory copy

### 5. Make the hero explain the service directly

- [ ] Replace or revise the indirect headline, “From first question to measurable progress,” to communicate peer tutoring immediately.
- [ ] State that the service is free, intended for Grades 7–12, and serves TRIS in the first viewport.
- [ ] Describe the student benefit before introducing the walkthrough.
- [ ] Keep the primary account-creation action prominent.

**Finding:** Free access appears near the bottom of the page, and school context appears in the footer. The first viewport emphasizes the walkthrough rather than the practical offer.

**Suggested direction:** “Free peer tutoring for Grades 7–12 at TRIS,” supported by a short explanation of finding help from a verified peer tutor.

**Relevant file:** `src/components/landing/LandingHero.tsx`.

**Done when:** A first-time visitor can understand the service, intended audience, cost, and next action from the first viewport on desktop and mobile.

## Medium priority: walkthrough interaction clarity

### 6. Clearly identify the static matching form as an example

- [ ] Add a visible label such as “Example matching form” above the sample.
- [ ] Explain that the displayed values illustrate the matching process.
- [ ] Preserve the sample's inert behavior so it does not introduce unusable keyboard stops.
- [ ] Check that the sample's button-like “Auto Match” element is clearly understood as part of the preview.

**Finding:** The sample resembles a usable matching form, but its controls are inert and lack a visible preview label.

**Relevant files:** `src/components/landing/SampleMatchForm.tsx` and `src/components/landing/StoryTimeline.tsx`.

**Done when:** Visitors can distinguish the example from a working form before attempting to interact with it.

### 7. Provide a nearby path to start a real match

- [ ] Add a registration link near the preview with wording that explains how to start using matching.
- [ ] Ensure this is a real link outside the inert sample region.
- [ ] Verify its destination and keyboard accessibility.

**Finding:** The preview suggests an immediate matching action without explaining how to begin the real flow.

**Relevant files:** `src/components/landing/SampleMatchForm.tsx` and `src/components/landing/StoryTimeline.tsx`.

**Done when:** A visitor reading the example can proceed directly to registration using a clearly labeled action.

## Verification after fixes

- [ ] Reinspect the affected pages at 1440px desktop and 390px mobile widths.
- [ ] Check accessible names, helper/error associations, keyboard focus, and password visibility controls.
- [ ] Confirm required-field validation still works.
- [ ] Confirm no new horizontal overflow or console errors on the inspected public pages.
- [ ] Re-audit using the same scope and preset, recording score changes and marking each item fixed, improved, or still open.

The baseline audit found a consistent visual style, no horizontal overflow in the checked mobile landing viewport, working required-field validation and password visibility, and no captured console errors on the inspected public pages. Preserve these strengths during the fixes.
