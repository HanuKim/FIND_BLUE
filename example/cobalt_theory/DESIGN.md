# Design System Document: The Atmospheric Analyst

## 1. Overview & Creative North Star
This design system is built to transform complex urban business data into a high-end, editorial experience. We are moving away from the "utilitarian dashboard" aesthetic toward a **Creative North Star** we call **"The Digital Observatory."** 

The experience should feel like looking through a precision lens at a midnight cityscape—clear, vast, and illuminated. We break the standard SaaS "template" look by utilizing intentional asymmetry, where data visualizations are balanced by generous negative space and overlapping glass surfaces. The goal is to provide "Analytical Zen": a workspace that feels premium and futuristic, yet calming enough for deep focus.

---

## 2. Colors: Tonal Depth & Soul
Our palette transitions from a deep, authoritative Primary Blue to ethereal indigo and purple gradients. This is not just a color choice; it is a tool for atmospheric depth.

### The "No-Line" Rule
To maintain a high-end feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries between content areas must be defined solely through:
*   **Background Color Shifts:** Placing a `surface-container-low` component on a `surface` background.
*   **Soft Tonal Transitions:** Using subtle gradients to suggest the edge of a container.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of frosted glass. Use the `surface-container` tiers to create "nested" importance:
*   **Base:** `surface` (#f7f9fb)
*   **Secondary Sections:** `surface-container-low` (#f1f4f6)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Active Overlays:** `surface-bright` (#f7f9fb)

### The Glass & Gradient Rule
Floating elements (modals, fixed navbars, or tooltips) must utilize **Glassmorphism**. Combine semi-transparent surface colors (e.g., `surface` at 70% opacity) with a `backdrop-blur` of 20px–40px.

### Signature Textures
Apply a linear gradient (Primary `#0053dc` to Secondary `#4a4bd7`) to main CTAs and hero data highlights. This provides the visual "soul" that flat hex codes cannot achieve, creating a sense of motion and energy.

---

## 3. Typography: Editorial Authority
The typography scale is designed to balance the futuristic "Space Grotesk" with the highly readable "Inter" and the sophisticated "Manrope."

*   **Display & Headlines (Manrope):** Large-scale, low-tracking headers that command attention. These convey the "High-End" editorial feel.
*   **Body (Inter):** Reserved for data density and long-form analysis. It is neutral, providing a calm counterpoint to the expressive headlines.
*   **Labels (Space Grotesk):** Used for technical metadata and chart labels. This font’s monospaced influence evokes a "futuristic/analytical" instrument panel.

---

## 4. Elevation & Depth: Tonal Layering
We reject the heavy, muddy shadows of 2010-era design. In this system, depth is a function of light and translucency.

### The Layering Principle
Achieve lift by stacking surface tiers. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural, soft elevation that feels integrated, not pasted.

### Ambient Shadows
When a "floating" effect is required for glass cards:
*   **Blur:** 40px to 60px.
*   **Opacity:** 4% to 8%.
*   **Color:** Use a tinted version of `on-surface` (#2d3337) rather than pure black to mimic natural light scattering.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a **Ghost Border**: `outline-variant` (#acb3b7) at **10% opacity**. Never use 100% opaque lines.

---

## 5. Components: The Analytical Toolkit

### Glass Cards
*   **Radius:** Always `xl` (1.5rem / 20px).
*   **Style:** `surface-container-lowest` at 80% opacity, `backdrop-blur: 24px`, and a subtle 1px top-light highlight (Primary color at 15% opacity).
*   **Layout:** No dividers. Separate content using `48px` or `64px` vertical spacing.

### Glowing CTA Buttons
*   **Primary:** A gradient fill from `primary` to `secondary`.
*   **Shadow:** An outer glow using the `primary` color at 30% opacity with a 20px blur.
*   **Interaction:** On hover, the glow expands, and the gradient shifts 15 degrees.

### Data Tables & Charts
*   **Charts:** Use a "Subtle Glow" line style. The primary data line should have a 4px soft outer glow of its own color.
*   **Tables:** Remove all row lines. Use zebra-striping with `surface-container-low` or simply increase the `body-md` line-height to create visual breathing room between entries.

### Fixed Top Navbar
*   **Visuals:** A full-width glass blur. Use `surface-container-lowest` at 60% opacity.
*   **Placement:** Fixed to top with a 0.5px `outline-variant` bottom edge at 10% opacity to separate it from the scrollable content.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts where a headline is offset from the data card below it.
*   **Do** use "Surface Tints" for success/error states—tint the entire card background slightly rather than just changing the text color.
*   **Do** use generous white space. If a layout feels "crowded," double the padding.

### Don't:
*   **Don't** use high-contrast black shadows.
*   **Don't** use sharp 90-degree corners; everything must adhere to the `xl` (20px) roundedness scale to feel modern and premium.
*   **Don't** use "Dashboard Grey." If you need a neutral, lean toward the blue-tinted `surface-dim` or `surface-variant`.
*   **Don't** use standard "Select" or "Input" boxes. Every input should feel like a glass integrated field with a soft focus glow.