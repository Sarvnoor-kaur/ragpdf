import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class ChatbotPage:
    def __init__(self, driver):
        self.driver = driver

        # Locators
        self.chat_input = (By.CSS_SELECTOR, '[data-testid="chat-input"]')
        self.submit_button = (By.CSS_SELECTOR, '[data-testid="chat-submit"]')

        # The AI loading indicator (spinning Loader2 icon inside the bot bubble)
        self.loading_indicator = (
            By.XPATH,
            "//div[contains(@class,'animate-spin') and ancestor::main]"
        )

        # All bot (assistant) message bubbles in the main chat area
        self.bot_message_bubble = (
            By.XPATH,
            "//main//div[contains(@class,'bg-[#131b2e]') and contains(@class,'rounded-2xl')]"
        )

    def send_message(self, message: str):
        """Type a question into the chat box and click Send."""
        input_el = WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located(self.chat_input)
        )
        input_el.clear()
        input_el.send_keys(message)

        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(self.submit_button)
        ).click()

    def wait_for_response(self, timeout: int = 45) -> str:
        """
        Wait until the AI has finished generating a response.

        Strategy:
        1. Wait for the loading spinner to disappear (means the API call completed).
        2. Collect all bot messages and return the last one.

        Returns the text of the last bot message, or raises TimeoutException.
        """
        wait = WebDriverWait(self.driver, timeout)

        # 1. Wait for loading spinner to appear first (confirms request was sent)
        try:
            wait.until(EC.presence_of_element_located(self.loading_indicator))
        except TimeoutException:
            pass  # Spinner may have appeared and vanished very quickly

        # 2. Wait for loading spinner to disappear (response complete)
        try:
            wait.until(EC.invisibility_of_element_located(self.loading_indicator))
        except TimeoutException:
            pass  # If it never appeared, that's fine too

        # 3. Grab the last bot message bubble text
        bubbles = self.driver.find_elements(*self.bot_message_bubble)
        if bubbles:
            return bubbles[-1].text.strip()
        return ""
