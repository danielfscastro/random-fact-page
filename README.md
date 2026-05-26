# Random Fact Page

A web application that displays random facts to users. Built with vanilla JavaScript using a layered architecture (UI → Controller → Service → Repository), comprehensive testing with property-based tests, and multi-language support.

## Features

- Displays a random fact on page load
- "New Fact" button to fetch a different fact each time
- No consecutive duplicate facts
- Language switcher (English / Português Brasileiro)
- XSS sanitization on all displayed content
- Rate limiting (1 request per second) to prevent abuse
- Fallback to local fact collection when external API is unavailable
- Offline notice when using cached facts
- Accessible UI with ARIA attributes and keyboard navigation

## Architecture

```
src/
├── controller/      # Request handlers / UI event orchestration
├── models/          # Data models (Fact, FactResponse)
├── repository/      # Data access layer (API calls, local data store)
├── service/         # Business logic (fact selection, fallback, language)
├── ui/              # DOM rendering and user interaction
└── utils/           # Validation and sanitization utilities
```

**Flow:** Page UI → Fact Controller → Fact Service → Fact Repository → Local Collection / External API

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/danielfscastro/random-fact-page.git
cd random-fact-page
npm install
```

### Running the App

The app is a static site that uses ES Modules, so it needs a local server:

```bash
npx serve .
```

Then open `http://localhost:3000` in your browser.

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only property-based tests
npm run test:property

# Watch mode (re-runs on file changes)
npm run test:watch
```

## Tech Stack

| Technology | Purpose |
|---|---|
| JavaScript (ES Modules) | Application language |
| Vanilla JS | UI rendering (no framework) |
| Vitest | Test runner |
| fast-check | Property-based testing |
| jsdom | DOM simulation for tests |

## Testing Strategy

The project uses three levels of testing:

- **Unit tests** — Isolated tests for each module with mocks
- **Integration tests** — Cross-layer tests (UI + Controller + Service)
- **Property-based tests** — Universal correctness properties validated with fast-check:
  1. No consecutive duplicate facts
  2. Selection always returns a collection member
  3. Fallback flag accuracy
  4. Fact validation correctness
  5. Invalid facts are never returned
  6. XSS sanitization effectiveness

## Language Support

The app supports two languages:

- 🇺🇸 **English** (default)
- 🇧🇷 **Português Brasileiro**

Click the language buttons to switch. The current fact is translated in place (same fact, different language).

## License

MIT
