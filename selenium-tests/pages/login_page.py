from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        
        # Locators
        self.email_input = (By.CSS_SELECTOR, '[data-testid="login-email"]')
        self.password_input = (By.CSS_SELECTOR, '[data-testid="login-password"]')
        self.submit_button = (By.CSS_SELECTOR, '[data-testid="login-submit"]')
        self.error_message = (By.XPATH, "//*[contains(text(), 'Invalid credentials') or contains(text(), 'fill in all fields')]")

    def load(self, base_url):
        self.driver.get(f"{base_url}/login")

    def login(self, email, password):
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located(self.email_input)
        ).send_keys(email)
        
        self.driver.find_element(*self.password_input).send_keys(password)
        
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(self.submit_button)
        ).click()

    def get_error_message(self):
        element = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located(self.error_message)
        )
        return element.text
