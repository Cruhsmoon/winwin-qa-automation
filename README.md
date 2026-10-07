# WinWin.travel: QA Automation test task

**Role:** QA Automation Engineer
**Candidate:** Ruslan Khokhlov
**Stack:** Playwright + JavaScript, Page Object Model, UI and API assertions, logging.

## What's inside

```
.
├── components/
│   ├── GuestsSelector.js      # Adults / Children / Pets dropdown (incl. pet type & weight)
│   └── FiltersModal.js        # "Filters" modal (big filter)
├── pages/
│   ├── BasePage.js            # open() + wait for app hydration
│   └── SearchPage.js          # landing (/) and results (/app) search bar
├── tests/
│   ├── fixtures.js            # blocks cookie banner & analytics, provides page objects
│   ├── max-adults.spec.js     # Scenario 1: Max Adults selection
│   ├── pets-filter.spec.js    # Scenario 2: Pets filter options
│   └── filters-request.spec.js# Scenario 3: Filters affect request (network interception)
├── utils/
│   ├── logger.js              # timestamped log + annotations in the HTML report
│   └── url.js
├── docs/
│   └── header-test-cases.md   # Task 1: Header test cases (26 cases)
└── playwright.config.js
```

**Task 1, Header test cases (Google Sheets):** https://docs.google.com/spreadsheets/d/1baszDK3faGxI_kiOH5sOj_KE97pC-d0xhZ0Dc4O9MDA/edit

## Setup & run

Requirements: Node.js 18+.

```bash
npm install
npx playwright install chromium
npm test                 # all tests, headless
npm run test:headed      # watch in a browser
npm run test:guests      # Scenario 1 only
npm run test:pets        # Scenario 2 only
npm run test:filters     # Scenario 3 only
npm run report           # open HTML report (logs are attached as annotations)
```

Optional: `BASE_URL=https://<env> npm test` to run against another environment.

## Scenarios covered

### 1. Max Adults selection (`max-adults.spec.js`)
- Reads the limit from the input's `max` attribute (currently **10**), so the test does not hardcode it.
- Clicks "+" until it becomes disabled, then checks that the value equals the max.
- UI at the limit: "+" is disabled, "−" is still enabled, and the closed field shows the value.
- Typing a value above the limit into the input is not accepted.
- **API/params:** the search link carries `guestQuantity.adultsQuantity=10`.
- After clicking "−", "+" becomes enabled again. The value also persists after closing and reopening the dropdown.

### 2. Pets filter options (`pets-filter.spec.js`)
- Pet type options are exactly **Dog / Cat / Other**, and Dog is the default.
- The Dog weight options are **<1, 1–5, 5–10, 10–15, 15–20, >20 kg**. The app also has 10–15 kg, which is missing from the task description.
- Each weight is a data-driven test: it is selected, shown in the trigger, marked `aria-selected`, and passed to the search params (`pets[0].type=DOG&pets[0].weight=>20kg`, …).
- "Other" is selected, reflected in the UI, and sent as `type=OTHER`.
- Switching Cat → Dog keeps the UI consistent: the weight field is hidden for Cat and shown again for Dog.

### 3. Filters affect request (`filters-request.spec.js`)
- Opens `/app` and intercepts the baseline `GET /api/v1/offers/search`, which has no `filters[...]` params.
- Selects **Breakfast** and **Dogs allowed** in the Filters modal and clicks Apply.
- Intercepts the new `/api/v1/offers/search` request and asserts:
  - the URL changed compared to the baseline;
  - `filters[i].optionIDs[j]` contains exactly the IDs of the checked options;
  - the response is `200`;
  - the page URL contains `search.filters[...]`, so the shareable link keeps the filters.

## Design decisions
- **Selectors:** the app has stable `data-wwt-id` attributes, so they are used everywhere. Role-based locators are used for Radix selects and options.
- **Stability:**
  - The cookie banner (CookieFirst) and analytics are blocked in a fixture. The banner appears at a random moment and covers the UI.
  - `BasePage.open()` waits for `/api/v1/filters`, which is a sign of React hydration. The first click on the Guests dropdown right after hydration is sometimes ignored, so it is retried with `expect().toPass()`.
- **Diagnostics:** trace, screenshot and video are kept on failure, and there is 1 retry locally.
- Tests are independent and run in parallel. Last local run: **12 passed**.

## Observations found while automating
1. **Redundant search requests on `/app`.** After clicking Apply in Filters, the app first sends `/offers/search` **without** filters, then `.../release/discard`, and only then the filtered request. This means extra load and a possible race where stale results flash.
2. **Inconsistent defaults between landing and `/app`.** The landing page uses check-in +5 days, radius 20, and the "Dubai, Dubai, UAE" label. `/app` uses check-in +7 days, radius 10, and "Dubai, UAE". As a result, a user who opens `/app` from the logo gets different dates than on the landing page.
3. **Nested interactive elements in the header.** The Comparison link (`<a>`) is wrapped in a `<button>` that handles the tooltip, so a plain click is intercepted by the wrapper. This is an accessibility issue, and screen readers announce it as two controls.
4. **Two "Apply" buttons in the Filters modal DOM.** The second one is hidden (mobile layout), so any automation without the visibility filter becomes ambiguous.
5. **Search from the landing page opens results in a new tab** (`target="_blank"`), which is unexpected for a primary search CTA.
6. **The pet weight select is shown for "Other"** but hidden for "Cat". The logic is unclear and worth confirming with the product team.
