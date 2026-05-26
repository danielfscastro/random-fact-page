# Tech Stack

- **Language**: JavaScript (ES Modules via `"type": "module"` in package.json)
- **Runtime**: Browser (vanilla JS, no framework)
- **Test Runner**: Vitest 1.6+ with jsdom environment
- **Property-Based Testing**: fast-check 3.15+
- **DOM Simulation**: jsdom 24+
- **Module System**: ES Modules (use `.js` extensions in all imports)

## Commands

| Action | Command |
|--------|---------|
| Run all tests | `npm test` |
| Run unit tests only | `npm run test:unit` |
| Run integration tests only | `npm run test:integration` |
| Run property tests only | `npm run test:property` |
| Watch mode | `npm run test:watch` |

## Conventions

- No build step required; source is vanilla JS
- No bundler configured
- Use `vi.mock()` for module mocking in unit tests
- Use `vi.spyOn()` for partial mocks
- Use `Object.freeze()` on model instances for immutability
- Prefer factory functions over classes for models
- All imports must include the `.js` file extension
