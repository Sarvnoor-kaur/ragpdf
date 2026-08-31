import pytest
import os
import time
from pages.signup_page import SignupPage
from pages.dashboard_page import DashboardPage

@pytest.mark.e2e
def test_user_signup(driver, base_url):
    signup_page = SignupPage(driver)
    dashboard_page = DashboardPage(driver)
    
    # Generate a unique email to avoid duplicate user errors on multiple test runs
    unique_id = int(time.time())
    test_email = f"testuser_{unique_id}@company.com"
    test_password = "TestPassword123!"
    
    signup_page.load(base_url)
    signup_page.register("Automated Test User", test_email, test_password, "employee", "IT")
    
    # Wait for dashboard to load
    is_loaded = dashboard_page.is_dashboard_loaded()
    assert is_loaded, "Dashboard did not load after signup. Registration may have failed."
