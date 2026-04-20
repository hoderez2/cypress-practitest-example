# Cypress + PractiTest API Example

This project shows how to run Cypress tests in CLI mode and report the results to PractiTest using the `auto_create` API endpoint.

It is designed as a simple reference implementation for teams that already use Cypress and want to integrate their automated test results with PractiTest.

## What this example does

- Runs Cypress tests from the command line
- Reports each test result to PractiTest
- Uses the PractiTest `auto_create` endpoint
- Automatically creates the test in PractiTest if it does not exist
- Automatically creates the instance in the Test Set if needed
- Creates the run in that instance
- Attaches failure screenshots to failed runs
- Disables video recording

## Project structure

```
.
├─ cypress/
│  └─ e2e/
│     └─ practitest-demo.cy.js
├─ lib/
│  ├─ practitest-client.js
│  └─ practitest-reporter.js
├─ cypress.config.js
├─ package.json
├─ .env.example
└─ README.md
```

---

## Prerequisites

Before using this example, make sure you have:

- Node.js installed
- A Cypress project
- A PractiTest account and project
- A Test Set created in PractiTest
- A PractiTest API token
- Your PractiTest user email

---

## Installation

Install dependencies:

```bash
npm install
```

## Environment setup

Create a `.env` file from the provided example:

```bash
cp .env.example .env
```

Then update it with your PractiTest details:

```env
PT_BASE_URL=https://api.practitest.com
PT_EMAIL=your@email.com
PT_TOKEN=your_api_token
PT_PROJECT_ID=12345
PT_SET_ID=67890
```

> **Note:** `.env` is already listed in `.gitignore` — your credentials will not be committed to source control.

---

## Running the example

```bash
npx cypress run --browser chrome --spec "cypress/e2e/practitest-demo.cy.js"
```

---

## How it works

When Cypress finishes running a spec:

1. The `after:spec` event is triggered
2. Each test result is processed
3. A PractiTest `auto_create` request is built

PractiTest then:

- Creates the test if it does not exist
- Creates an instance of that test in the Test Set (ID from `.env`)
- Creates a new run in that instance

If the test failed:

- The Cypress screenshot is read from disk
- The screenshot is attached to the run

---

## Key files

**`lib/practitest-client.js`**
Handles authenticated API calls to PractiTest. Wraps the `auto_create` endpoint and the screenshot attachment request.

**`lib/practitest-reporter.js`**
Builds the payload, collects screenshots, and reports results. Connects the reporting logic to Cypress execution via the `after:spec` event.

**`cypress/e2e/practitest-demo.cy.js`**
A sample Cypress spec that includes both a passing and an intentionally failing test to demonstrate the full reporting flow.

---
 
## Custom fields
 
This integration sets the following custom field on every test it creates via `auto_create`:
 
| Field name | Field ID | Value |
|---|---|---|
| Automation Status | 278185 | `Automated` |
 
The field is applied in `lib/practitest-reporter.js` inside `test-attributes`:
 
```js
'custom-fields': {
  '---f-278185': 'Automated',
}
```
 
Custom field keys follow the PractiTest API format `---f-{field_id}`. The value must match exactly one of the field's configured possible values (case-sensitive).
 
> **Note:** This field is only written when `auto_create` creates the test for the first time. It will not overwrite the value on subsequent runs.
 
To adapt this for your own project, replace `278185` with your field's ID and `'Automated'` with the appropriate value. You can find field IDs via the [PractiTest fields API](https://www.practitest.com/api-v2/#get-all-system-and-custom-fields-in-your-project).
 
---

## Test naming

Test names are built from the full Cypress title chain:

```js
describe('PractiTest Demo', () => {
  it('Intentional failure', () => {})
})
```

Becomes: `PractiTest Demo Intentional failure`

This helps:

- Avoid name collisions across specs
- Keep tests traceable back to their source

---

## Screenshots

Screenshots are attached only for failed tests.

Cypress does not reliably expose screenshot paths in test results, so this example reads them directly from:

```
cypress/screenshots/<spec-name>/
```

---

## Duration

Real per-test duration is read from `test.duration` (milliseconds) and converted to `HH:MM:SS` format before being sent to PractiTest.

---
### Why `after:spec` is used

This example uses the `after:spec` event instead of `after:run` because it provides access to individual test results. This allows each test to be reported separately to PractiTest, including attaching failure screenshots.

The `after:run` event only provides aggregated results and is not suitable for per-test reporting.

---

## Known limitations

| Limitation | Detail |
|---|---|
| Single screenshot per test | Only the first screenshot found for a failed test is attached |
| Screenshot path heuristic | Paths are inferred from the spec name, not read from Cypress metadata |
| Single spec shown | The run command targets one spec for demo clarity; omit `--spec` to run all specs — the reporter handles each one via `after:spec` automatically |

---

## Customization ideas

You can extend this example to:

- Map Cypress tests to existing PractiTest test IDs (skip auto-creation)
- Attach multiple screenshots per failed test
- Include additional execution logs or custom fields
- Integrate with CI pipelines (see GitHub Actions example below)

### GitHub Actions example

```yaml
name: Cypress + PractiTest

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx cypress run --browser chrome --spec "cypress/e2e/practitest-demo.cy.js"
        env:
          PT_EMAIL: ${{ secrets.PT_EMAIL }}
          PT_TOKEN: ${{ secrets.PT_TOKEN }}
          PT_PROJECT_ID: ${{ secrets.PT_PROJECT_ID }}
          PT_SET_ID: ${{ secrets.PT_SET_ID }}
          PT_BASE_URL: https://api.practitest.com
```

Store your PractiTest credentials as [GitHub Actions secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) — never hardcode them in the workflow file.

---

## References

- [PractiTest API v2 — auto_create endpoint](https://www.practitest.com/api-v2/#auto-create-a-run)
- [Cypress CLI documentation](https://docs.cypress.io/guides/guides/command-line)

---

## Notes

This example is intentionally simple and focused. It demonstrates the minimum needed to:

- Connect Cypress to PractiTest
- Report pass/fail results
- Attach failure screenshots as evidence

Build on top of this depending on your team's workflow.
