import pytest
import os
from pages.login_page import LoginPage
from pages.dashboard_page import DashboardPage
from pages.chatbot_page import ChatbotPage

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
def test_chatbot_conversation(logged_in_driver):
    dashboard_page = DashboardPage(logged_in_driver)
    dashboard_page.is_dashboard_loaded()
    
    # Open chatbot
    dashboard_page.go_to_chat()
    
    chatbot_page = ChatbotPage(logged_in_driver)
    
    # Send a query
    chatbot_page.send_message("What is the company leave policy?")
    
    # Wait for the AI's response
    # It might take a bit longer for LLM to reply
    response_text = chatbot_page.wait_for_response(timeout=30)
    
    assert response_text is not None, "Bot did not reply within the timeout"
    assert len(response_text) > 0, "Bot replied with an empty message"
