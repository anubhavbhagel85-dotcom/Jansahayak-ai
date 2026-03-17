import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import time

def scrape_myscheme():
    """Scrapes scheme data from MyScheme.gov.in API"""
    schemes = []
    
    # MyScheme.gov.in has a public API
    url = "https://www.myscheme.gov.in/api/v1/schemes"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            for scheme in data.get("schemes", []):
                schemes.append({
                    "scheme_name": scheme.get("schemeName", ""),
                    "ministry": scheme.get("ministry", ""),
                    "category": scheme.get("category", ""),
                    "eligibility_age_min": scheme.get("minAge", 0),
                    "eligibility_age_max": scheme.get("maxAge", 99),
                    "eligibility_income_max": scheme.get("maxIncome", 0),
                    "eligibility_caste": scheme.get("caste", "All"),
                    "eligibility_state": scheme.get("state", "All"),
                    "benefits": scheme.get("benefits", ""),
                    "how_to_apply": scheme.get("applicationProcess", ""),
                    "portal_link": scheme.get("schemeUrl", ""),
                })
    except Exception as e:
        print(f"API scraping failed: {e}")
        # Fall back to web scraping
        schemes = scrape_fallback()
    
    return schemes


def scrape_fallback():
    """Fallback web scraper if API fails"""
    schemes = []
    urls = [
        "https://www.myscheme.gov.in/schemes",
        "https://scholarships.gov.in/public/schemePublic",
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
    
    for url in urls:
        try:
            res = requests.get(url, headers=headers, timeout=15)
            soup = BeautifulSoup(res.text, "html.parser")
            
            # Extract scheme cards
            cards = soup.find_all("div", class_="scheme-card")
            for card in cards:
                name = card.find("h3")
                benefit = card.find("p", class_="benefit")
                link = card.find("a")
                
                if name:
                    schemes.append({
                        "scheme_name": name.text.strip(),
                        "ministry": "Government of India",
                        "category": "General",
                        "eligibility_age_min": 18,
                        "eligibility_age_max": 99,
                        "eligibility_income_max": 0,
                        "eligibility_caste": "All",
                        "eligibility_state": "All",
                        "benefits": benefit.text.strip() if benefit else "",
                        "how_to_apply": "Visit official portal",
                        "portal_link": link["href"] if link else url,
                    })
            time.sleep(2)  # Be respectful to the server
        except Exception as e:
            print(f"Scraping {url} failed: {e}")
    
    return schemes


def update_schemes_database():
    """Main function — scrapes and updates the CSV + ChromaDB"""
    print("Starting autonomous scheme scraping...")
    
    # Scrape fresh data
    new_schemes = scrape_myscheme()
    
    if not new_schemes:
        print("No new schemes scraped. Keeping existing data.")
        return
    
    # Load existing data
    csv_path = os.path.join(os.path.dirname(__file__), "schemes_data.csv")
    
    if os.path.exists(csv_path):
        existing_df = pd.read_csv(csv_path)
        existing_names = set(existing_df["scheme_name"].tolist())
    else:
        existing_df = pd.DataFrame()
        existing_names = set()
    
    # Add only new schemes
    new_df = pd.DataFrame(new_schemes)
    truly_new = new_df[~new_df["scheme_name"].isin(existing_names)]
    
    if len(truly_new) > 0:
        combined = pd.concat([existing_df, truly_new], ignore_index=True)
        combined.to_csv(csv_path, index=False)
        print(f"Added {len(truly_new)} new schemes. Total: {len(combined)}")
        
        # Reload ChromaDB with new data
        from schemes.vector_store import reload_schemes
        reload_schemes()
    else:
        print("No new schemes found.")


if __name__ == "__main__":
    update_schemes_database()