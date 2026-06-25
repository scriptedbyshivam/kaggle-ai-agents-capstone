import sys
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("AtlasOneMCP")

@mcp.tool()
def get_weather_advisory(city: str) -> str:
    """Get weather conditions, typical temperatures, and packing recommendations for a city.

    Args:
        city: The name of the city to get weather advisory for.
    """
    city_lower = city.lower().strip()
    if "paris" in city_lower:
        return "Paris Weather: 18°C to 24°C, occasional light showers. Recommendation: Bring a light jacket and umbrella."
    elif "tokyo" in city_lower:
        return "Tokyo Weather: 22°C to 29°C, humid. Recommendation: Pack breathable clothing and comfortable walking shoes."
    elif "new york" in city_lower or "nyc" in city_lower:
        return "New York Weather: 15°C to 22°C, windy but clear. Recommendation: Pack layers and sunglasses."
    elif "san francisco" in city_lower or "sf" in city_lower:
        return "San Francisco Weather: 13°C to 18°C, foggy. Recommendation: Bring a windbreaker; dress in layers."
    return f"Weather advisory for {city}: Typical seasonal temperatures. Check current local conditions before arrival."

@mcp.tool()
def get_local_restrictions(city: str) -> str:
    """Get travel safety guidelines, local restrictions, visa requirements, or cultural tips.

    Args:
        city: The name of the destination city.
    """
    city_lower = city.lower().strip()
    if "paris" in city_lower:
        return "Paris Guidelines: EU visa rules apply. Pedestrian zones are active in the city center. Tipping is appreciated but not mandatory (service included)."
    elif "tokyo" in city_lower:
        return "Tokyo Guidelines: Cache is widely preferred; keep yen bills ready. Do not walk and eat at the same time. Keep left on escalators."
    elif "new york" in city_lower or "nyc" in city_lower:
        return "New York Guidelines: Subway operates 24/7. Standard US tipping (15-20%) is expected in restaurants. Carry valid photo ID."
    elif "san francisco" in city_lower or "sf" in city_lower:
        return "San Francisco Guidelines: Clean Air vehicle zones apply. Use public transit (MUNI/BART) where possible. Be aware of hilly walking routes."
    return f"General advisory for {city}: standard visa rules apply. Keep a copy of your passport. Respect local customs."

@mcp.tool()
def search_top_attractions(city: str) -> str:
    """Get the top 3 popular points of interest and landmarks for a city.

    Args:
        city: The name of the city to search attractions for.
    """
    city_lower = city.lower().strip()
    if "paris" in city_lower:
        return "Top Attractions in Paris: 1. Eiffel Tower, 2. Louvre Museum, 3. Seine River Cruise."
    elif "tokyo" in city_lower:
        return "Top Attractions in Tokyo: 1. Senso-ji Temple, 2. Shibuya Crossing, 3. Tokyo Skytree."
    elif "new york" in city_lower or "nyc" in city_lower:
        return "Top Attractions in New York: 1. Central Park, 2. Statue of Liberty, 3. Times Square."
    elif "san francisco" in city_lower or "sf" in city_lower:
        return "Top Attractions in San Francisco: 1. Golden Gate Bridge, 2. Alcatraz Island, 3. Fisherman's Wharf."
    return f"Top Attractions in {city}: 1. Historic Old Town/City Center, 2. Local Market/Bazaar, 3. Scenic Viewpoint."

if __name__ == "__main__":
    mcp.run()
