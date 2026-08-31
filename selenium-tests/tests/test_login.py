import pytest
import os
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

@pytest.fixture
def credentials():
    email = os.getenv("SELENIUM_TEST_EMAIL")
    password = os.getenv("SELENIUM_TEST_PASSWORD")
    if not email or not password:
        pytest.skip("Test credentials (SELENIUM_TEST_EMAIL, SELENIUM_TEST_PASSWORD) not set")
    return email, password

@pytest.mark.e2e
def test_valid_login(driver, base_url, credentials):
    email, password = credentials
    
    login_page = LoginPage(driver)
    dashboard_page = DashboardPage(driver)
    
    login_page.load(base_url)
    login_page.login(email, password)
    
    # Verify Dashboard is displayed
    assert dashboard_page.is_dashboard_loaded(), "Dashboard did not load after valid login"
    
@pytest.mark.e2e
def test_invalid_login(driver, base_url):
    login_page = LoginPage(driver)
    
    login_page.load(base_url)
    login_page.login("invalid_user@company.com", "wrongpassword")
    
    error_msg = login_page.get_error_message()
    assert error_msg, "Expected an error message but none was displayed"
    assert "credentials" in error_msg.lower() or "invalid" in error_msg.lower() or "user not found" in error_msg.lower()
    
    # Verify we are still on the login page (or at least not on dashboard)
    assert "login" in driver.current_url.lower()
