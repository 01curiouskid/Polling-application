# Figma Design Integration Guide

This guide will help you extract design tokens from the Figma design and update the application to match it exactly.

## How to Extract Design Tokens from Figma

### 1. Colors

1. Open the Figma design: https://www.figma.com/design/uhinheFgWssbxvlI7wtf59/Intervue-Assigment--Poll-system?node-id=0-1&p=f
2. Select any element (button, text, background, etc.)
3. In the right panel, find the **Fill** or **Text** color
4. Click on the color to see the hex/rgb value
5. Copy the value and update the corresponding CSS variable in `frontend/src/styles/global.css`

**Example:**
- If a primary button has color `#6366F1`, update `--primary-color: #6366F1;`

### 2. Typography

1. Select a text element in Figma
2. Check the right panel for:
   - **Font Family** (e.g., "Inter", "Roboto")
   - **Font Size** (e.g., 16px, 24px)
   - **Font Weight** (e.g., Regular 400, Medium 500, Bold 700)
   - **Line Height** (e.g., 24px, 32px)
3. Update the corresponding variables in `global.css`

**Example:**
- If headings use "Inter" font, update `--font-family: 'Inter', sans-serif;`
- If body text is 16px, ensure `--font-size-base: 1rem;` (16px = 1rem)

### 3. Spacing

1. Select elements and check the spacing between them
2. Use Figma's measurement tool or check the **Auto Layout** padding/margin values
3. Common spacing values: 4px, 8px, 16px, 24px, 32px, 48px
4. Update spacing variables in `global.css`

**Example:**
- If buttons have 16px padding, use `var(--spacing-md)` (which is 1rem = 16px)

### 4. Border Radius

1. Select an element with rounded corners
2. Check the **Corner Radius** value in the right panel
3. Update `--radius-*` variables in `global.css`

**Example:**
- If buttons have 8px border radius, update `--radius-md: 0.5rem;` (8px = 0.5rem)

### 5. Shadows

1. Select an element with a shadow
2. Check the **Effects** section in the right panel
3. Note the shadow properties (x, y, blur, spread, color, opacity)
4. Update `--shadow-*` variables in `global.css`

## Component-Specific Updates

### Teacher Page
- Check the layout, button styles, form inputs
- Match the poll creation form exactly
- Update the results display to match Figma

### Student Page
- Check the name input screen
- Match the question display
- Update the answer selection buttons
- Match the results view

### Home Page
- Check the landing page design
- Update button styles and layout

## Quick Update Steps

1. **Extract colors:**
   ```bash
   # Open Figma → Select element → Copy color → Update global.css
   ```

2. **Update component styles:**
   - Replace inline styles with CSS classes
   - Use CSS variables from `global.css`
   - Match spacing, typography, and colors exactly

3. **Test responsiveness:**
   - Check if Figma has mobile/tablet designs
   - Add responsive breakpoints if needed

## Files to Update

1. `frontend/src/styles/global.css` - Design tokens (colors, spacing, typography)
2. `frontend/src/pages/TeacherPage.tsx` - Teacher UI components
3. `frontend/src/pages/StudentPage.tsx` - Student UI components
4. `frontend/src/pages/HomePage.tsx` - Home page
5. `frontend/src/components/` - (Create reusable components matching Figma)

## Tips

- Use Figma's **Inspect** mode to see exact CSS values
- Use browser DevTools to test changes in real-time
- Take screenshots of Figma for reference
- Create reusable components for repeated UI patterns

## Common Figma → CSS Conversions

- **Figma spacing (px)** → **CSS (rem)**: Divide by 16
  - 8px = 0.5rem
  - 16px = 1rem
  - 24px = 1.5rem
  - 32px = 2rem

- **Figma font sizes**: Usually already in px, convert to rem
- **Figma colors**: Usually hex (#RRGGBB) or rgba

## Next Steps

1. Open the Figma design
2. Systematically go through each screen
3. Extract design tokens
4. Update `global.css` with exact values
5. Update component styles to use the tokens
6. Test and refine

