# Implementation Plan: Random Fact Page

## Overview

Implement a web page that displays random facts using a layered architecture (UI → Controller → Service → Repository). The implementation uses JavaScript with a local fact collection, optional external API integration, fallback logic, fact validation, XSS sanitization, rate limiting, and comprehensive testing with fast-check for property-based tests.

## Tasks

- [x] 1. Set up project structure and data models
  - [x] 1.1 Create project directory structure and configuration files
    - Create `src/` directory with subdirectories: `models/`, `repository/`, `service/`, `controller/`, `ui/`, `utils/`
    - Create `tests/` directory with subdirectories: `unit/`, `integration/`, `property/`
    - Initialize `package.json` with dependencies: `fast-check` for property-based testing, a test runner (e.g., vitest or jest)
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Implement Fact and FactResponse data models
    - Create `src/models/fact.js` defining the `Fact` structure with fields: `id` (positive integer), `text` (string, max 500 chars), `category` (enum: science, history, nature, technology, general), `source` ("local" or "api")
    - Create `src/models/factResponse.js` defining the `FactResponse` structure with fields: `fact` (Fact), `isFromFallback` (boolean), `timestamp` (Date)
    - Export factory functions for creating Fact and FactResponse instances
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 1.3 Implement fact validation function
    - Create `src/utils/validateFact.js` implementing `validateFact(fact)` that returns `true` if and only if: `id > 0`, `text` is non-empty and ≤ 500 characters, `category` is one of the valid values, `source` is "local" or "api"
    - Return `false` for null/undefined input or any field that fails validation
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 1.4 Write property test for fact validation
    - **Property 4: Fact validation correctness**
    - Generate arbitrary Fact-like objects with fast-check and verify `validateFact` returns TRUE only when all fields meet the specified constraints
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 2. Implement repository and local fact collection
  - [x] 2.1 Create local fact collection
    - Create `src/repository/localFacts.js` containing an array of at least 10 pre-defined facts covering all categories
    - Each fact must conform to the Fact model with `source: "local"`
    - _Requirements: 4.1, 7.3_

  - [x] 2.2 Implement Fact Repository
    - Create `src/repository/factRepository.js` implementing: `fetchAllFacts()`, `fetchFactByIndex(index)`, `getCount()`
    - Implement external API fetching with a 3-second timeout
    - On API failure, fall back to the local fact collection
    - Validate all external API responses before returning
    - Cache the local collection in memory after first load
    - _Requirements: 4.1, 4.4, 6.2, 7.2, 7.3_

  - [x] 2.3 Write unit tests for Fact Repository
    - Test that `fetchAllFacts()` returns local facts when API is unavailable
    - Test that external API timeout is enforced at 3 seconds
    - Test that invalid API responses are rejected
    - Test that local collection is cached after first load
    - _Requirements: 4.1, 6.2, 7.2, 7.3_

- [x] 3. Implement Fact Service with selection logic
  - [x] 3.1 Implement random fact selection algorithm
    - Create `src/service/factService.js` implementing `selectRandomFact(facts, excludeId)`
    - If `excludeId` is provided and list has more than one item, filter out the fact with that id before selecting
    - If list has exactly one item, return it regardless of `excludeId`
    - Select uniformly at random from the eligible facts
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.2 Implement getRandomFact with fallback and validation
    - Implement `getRandomFact()` in `src/service/factService.js`
    - Track the last displayed fact id to avoid consecutive duplicates
    - Attempt to fetch from repository; on failure, fall back to local collection
    - Skip invalid facts (those failing `validateFact`) and attempt to fetch another
    - Set `isFromFallback` to TRUE only when primary source failed
    - Raise an error if no valid facts are available from any source
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 5.5_

  - [x] 3.3 Write property test for no consecutive duplicates
    - **Property 1: No consecutive duplicates**
    - For any generated list of facts (size > 1) and any previousId present in the list, verify `selectRandomFact(facts, previousId)` returns a fact with a different id
    - **Validates: Requirement 3.1**

  - [x] 3.4 Write property test for selection always returns a collection member
    - **Property 2: Selection always returns a collection member**
    - For any non-empty list of valid facts and any excludeId, verify the returned fact is a member of the input list
    - **Validates: Requirements 3.1, 3.2**

  - [x] 3.5 Write property test for fallback flag accuracy
    - **Property 3: Fallback flag accuracy**
    - Mock the repository to simulate primary source failure and success; verify `isFromFallback` is TRUE only when primary source was unavailable
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 3.6 Write property test for invalid facts never returned
    - **Property 5: Invalid facts are never returned**
    - Generate collections mixing valid and invalid facts; verify `getRandomFact()` only returns facts that pass validation
    - **Validates: Requirement 5.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement XSS sanitization
  - [x] 5.1 Implement sanitization utility
    - Create `src/utils/sanitize.js` implementing `sanitizeFact(text)` that removes or escapes HTML tags, JavaScript event handlers, and script content
    - Ensure output contains no executable script content while preserving readable text
    - _Requirements: 6.1_

  - [x] 5.2 Write property test for XSS sanitization
    - **Property 6: XSS sanitization**
    - Generate arbitrary strings containing HTML tags, `<script>` blocks, and event handler attributes with fast-check; verify sanitized output contains no executable script content
    - **Validates: Requirement 6.1**

- [x] 6. Implement Fact Controller with rate limiting
  - [x] 6.1 Implement Fact Controller
    - Create `src/controller/factController.js` implementing `requestRandomFact()` and `initialize()`
    - Coordinate between UI callbacks and the Fact Service
    - Manage loading and error states
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 6.2 Implement rate limiting on New Fact requests
    - Add rate limiting logic to the controller: ignore additional "New Fact" requests if less than 1 second has elapsed since the last request
    - _Requirements: 6.3_

  - [x] 6.3 Write unit tests for Fact Controller
    - Test that `requestRandomFact()` calls the service and returns a fact
    - Test that rate limiting blocks requests within 1 second
    - Test that error states are properly propagated
    - _Requirements: 2.2, 6.3_

- [x] 7. Implement Page UI
  - [x] 7.1 Create the HTML page structure
    - Create `src/ui/index.html` with a fact display area, a "New Fact" button, a loading indicator, and an error message area
    - Ensure the button is visible and accessible (proper ARIA labels, keyboard accessible)
    - _Requirements: 1.1, 2.1_

  - [x] 7.2 Implement UI rendering logic
    - Create `src/ui/pageUI.js` implementing: `displayFact(fact)`, `showLoading()`, `showError(message)`, `onNewFactRequested(callback)`
    - Apply `sanitizeFact()` to all fact text before rendering to the DOM
    - Display an "offline" notice when `isFromFallback` is TRUE
    - _Requirements: 1.2, 1.3, 1.4, 2.3, 6.1_

  - [x] 7.3 Implement page initialization
    - Create `src/ui/main.js` that initializes the controller, fetches the first fact on page load, and wires the "New Fact" button to the controller
    - Show loading indicator during initial fetch
    - Display fact within 500ms using locally cached data
    - _Requirements: 1.1, 1.2, 7.1_

  - [x] 7.4 Write unit tests for Page UI
    - Test that `displayFact` renders fact text to the DOM
    - Test that `showLoading` and `showError` toggle visibility correctly
    - Test that sanitization is applied before rendering
    - _Requirements: 1.2, 6.1_

- [x] 8. Integration and wiring
  - [x] 8.1 Wire all layers together
    - Connect Page UI → Controller → Service → Repository in `src/ui/main.js`
    - Ensure the full flow works: page load fetches and displays a fact, "New Fact" button triggers a new fact
    - Verify fallback notice appears when API is unavailable
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1_

  - [x] 8.2 Write integration tests
    - Test full flow from button click to fact display with mocked repository
    - Test fallback behavior with simulated API failure
    - Test that consecutive "New Fact" clicks within 1 second are rate-limited
    - Test page load displays a fact or error message appropriately
    - _Requirements: 1.1, 1.4, 2.2, 4.1, 6.3_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check and validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- JavaScript is used throughout; no framework dependency for the UI (vanilla JS with DOM manipulation)
