from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

class SignupPage:
    def __init__(self, driver):
        self.driver = driver
        
        # Locators
        self.name_input = (By.CSS_SELECTOR, '[data-testid="register-name"]')
        self.email_input = (By.CSS_SELECTOR, '[data-testid="register-email"]')
        self.password_input = (By.CSS_SELECTOR, '[data-testid="register-password"]')
        self.role_select = (By.CSS_SELECTOR, '[data-testid="register-role"]')
        self.department_select = (By.CSS_SELECTOR, '[data-testid="register-department"]')
        self.submit_button = (By.CSS_SELECTOR, '[data-testid="register-submit"]')

    def load(self, base_url):
        self.driver.get(f"{base_url}/register")

    def register(self, name, email, password, role="employee", department="Engineering"):
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located(self.name_input)
        ).send_keys(name)
        
        self.driver.find_element(*self.email_input).send_keys(email)
        self.driver.find_element(*self.password_input).send_keys(password)
        
        Select(self.driver.find_element(*self.role_select)).select_by_value(role)
        Select(self.driver.find_element(*self.department_select)).select_by_value(department)
        
        WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(self.submit_button)
        ).click()
