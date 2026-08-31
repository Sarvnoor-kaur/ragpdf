from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class DashboardPage:
    def __init__(self, driver):
        self.driver = driver
        
        # Locators
        self.welcome_message = (By.XPATH, "//h2[contains(text(), 'Welcome')]")
        self.logout_button = (By.CSS_SELECTOR, '[data-testid="logout-button"]')
        self.go_to_documents_button = (By.ID, "go-to-documents")
        self.go_to_chat_button = (By.CSS_SELECTOR, '[data-testid="go-to-chat"]')

    def is_dashboard_loaded(self):
        try:
            WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located(self.welcome_message)
            )
            return True
        except:
            return False

    def logout(self):
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(self.logout_button)
        ).click()

    def go_to_documents(self):
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(self.go_to_documents_button)
        ).click()

    def go_to_chat(self):
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(self.go_to_chat_button)
        ).click()
