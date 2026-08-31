import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Default fallback URL
DEFAULT_BASE_URL = "http://localhost:5173"


@pytest.fixture(scope="session")
def base_url():
    return os.getenv("SELENIUM_BASE_URL", DEFAULT_BASE_URL)


@pytest.fixture(scope="function")
def driver(request):
    chrome_options = Options()

    # Headless mode via env variable:  SELENIUM_HEADLESS=true
    if os.getenv("SELENIUM_HEADLESS", "false").lower() == "true":
        chrome_options.add_argument("--headless=new")

    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")

    # Selenium Manager automatically downloads the correct ChromeDriver
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(5)

    yield driver

    # --- Screenshot on failure ---
    # rep_call is set by the pytest_runtest_makereport hook below
    rep = getattr(request.node, "rep_call", None)
    if rep is not None and rep.failed:
        screenshots_dir = os.path.join(os.path.dirname(__file__), "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        screenshot_path = os.path.join(screenshots_dir, f"{request.node.name}.png")
        driver.save_screenshot(screenshot_path)
        print(f"\n📸  Screenshot saved → {screenshot_path}")
        print(f"🌐  URL at failure  → {driver.current_url}")

    driver.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Make the test phase result available on the item so the driver fixture can read it."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
