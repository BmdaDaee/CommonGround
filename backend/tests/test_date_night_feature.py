"""
Test Date Night Generator Feature - CommonGround App
Tests the new Date Night Generator endpoints:
- POST /api/date-night/generate - Generate personalized date night ideas
- GET /api/date-night/history - Get date night history
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
TEST_EMAIL = "testuser@commonground.app"
TEST_PASSWORD = "TestPass123!"

# Supabase auth
SUPABASE_URL = "https://tlmtewyvzirdqjdlivis.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_I9C8wpimPtGEOvaATngfkg_PxmjXaPR"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token via Supabase"""
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
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    data = response.json()
    return data.get("access_token")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestHealthAndPublicEndpoints:
    """Test public endpoints work without auth"""
    
    def test_health_endpoint(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] == True
        assert data["service"] == "commonground-api"
        assert data["ai"] == "BentlyAI"
        print("✓ Health endpoint working")
    
    def test_zodiac_signs_public(self):
        """GET /api/zodiac-signs is public"""
        response = requests.get(f"{BASE_URL}/api/zodiac-signs")
        assert response.status_code == 200
        data = response.json()
        assert "signs" in data
        assert "aries" in data["signs"]
        print("✓ Zodiac signs endpoint working")


class TestAuthFlow:
    """Test authentication works"""
    
    def test_auth_session(self, api_client):
        """POST /api/auth/session creates/returns user session"""
        response = api_client.post(f"{BASE_URL}/api/auth/session")
        assert response.status_code == 200
        data = response.json()
        assert "uid" in data
        assert "user" in data
        print(f"✓ Auth session working - User: {data['user'].get('display_name', 'Unknown')}")
    
    def test_profile_get(self, api_client):
        """GET /api/profile returns user profile"""
        response = api_client.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data["email"] == TEST_EMAIL
        assert data.get("onboarding_complete") == True, "User should be onboarded"
        print(f"✓ Profile endpoint working - Onboarded: {data.get('onboarding_complete')}")


class TestDateNightGenerator:
    """Test Date Night Generator feature - NEW P3 FEATURE"""
    
    def test_date_night_generate_romantic_home(self, api_client):
        """POST /api/date-night/generate with romantic mood, medium budget, home location"""
        response = api_client.post(
            f"{BASE_URL}/api/date-night/generate",
            json={
                "mood": "romantic",
                "budget": "medium",
                "location": "home"
            },
            timeout=60  # AI generation can take time
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "date_night" in data, "Response should contain date_night object"
        date_night = data["date_night"]
        
        # Verify required fields
        assert "title" in date_night, "Date night should have title"
        assert "description" in date_night or len(date_night) > 1, "Date night should have description or content"
        
        print(f"✓ Date Night generated: {date_night.get('title', 'Untitled')}")
        print(f"  Description: {date_night.get('description', 'N/A')[:100]}...")
        
        # Check optional but expected fields
        if "steps" in date_night:
            print(f"  Steps: {len(date_night['steps'])} steps")
        if "food_idea" in date_night:
            print(f"  Food idea: {date_night['food_idea'][:50]}...")
        if "conversation_starter" in date_night:
            print(f"  Conversation starter: {date_night['conversation_starter'][:50]}...")
    
    def test_date_night_generate_adventurous(self, api_client):
        """POST /api/date-night/generate with adventurous mood"""
        response = api_client.post(
            f"{BASE_URL}/api/date-night/generate",
            json={
                "mood": "adventurous",
                "budget": "low",
                "location": "nearby"
            },
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        assert "date_night" in data
        print(f"✓ Adventurous date generated: {data['date_night'].get('title', 'Untitled')}")
    
    def test_date_night_history(self, api_client):
        """GET /api/date-night/history returns history array"""
        response = api_client.get(f"{BASE_URL}/api/date-night/history")
        assert response.status_code == 200
        data = response.json()
        
        assert "history" in data, "Response should contain history array"
        assert isinstance(data["history"], list), "History should be a list"
        
        # After generating dates above, history should have entries
        if len(data["history"]) > 0:
            entry = data["history"][0]
            assert "id" in entry, "History entry should have id"
            assert "mood" in entry, "History entry should have mood"
            assert "budget" in entry, "History entry should have budget"
            assert "location" in entry, "History entry should have location"
            assert "idea" in entry, "History entry should have idea"
            assert "created_at" in entry, "History entry should have created_at"
            print(f"✓ Date Night history working - {len(data['history'])} entries")
            print(f"  Latest: {entry['idea'].get('title', 'Untitled')} ({entry['mood']}, {entry['budget']}, {entry['location']})")
        else:
            print("✓ Date Night history endpoint working (empty history)")
    
    def test_date_night_requires_auth(self):
        """Date Night endpoints require authentication"""
        # Test generate without auth
        response = requests.post(
            f"{BASE_URL}/api/date-night/generate",
            json={"mood": "romantic", "budget": "medium", "location": "home"}
        )
        assert response.status_code == 401, "Generate should require auth"
        
        # Test history without auth
        response = requests.get(f"{BASE_URL}/api/date-night/history")
        assert response.status_code == 401, "History should require auth"
        
        print("✓ Date Night endpoints properly require authentication")


class TestExistingFeatures:
    """Spot check existing P0/P1/P2 features still work"""
    
    def test_daily_question(self, api_client):
        """GET /api/daily-question returns question"""
        response = api_client.get(f"{BASE_URL}/api/daily-question")
        assert response.status_code == 200
        data = response.json()
        assert "question" in data
        assert "category" in data
        print(f"✓ Daily question working: {data['question'][:50]}...")
    
    def test_streak(self, api_client):
        """GET /api/streak returns streak data"""
        response = api_client.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 200
        data = response.json()
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "total_days" in data
        print(f"✓ Streak working: {data['current_streak']} day streak")
    
    def test_partner_chat_messages(self, api_client):
        """GET /api/partner-chat/messages returns messages"""
        response = api_client.get(f"{BASE_URL}/api/partner-chat/messages")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Partner chat working: {len(data['messages'])} messages")
    
    def test_shared_playlist(self, api_client):
        """GET /api/shared-playlist returns songs"""
        response = api_client.get(f"{BASE_URL}/api/shared-playlist")
        assert response.status_code == 200
        data = response.json()
        assert "songs" in data
        assert isinstance(data["songs"], list)
        print(f"✓ Shared playlist working: {len(data['songs'])} songs")
    
    def test_milestones(self, api_client):
        """GET /api/milestones returns milestones"""
        response = api_client.get(f"{BASE_URL}/api/milestones")
        assert response.status_code == 200
        data = response.json()
        assert "milestones" in data
        assert isinstance(data["milestones"], list)
        print(f"✓ Milestones working: {len(data['milestones'])} milestones")
    
    def test_love_language_results(self, api_client):
        """GET /api/love-language/results returns results"""
        response = api_client.get(f"{BASE_URL}/api/love-language/results")
        assert response.status_code == 200
        data = response.json()
        assert "completed" in data
        if data["completed"]:
            assert "primary" in data
            assert "primary_label" in data
            print(f"✓ Love language working: Primary = {data['primary_label']}")
        else:
            print("✓ Love language endpoint working (quiz not completed)")
    
    def test_deeply_unlocked(self, api_client):
        """GET /api/deeply/prompts works if unlocked"""
        response = api_client.get(f"{BASE_URL}/api/deeply/prompts")
        # Should be 200 if unlocked, 403 if locked
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            assert "prompts" in data
            print(f"✓ DeeplyUs unlocked: {len(data['prompts'])} prompts available")
        else:
            print("✓ DeeplyUs endpoint working (locked)")
    
    def test_pair_info(self, api_client):
        """GET /api/pairs/me returns pair info"""
        response = api_client.get(f"{BASE_URL}/api/pairs/me")
        assert response.status_code == 200
        data = response.json()
        assert "pair" in data
        if data["pair"]:
            assert data["pair"]["status"] in ["ACTIVE", "PENDING"], f"Unexpected status: {data['pair']['status']}"
            print(f"✓ Pair info working: Status = {data['pair']['status']}")
        else:
            print("✓ Pair endpoint working (not paired)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
