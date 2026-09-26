# Repository instructions

## Running and validating

- This is a dependency-free static browser application; there are no install, build, lint, or automated test commands.
- Serve the repository root with `python3 -m http.server 8000`, then open `http://localhost:8000`.
- Validate a focused behavior manually by exercising the related control in the browser. For example, for vertex dragging, drag each vertex and confirm the polygon, measurements, perimeter, area, and angle sum update; for a transformation, activate it and confirm the dashed comparison shape is congruent.

## Architecture

- `index.html` declares the Japanese-language application shell, controls, live metric regions, and SVG layers. Element IDs are the contract with `app.js`; keep them aligned when changing markup or behavior.
- `app.js` owns all application state: the selected shape, its vertex array, an optional transformed comparison array, and the actively dragged vertex. It rebuilds the SVG polygon, vertex circles, and labels on every `render()` call, then updates text metrics through `updateFacts()`.
- `styles.css` contains both the visual system and responsive layouts. The workspace changes from three columns to two columns below 1050px and one column below 720px, so preserve the corresponding HTML class structure when changing layout.

## Geometry and interaction conventions

- SVG coordinates use a `760 × 500` viewBox. Measurements convert canvas units to centimeters by dividing distances by `50`; area is converted by dividing shoelace-area pixel units by `2500`. Keep these two conversions consistent with the `1目盛り = 1 cm` UI statement.
- Shape definitions are ordered vertex arrays in `initialShapes`; rendering, side lengths, angle calculations, and the shoelace area calculation all depend on the cyclic ordering. Add a shape by supplying its ordered points and using the same `shape`/`points` reset flow.
- `render()` clears and recreates `#shape-layer` and `#label-layer`, including pointer listeners on newly created vertices. Do not retain references to generated SVG nodes across renders.
- Pointer coordinates must pass through `pointFromEvent()` so dragging remains correct when the responsive SVG is scaled. Dragging a vertex clears `comparison`; shape selection, reset, randomization, and transformations follow the same state-reset model.
- Transformations render only a dashed `comparison` polygon; they must not mutate the primary `points` array or change its calculated measurements.
- Keep learner-facing copy in Japanese, including dynamic messages, labels, and accessibility text.
