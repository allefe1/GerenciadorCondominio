# Design System Specification

## 1. Overview & Creative North Star
### The Digital Concierge
The creative North Star for this design system is **"The Digital Concierge."** We are moving away from the rigid, grid-locked "spreadsheet" feel of traditional management software and toward a sophisticated, editorial-inspired environment. 

The system prioritizes clarity and high-end aesthetics to mirror the premium nature of luxury condominium living. By utilizing intentional asymmetry, breathing room (generous white space), and a tactile sense of depth, we create an experience that feels secure and authoritative yet effortlessly modern. We don't just display data; we curate an environment of trust.

---

## 2. Colors & Surface Logic
Our palette is anchored by deep, purposeful purples and a sophisticated range of architectural grays.

### The "No-Line" Rule
To achieve a premium, seamless aesthetic, **this design system prohibits the use of 1px solid borders for sectioning.** Structural separation is achieved through tonal shifts and background elevation. Use `surface-container-low` against a `surface` background to define areas, rather than drawing a line.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers. Use the Material tiers to create nested importance:
*   **Base Layer:** `surface` (#faf9f9)
*   **Sectional Layer:** `surface-container-low` (#f5f3f3)
*   **Actionable/Active Card:** `surface-container-lowest` (#ffffff)
*   **Accent/Floating:** `surface-bright` (#faf9f9)

### The Glass & Gradient Rule
To provide "soul" and depth:
*   **Main Backgrounds:** Use the signature linear gradient (from `#7B4AE2` to `#9B6BFF`) for login screens, hero headers, or sidebar accents.
*   **Glassmorphism:** For floating overlays (modals or high-level navigation), use `surface-container-lowest` at 80% opacity with a `backdrop-filter: blur(20px)`. This allows the vibrant brand gradients to bleed through, softening the interface.

### Signature Textures
Apply a subtle gradient transition from `primary` (#5416c9) to `primary_container` (#6c3ce1) on primary CTAs. This prevents the "flat" look and adds a professional, backlit polish.

---

## 3. Typography
We use **Inter** as our typographic backbone. Its geometric clarity conveys modern professionalism.

*   **Display Scales (`display-lg` to `display-sm`):** Use these sparingly for high-level data summaries (e.g., total building occupancy). These should be tracked slightly tighter (-2%) to feel editorial.
*   **Headline & Title:** Use `headline-md` for page titles and `title-lg` for card headings. These convey authority and "Secure Professionalism."
*   **Body & Label:** Use `body-md` for standard text and `label-md` for metadata. Ensure a high contrast ratio using `on_surface_variant` (#494455) to maintain readability for property managers.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, mimicking how light interacts with physical surfaces.

### The Layering Principle
Rather than shadows, stack colors. A `surface-container-lowest` card placed on a `surface-container` background creates a natural lift that feels integrated into the architecture of the page.

### Ambient Shadows
When a floating effect is required (e.g., a dropdown or a "New Notice" button):
*   **Shadow:** Use a large blur (20px - 40px) with very low opacity (4%-8%).
*   **Color Tint:** Instead of pure black, use a tint of `on_surface` to mimic natural ambient light.

### The "Ghost Border" Fallback
If a border is required for accessibility in input fields:
*   **Token:** Use `outline_variant` (#cbc3d7).
*   **Opacity:** Reduce opacity to 20%. **Never use 100% opaque, high-contrast borders.**

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `md` (0.75rem) or `lg` (1rem) border radius. Use `on_primary` (#ffffff) for text.
*   **Secondary:** Ghost style. No background fill, `outline_variant` (20% opacity) border.
*   **Hover State:** Increase shadow diffusion and slightly shift the gradient brightness.

### Input Fields
*   **Styling:** `surface-container-lowest` background with a `sm` (0.25rem) radius. 
*   **Interaction:** On focus, the border shifts to a subtle `primary` glow (15% opacity).
*   **Error State:** Use `error` (#ba1a1a) for the "Ghost Border" and helper text.

### Chips & Badges
*   **Usage:** For "Paid," "Pending," or "Overdue" status.
*   **Style:** No borders. Use `primary_fixed` (#e8ddff) for the background and `on_primary_fixed_variant` (#5110c6) for the text to create a high-end, soft-contrast look.

### Cards & Lists
*   **Strict Rule:** Forbid divider lines. 
*   **Separation:** Use `spacing-6` (1.5rem) or `spacing-8` (2rem) of vertical white space to separate list items. For complex lists, use alternating backgrounds (`surface` and `surface-container-low`) to create "Zebra" striping without lines.

### Specialized Components
*   **Security Pulse:** A pulsing `primary` dot next to "System Status" to reinforce the brand's "Secure" promise.
*   **Glass Drawer:** A side-navigation menu using the Glassmorphism rule to maintain visual context of the dashboard behind it.

---

## 6. Do's and Don'ts

### Do
*   **Do** use generous white space. If it feels too empty, add more space.
*   **Do** use the `xl` (1.5rem) roundedness for large containers to soften the "enterprise" feel.
*   **Do** rely on the `primary` purple for intentional "Aha!" moments and critical actions.

### Don't
*   **Don't** use 1px solid #E0E0E0 lines to separate content. Use tonal shifts.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` or `on_surface_variant`.
*   **Don't** use sharp corners. Every element should feel approachable and modern with a minimum of `DEFAULT` (0.5rem) radius.
*   **Don't** clutter. If a screen has more than two primary actions, use a "More" menu to maintain the minimalist aesthetic.