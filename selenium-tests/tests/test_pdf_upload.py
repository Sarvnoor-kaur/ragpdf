import pytest
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

# Resolve sample PDF path relative to this test file
SAMPLE_PDF = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "test_data", "sample.pdf")
)


@pytest.fixture
def admin_driver(driver, base_url):
    email = os.getenv("SELENIUM_TEST_EMAIL")
    password = os.getenv("SELENIUM_TEST_PASSWORD")
    if not email or not password:
        pytest.skip("Test credentials not set — set SELENIUM_TEST_EMAIL and SELENIUM_TEST_PASSWORD")

    login_page = LoginPage(driver)
    login_page.load(base_url)
    login_page.login(email, password)
    return driver


@pytest.mark.e2e
def test_pdf_upload(admin_driver):
    """
    Login → navigate to Admin Documents → open Upload modal →
    fill in title → send sample.pdf via send_keys → submit → verify success.

    NOTE: The logged-in account must have role 'admin' or 'hr' to see the
    Document Management section on the dashboard.
    """
    dashboard_page = DashboardPage(admin_driver)
    assert dashboard_page.is_dashboard_loaded(), "Dashboard did not load"

    # Navigate to /admin/documents
    dashboard_page.go_to_documents()

    wait = WebDriverWait(admin_driver, 10)

    # Open the Upload modal
    wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="open-upload-modal"]'))
    ).click()

    # Fill in the document title
    title_input = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//input[@placeholder=\"e.g., Leave Policy 2024\"]")
        )
    )
    title_input.send_keys("Selenium Automated Test Policy")

    # Send sample PDF to the hidden file input using send_keys
    # (This bypasses the OS file picker — purely Selenium-driven)
    file_input = admin_driver.find_element(By.ID, "doc-file")
    file_input.send_keys(SAMPLE_PDF)

    # Submit the upload form
    wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="upload-submit-btn"]'))
    ).click()

    # Verify a success indicator appears (modal closes and document appears in list)
    success = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH,
             "//*[contains(text(),'Upload Successful') or "
             "contains(text(),'successfully') or "
             "contains(text(),'Selenium Automated Test Policy')]")
        )
    )
    assert success.is_displayed(), "Upload success indicator was not found after submission"

