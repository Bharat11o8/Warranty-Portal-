import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time
import os

def geocode_stores(input_file, output_file):
    print(f"Reading {input_file}...")
    df = pd.read_excel(input_file)
    
    # Initialize geocoder
    geolocator = Nominatim(user_agent="store_geocoder_antigravity")
    
    latitudes = []
    longitudes = []
    
    total = len(df)
    print(f"Starting geocoding for {total} stores...")
    
    for index, row in df.iterrows():
        # Construct address string
        # Columns: 'ADDRESS', 'CITY', 'STATES'
        address = str(row.get('ADDRESS', ''))
        city = str(row.get('CITY', ''))
        state = str(row.get('STATES', ''))
        
        full_address = f"{address}, {city}, {state}, India"
        
        print(f"[{index+1}/{total}] Geocoding: {row.get('STORE NAME', 'Unknown')}")
        
        try:
            location = geolocator.geocode(full_address, timeout=10)
            if location:
                latitudes.append(location.latitude)
                longitudes.append(location.longitude)
                print(f"   Success: {location.latitude}, {location.longitude}")
            else:
                # Try a broader search if full address fails
                broader_address = f"{city}, {state}, India"
                location = geolocator.geocode(broader_address, timeout=10)
                if location:
                    latitudes.append(location.latitude)
                    longitudes.append(location.longitude)
                    print(f"   Approximate (City/State): {location.latitude}, {location.longitude}")
                else:
                    latitudes.append(None)
                    longitudes.append(None)
                    print("   Failed.")
        except GeocoderTimedOut:
            print("   Timeout. Skipping.")
            latitudes.append(None)
            longitudes.append(None)
        except Exception as e:
            print(f"   Error: {e}")
            latitudes.append(None)
            longitudes.append(None)
            
        # Respect Nominatim's usage policy (max 1 request per second)
        time.sleep(1.1)

    df['LATITUDE'] = latitudes
    df['LONGITUDE'] = longitudes
    
    print(f"Saving results to {output_file}...")
    df.to_excel(output_file, index=False)
    print("Done!")

if __name__ == "__main__":
    input_path = "Book1.xlsx"
    output_path = "Book1_geocoded.xlsx"
    
    if os.path.exists(input_path):
        geocode_stores(input_path, output_path)
    else:
        print(f"Error: {input_path} not found.")
