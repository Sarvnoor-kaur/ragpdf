import pytest
import os
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage

@pytest.fixture
def logged_in_driver(driver, base_url):
    email = os.getenv("SELENIUM_TEST_EMAIL")
    password = os.getenv("SELENIUM_TEST_PASSWORD")
    if not email or not password:
        pytest.skip("Test credentials not set")
        
    login_page = LoginPage(driver)
    login_page.load(base_url)
    login_page.login(email, password)
    return driver

@pytest.mark.e2e
def test_dashboard_components(logged_in_driver):
    dashboard_page = DashboardPage(logged_in_driver)
    
    # Wait for dashboard to load
    assert dashboard_page.is_dashboard_loaded()
    
    # Check if logout button is visible and works
    dashboard_page.logout()
    
    # Verify we are redirected to login or home
    assert "dashboard" not in logged_in_driver.current_url.lower()
