import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
def test_homepage_loads(driver, base_url):
    """Load the landing page and verify key elements are visible."""
    driver.get(base_url)

    # Wait for the hero h1 to be visible
    hero_heading = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located(
            (By.XPATH,
             "//h1[contains(text(), 'Turn your documents')]"
             " | //h1[contains(., 'intelligent knowledge base')]")
        )
    )
    assert hero_heading.is_displayed(), "Hero heading was not visible on the homepage"


@pytest.mark.e2e
def test_homepage_has_login_link(driver, base_url):
    """The navbar must contain a Login / Log In link."""
    driver.get(base_url)

    login_link = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//a[@href='/login']"))
    )
    assert login_link.is_displayed(), "Login link not found on the homepage navbar"


@pytest.mark.e2e
def test_homepage_has_register_link(driver, base_url):
    """The navbar / hero must contain a Register / Get Started link."""
    driver.get(base_url)

    register_link = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.XPATH, "//a[@href='/register']"))
    )
    assert register_link.is_displayed(), "Register link not found on the homepage"
