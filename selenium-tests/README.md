# Selenium E2E Tests — Company Policy AI Assistant

Automated end-to-end tests for the MERN stack application using
**Python · Selenium 4 · pytest · Google Chrome**.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [How Page Object Model Works](#how-page-object-model-works)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Setting Credentials on Windows](#setting-credentials-on-windows)
6. [Running the Tests](#running-the-tests)
7. [Headless Mode](#headless-mode)
8. [Screenshots on Failure](#screenshots-on-failure)
9. [Adding a New Test](#adding-a-new-test)
10. [Test Case Reference](#test-case-reference)
11. [Docker / CI Notes](#docker--ci-notes)

---

## Project Structure

```
selenium-tests/
│
├── conftest.py            ← Shared pytest fixtures (WebDriver setup/teardown, base_url)
├── pytest.ini             ← pytest configuration (markers, testpaths, addopts)
├── requirements.txt       ← Python dependencies
├── .gitignore             ← Ignores venv/, screenshots/, __pycache__/, etc.
│
├── pages/                 ← Page Object Model classes
│   ├── __init__.py
│   ├── login_page.py
│   ├── signup_page.py
│   ├── dashboard_page.py
│   └── chatbot_page.py
│
├── tests/                 ← Test files (one per feature)
│   ├── __init__.py
│   ├── test_homepage.py
│   ├── test_signup.py
│   ├── test_login.py
│   ├── test_dashboard.py
│   ├── test_pdf_upload.py
│   └── test_chatbot.py
│
├── test_data/
│   └── sample.pdf         ← Minimal real PDF used for upload tests
│
└── screenshots/           ← Auto-created; stores failure screenshots
```

---

## How Page Object Model Works

Each page in the application has a corresponding Python class in `pages/`.

- **Locators** (`By.CSS_SELECTOR`, `By.ID`, etc.) live in the class — not in the tests.
- **Actions** (e.g. `login_page.login(email, password)`) are methods on the class.
- **Tests** only call page methods and make assertions — they never contain raw `find_element` calls.

This means if the UI changes, you only need to update the page class — not every test.

```python
# test_login.py (clean — no raw Selenium)
login_page.load(base_url)
login_page.login(email, password)
assert dashboard_page.is_dashboard_loaded()
```

---

## Installation

### 1. Create a Python virtual environment (Windows)

Open a terminal **inside the `selenium-tests/` directory**:

```powershell
cd company-policy-ai\..   # navigate to project root or wherever suits
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies

```powershell
pip install -r selenium-tests\requirements.txt
```

Selenium 4+ ships with **Selenium Manager**, which automatically downloads the
correct `chromedriver` for your installed Chrome version.  
**You do not need to manually download chromedriver.**

---

## Configuration

| Environment Variable      | Default                    | Description                          |
|---------------------------|----------------------------|--------------------------------------|
| `SELENIUM_BASE_URL`       | `http://localhost:5173`    | Frontend URL                         |
| `SELENIUM_TEST_EMAIL`     | *(required for auth tests)*| Email of a pre-registered test user  |
| `SELENIUM_TEST_PASSWORD`  | *(required for auth tests)*| Password of that user                |
| `SELENIUM_HEADLESS`       | `false`                    | Set to `true` to run headless        |

---

## Setting Credentials on Windows

### Option A — PowerShell (current session only)

```powershell
$env:SELENIUM_TEST_EMAIL    = "testuser@company.com"
$env:SELENIUM_TEST_PASSWORD = "YourPassword123!"
```

### Option B — Persistent user environment variable

```powershell
[System.Environment]::SetEnvironmentVariable("SELENIUM_TEST_EMAIL",    "testuser@company.com", "User")
[System.Environment]::SetEnvironmentVariable("SELENIUM_TEST_PASSWORD", "YourPassword123!",     "User")
```

Then restart your terminal for the change to take effect.

> **Security note:** Never commit credentials to Git.
> The `SELENIUM_TEST_EMAIL` / `SELENIUM_TEST_PASSWORD` user should be a dedicated
> test account, not a production admin account.

---

## Running the Tests

### Step 1 — Start the backend (Terminal 1)

```powershell
cd company-policy-ai\backend
npm run dev
```

Backend will be available at `http://localhost:5000`.

### Step 2 — Start the frontend (Terminal 2)

```powershell
cd company-policy-ai\frontend
npm run dev
```

Frontend will be available at `http://localhost:5173`.

### Step 3 — Run Selenium tests (Terminal 3)

```powershell
# Activate the virtual environment first
venv\Scripts\activate

# Run all tests
cd selenium-tests
pytest -v

# Run a single test file
pytest tests\test_login.py -v

# Run a single test function
pytest tests\test_login.py::test_valid_login -v

# Run only tests marked @pytest.mark.e2e
pytest -m e2e -v
```

---

## Headless Mode

Run without opening a visible browser window (useful in CI):

```powershell
$env:SELENIUM_HEADLESS = "true"
pytest -v
```

Or in one line:

```powershell
$env:SELENIUM_HEADLESS="true"; pytest -v
```

---

## Screenshots on Failure

When any test fails, `conftest.py` automatically:

1. Takes a screenshot of the browser at the moment of failure.
2. Saves it to `selenium-tests/screenshots/<test_name>.png`.
3. Prints the current URL to the console.

Screenshots directory is in `.gitignore` and will never be committed.

---

## Adding a New Test

1. **Create a page class** in `pages/my_new_page.py` with locators and action methods.
2. **Create a test file** in `tests/test_my_feature.py`.
3. Use the shared `driver` and `base_url` fixtures from `conftest.py`.
4. Mark tests with `@pytest.mark.e2e`.

Example skeleton:

```python
# tests/test_my_feature.py
import pytest
from pages.my_new_page import MyNewPage

@pytest.mark.e2e
def test_my_feature(driver, base_url):
    page = MyNewPage(driver)
    page.load(base_url)
    page.do_something()
    assert page.is_something_visible()
```

---

## Test Case Reference

| Test File           | Test Function              | Description                                        |
|---------------------|----------------------------|----------------------------------------------------|
| test_homepage.py    | test_homepage_loads        | Verify hero heading renders on the landing page    |
| test_homepage.py    | test_homepage_has_login_link | Verify the Login nav link is visible             |
| test_homepage.py    | test_homepage_has_register_link | Verify the Register nav link is visible       |
| test_signup.py      | test_user_signup           | Register a new user with a unique timestamped email|
| test_login.py       | test_valid_login           | Login with valid credentials → reach Dashboard     |
| test_login.py       | test_invalid_login         | Login with bad credentials → error message shown   |
| test_dashboard.py   | test_dashboard_components  | Dashboard loads, Logout works, URL changes         |
| test_pdf_upload.py  | test_pdf_upload            | Admin uploads sample.pdf via `send_keys`           |
| test_chatbot.py     | test_chatbot_conversation  | Send a chat message and verify a non-empty response|

---

## Docker / CI Notes

The test framework is structured so it can run inside a Docker container
with headless Chrome without any code changes. Simply set:

```bash
SELENIUM_HEADLESS=true
SELENIUM_BASE_URL=http://frontend:5173  # or whatever your Docker service is called
SELENIUM_TEST_EMAIL=...
SELENIUM_TEST_PASSWORD=...
```

A future `Dockerfile` for the test runner would look like:

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y google-chrome-stable
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["pytest", "-v"]
```
