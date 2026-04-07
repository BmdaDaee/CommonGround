"""
CommonGround API Tests
Tests for all backend API endpoints including:
- Health check
- Auth/Profile
- Pairing system
- Daily questions
- Trust exercises
- Growth modules
- DeeplyUs features
- Chat/AI integration
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://common-ground-app.preview.emergentagent.com')

# Test credentials from test_credentials.md
TEST_EMAIL = "testuser@commonground.app"
TEST_PASSWORD = "TestPass123!"

# Supabase config
SUPABASE_URL = "https://tlmtewyvzirdqjdlivis.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_I9C8wpimPtGEOvaATngfkg_PxmjXaPR"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token from Supabase"""
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json"
            },
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"Auth failed: {response.status_code} - {response.text}")
            pytest.skip("Authentication failed - skipping authenticated tests")
    except Exception as e:
        print(f"Auth error: {e}")
        pytest.skip(f"Authentication error: {e}")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthEndpoints:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self, api_client):
        """Test /api/health returns ok"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] == True
        assert data["service"] == "commonground-api"
        assert data["ai"] == "BentlyAI"
        print("✅ Health endpoint working")
    
    def test_root_endpoint(self, api_client):
        """Test /api/ returns status"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "message" in data
        print("✅ Root endpoint working")


class TestAuthProtection:
    """Test that protected endpoints require authentication"""
    
    def test_profile_requires_auth(self, api_client):
        """Test /api/profile returns 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/profile")
        assert response.status_code in [401, 403]
        print("✅ Profile endpoint protected")
    
    def test_daily_question_requires_auth(self, api_client):
        """Test /api/daily-question returns 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/daily-question")
        assert response.status_code in [401, 403]
        print("✅ Daily question endpoint protected")
    
    def test_deeply_prompts_requires_auth(self, api_client):
        """Test /api/deeply/prompts returns 401 without auth"""
        response = api_client.get(f"{BASE_URL}/api/deeply/prompts")
        assert response.status_code in [401, 403]
        print("✅ DeeplyUs prompts endpoint protected")


class TestAuthenticatedEndpoints:
    """Tests for authenticated endpoints"""
    
    def test_create_session(self, authenticated_client):
        """Test /api/auth/session creates/returns user session"""
        response = authenticated_client.post(f"{BASE_URL}/api/auth/session")
        assert response.status_code == 200
        data = response.json()
        assert "uid" in data
        assert "user" in data
        print(f"✅ Session created for user: {data.get('uid', 'unknown')[:8]}...")
    
    def test_get_profile(self, authenticated_client):
        """Test /api/profile returns user profile"""
        response = authenticated_client.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200
        data = response.json()
        assert "supabase_uid" in data
        assert "email" in data
        print(f"✅ Profile retrieved: {data.get('display_name', 'No name')}")
    
    def test_get_daily_question(self, authenticated_client):
        """Test /api/daily-question returns a question"""
        response = authenticated_client.get(f"{BASE_URL}/api/daily-question")
        assert response.status_code == 200
        data = response.json()
        assert "question" in data
        assert "category" in data
        print(f"✅ Daily question: {data.get('category', 'unknown')} - {data.get('question', '')[:50]}...")
    
    def test_get_zodiac_signs(self, authenticated_client):
        """Test /api/zodiac-signs returns all signs"""
        response = authenticated_client.get(f"{BASE_URL}/api/zodiac-signs")
        assert response.status_code == 200
        data = response.json()
        assert "signs" in data
        assert len(data["signs"]) == 12
        print(f"✅ Zodiac signs retrieved: {len(data['signs'])} signs")
    
    def test_get_trust_exercises(self, authenticated_client):
        """Test /api/trust-exercises returns exercises"""
        response = authenticated_client.get(f"{BASE_URL}/api/trust-exercises")
        assert response.status_code == 200
        data = response.json()
        assert "exercises" in data
        assert len(data["exercises"]) > 0
        print(f"✅ Trust exercises retrieved: {len(data['exercises'])} exercises")
    
    def test_get_modules(self, authenticated_client):
        """Test /api/modules returns growth modules"""
        response = authenticated_client.get(f"{BASE_URL}/api/modules")
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        assert len(data["modules"]) > 0
        print(f"✅ Growth modules retrieved: {len(data['modules'])} modules")
    
    def test_get_favorites(self, authenticated_client):
        """Test /api/favorites returns user favorites"""
        response = authenticated_client.get(f"{BASE_URL}/api/favorites")
        assert response.status_code == 200
        data = response.json()
        assert "favorites" in data
        print(f"✅ Favorites retrieved")


class TestPairingSystem:
    """Tests for pairing system"""
    
    def test_get_my_pair(self, authenticated_client):
        """Test /api/pairs/me returns pair info"""
        response = authenticated_client.get(f"{BASE_URL}/api/pairs/me")
        assert response.status_code == 200
        data = response.json()
        # May or may not have a pair
        if data.get("pair"):
            print(f"✅ Pair found: {data['pair'].get('code', 'no code')}")
        else:
            print("✅ No pair found (expected for unpaired user)")


class TestDeeplyUsFeatures:
    """Tests for DeeplyUs intimate mode features"""
    
    def test_unlock_deeply(self, authenticated_client):
        """Test /api/deeply/unlock unlocks DeeplyUs mode"""
        response = authenticated_client.post(f"{BASE_URL}/api/deeply/unlock")
        assert response.status_code == 200
        data = response.json()
        assert data.get("unlocked") == True
        print("✅ DeeplyUs unlocked")
    
    def test_get_deeply_prompts(self, authenticated_client):
        """Test /api/deeply/prompts returns prompts (after unlock)"""
        # First unlock
        authenticated_client.post(f"{BASE_URL}/api/deeply/unlock")
        
        response = authenticated_client.get(f"{BASE_URL}/api/deeply/prompts")
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data
        assert len(data["prompts"]) > 0
        
        # Check categories
        categories = set(p["category"] for p in data["prompts"])
        expected_categories = {"fantasy", "desire", "insecurity", "exploration", "connection", "aftercare"}
        assert categories == expected_categories
        print(f"✅ DeeplyUs prompts retrieved: {len(data['prompts'])} prompts in {len(categories)} categories")
    
    def test_get_deeply_exercises(self, authenticated_client):
        """Test /api/deeply/exercises returns exercises"""
        # First unlock
        authenticated_client.post(f"{BASE_URL}/api/deeply/unlock")
        
        response = authenticated_client.get(f"{BASE_URL}/api/deeply/exercises")
        assert response.status_code == 200
        data = response.json()
        assert "exercises" in data
        assert len(data["exercises"]) > 0
        print(f"✅ DeeplyUs exercises retrieved: {len(data['exercises'])} exercises")
    
    def test_create_deeply_item(self, authenticated_client):
        """Test /api/deeply/items creates a new item"""
        # First unlock
        authenticated_client.post(f"{BASE_URL}/api/deeply/unlock")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/deeply/items",
            json={
                "item_type": "fantasy",
                "text": "TEST_fantasy_item_for_testing",
                "shared_with_partner": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "item" in data
        assert data["item"]["item_type"] == "fantasy"
        assert data["item"]["text"] == "TEST_fantasy_item_for_testing"
        print("✅ DeeplyUs item created")
    
    def test_get_deeply_items(self, authenticated_client):
        """Test /api/deeply/items returns user items"""
        # First unlock
        authenticated_client.post(f"{BASE_URL}/api/deeply/unlock")
        
        response = authenticated_client.get(f"{BASE_URL}/api/deeply/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✅ DeeplyUs items retrieved: {len(data['items'])} items")


class TestAIChatFeatures:
    """Tests for AI chat and task features"""
    
    def test_ai_chat(self, authenticated_client):
        """Test /api/chat sends message to BentlyAI"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat",
            json={
                "message": "Hello, this is a test message",
                "mode": "commonground",
                "vibe": "realtalk"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert "sessionId" in data
        assert len(data["reply"]) > 0
        print(f"✅ AI chat response received: {data['reply'][:50]}...")
    
    def test_ai_chat_deeplyus_mode(self, authenticated_client):
        """Test /api/chat in DeeplyUs mode"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat",
            json={
                "message": "Test message in DeeplyUs mode",
                "mode": "deeplyus",
                "vibe": "soft"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        print(f"✅ AI chat (DeeplyUs mode) response received")
    
    def test_deeply_ignite(self, authenticated_client):
        """Test /api/deeply/ignite generates intimate suggestion"""
        # First unlock
        authenticated_client.post(f"{BASE_URL}/api/deeply/unlock")
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/deeply/ignite",
            params={"context": "Looking for something fun", "vibe": "realtalk"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestion" in data
        assert len(data["suggestion"]) > 0
        print(f"✅ Ignite suggestion received: {data['suggestion'][:50]}...")


class TestCalendarAndLists:
    """Tests for calendar and list features"""
    
    def test_get_calendar_events(self, authenticated_client):
        """Test /api/calendar/events returns events"""
        response = authenticated_client.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        print(f"✅ Calendar events retrieved: {len(data['events'])} events")
    
    def test_get_shopping_list(self, authenticated_client):
        """Test /api/lists/shopping returns shopping list"""
        response = authenticated_client.get(f"{BASE_URL}/api/lists/shopping")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✅ Shopping list retrieved: {len(data['items'])} items")
    
    def test_get_wishlist(self, authenticated_client):
        """Test /api/lists/wishlist returns wishlist"""
        response = authenticated_client.get(f"{BASE_URL}/api/lists/wishlist")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"✅ Wishlist retrieved: {len(data['items'])} items")


class TestJournalFeatures:
    """Tests for journal/confessional features"""
    
    def test_get_journal_entries(self, authenticated_client):
        """Test /api/journal returns journal entries"""
        response = authenticated_client.get(f"{BASE_URL}/api/journal")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        print(f"✅ Journal entries retrieved: {len(data['entries'])} entries")
    
    def test_create_journal_entry(self, authenticated_client):
        """Test /api/journal creates new entry"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/journal",
            json={"text": "TEST_journal_entry_for_testing"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "entry" in data
        assert data["entry"]["text"] == "TEST_journal_entry_for_testing"
        print("✅ Journal entry created")


class TestHoroscopeFeatures:
    """Tests for horoscope and astrology features"""
    
    def test_get_horoscope(self, authenticated_client):
        """Test /api/horoscope returns daily horoscope"""
        response = authenticated_client.get(f"{BASE_URL}/api/horoscope")
        assert response.status_code == 200
        data = response.json()
        assert "content" in data or "sign" in data
        print(f"✅ Horoscope retrieved for sign: {data.get('sign', 'unknown')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
