# Engineering Standards

To ensure long-term maintainability, the following standards are adopted.

## 1. Architecture & Folder Structure
- **Pattern**: MVC (Model-View-Controller) / Service-Oriented.
- **Structure**:
  - `routes/`: Define API endpoints and apply middleware.
  - `controllers/`: Handle HTTP request/response parsing.
  - `services/`: Contain business logic.
  - `models/`: Handle database interactions.
- **Rule**: Controllers must NOT contain business logic. Services must NOT access the `req` or `res` objects.

## 2. Naming Conventions
- **Files**: `camelCase.js` (e.g., `leadController.js` or `lead.controller.js`).
- **Variables/Functions**: `camelCase`.
- **Classes/Models**: `PascalCase`.
- **Constants**: `UPPER_SNAKE_CASE`.

## 3. Code Style & Formatting
- **Linter**: ESLint with Prettier integration.
- **Enforcement**: Husky pre-commit hooks will run `npm run lint` and `npm run format`. Commits will fail if code doesn't meet standards.

## 4. Testing
- **Framework**: Jest & Supertest.
- **Requirement**: All new services must have unit tests. All new API endpoints must have integration tests covering 200 OK and 400 Bad Request paths.
- **Coverage**: Minimum 70% branch coverage for CI to pass.

## 5. Git & Code Reviews
- **Branching**: Trunk-based development or GitHub Flow (`feature/ticket-name`).
- **Commits**: Conventional Commits (e.g., `feat: add user login`, `fix: resolve crash on null email`).
- **Reviews**: All PRs require at least 1 approval. CI checks (tests, linting) must pass before merging.

## 6. Security & Logging
- **Dependencies**: Regular audits (`npm audit`) required.
- **Logging**: Use `winston`. `console.log` is prohibited in production. Log all errors and critical business actions (e.g., Auth, Payments).
- **Validation**: All incoming request bodies, params, and queries must be validated using Joi/Zod.

## Adoption Strategy (Resistance Mitigation)
1. **Automate Everything**: Developers hate manual nagging. We will enforce linting, formatting, and tests via CI pipelines and Pre-commit hooks (Husky). The "computer says no", not the lead developer.
2. **Provide Templates**: Introduce Plop.js or simple CLI tools to generate boilerplate (Controller, Service, Route) so doing it the "right way" is faster than doing it the "wrong way".
3. **Brown Bag Sessions**: Host a 30-minute session showing a before/after refactor (like `RefactorExample.md`) to demonstrate the pain it solves (e.g., "Look how easy this is to test now!").
