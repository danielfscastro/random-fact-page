# Project Structure

```
src/
├── controller/      # Request handlers / UI event orchestration
├── models/          # Data models as factory functions (createFact, createFactResponse)
├── repository/      # Data access layer (API calls, local data store)
├── service/         # Business logic (fact selection, fallback strategy)
├── ui/              # DOM rendering and user interaction
└── utils/           # Pure utility/validation functions

tests/
├── unit/            # Mirrors src/ structure; isolated tests with mocks
│   ├── models/
│   ├── repository/
│   ├── service/
│   └── utils/
├── integration/     # Cross-layer tests
└── property/        # Property-based tests using fast-check
```

## Architecture

Layered architecture with clear separation of concerns:

1. **Models** — Immutable data structures via factory functions + `Object.freeze()`
2. **Repository** — Data fetching with injectable dependencies (`setFetchFn`, `setApiUrl`) and local fallback
3. **Service** — Orchestrates repository calls, validation, and random selection logic
4. **Utils** — Stateless validation functions
5. **Controller** — Connects service layer to UI (not yet implemented)
6. **UI** — DOM manipulation (not yet implemented)

## Naming Conventions

- Source files: camelCase (e.g., `factService.js`, `validateFact.js`)
- Test files: `<sourceFile>.test.js` for unit tests, `<feature>.property.test.js` for property tests
- Factory functions: `create<Model>` (e.g., `createFact`, `createFactResponse`)
- Constants: UPPER_SNAKE_CASE (e.g., `VALID_CATEGORIES`, `MAX_TEXT_LENGTH`)
- Test structure: `describe` blocks matching the function/module under test
