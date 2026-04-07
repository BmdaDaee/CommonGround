"""
Test Suite for CommonGround Iteration 7 - New App Flow
Tests: Auth -> BasicSetup -> Pairing -> Onboarding -> MainApp

Features tested:
- Auth session with migration logic (basic_setup_complete auto-set for existing onboarded users)
- PUT /api/profile with basic_setup_complete field
- Pairing endpoints (create, join, get)
- Profile update with onboarding_complete field
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SUPABASE_URL = os.environ.get('REACT_APP_SUPABASE_URL', 'https://tlmtewyvzirdqjdlivis.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('REACT_APP_SUPABASE_ANON_KEY', 'sb_publishable_I9C8wpimPtGEOvaATngfkg_PxmjXaPR')

# Test credentials
TEST_EMAIL = "testuser@commonground.app"
TEST_PASSWORD = "TestPass123!"


def get_auth_token():
    """Get Supabase auth token for test user"""
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
        return response.json().get("access_token")
    print(f"Auth failed: {response.status_code} - {response.text}")
    return None


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token once for all tests"""
    token = get_auth_token()
    if not token:
        pytest.skip("Could not authenticate - skipping tests")
    return token


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health_returns_ok(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert data.get("ai") == "BentlyAI"
        print("✓ Health endpoint working")


class TestAuthSession:
    """Test auth/session endpoint with migration logic"""
    
    def test_auth_session_returns_user_profile(self, auth_headers):
        """POST /api/auth/session should return user profile with basic_setup_complete"""
        response = requests.post(f"{BASE_URL}/api/auth/session", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "uid" in data
        assert "user" in data
        
        user = data["user"]
        assert "basic_setup_complete" in user
        assert "onboarding_complete" in user
        print(f"✓ Auth session returns user with basic_setup_complete={user.get('basic_setup_complete')}, onboarding_complete={user.get('onboarding_complete')}")
    
    def test_migration_logic_for_existing_onboarded_user(self, auth_headers):
        """Existing user with onboarding_complete=true should auto-get basic_setup_complete=true"""
        response = requests.post(f"{BASE_URL}/api/auth/session", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        user = data["user"]
        # Test user is already onboarded, so migration should have set basic_setup_complete
        if user.get("onboarding_complete"):
            assert user.get("basic_setup_complete") == True, \
                "Migration failed: onboarded user should have basic_setup_complete=true"
            print("✓ Migration logic working: onboarded user has basic_setup_complete=true")
        else:
            print("⚠ User not onboarded, migration logic not applicable")
    
    def test_auth_session_returns_pair_info(self, auth_headers):
        """Auth session should return pair info if user is paired"""
        response = requests.post(f"{BASE_URL}/api/auth/session", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Test user should be paired
        if data.get("pair"):
            pair = data["pair"]
            assert "id" in pair
            assert "status" in pair
            print(f"✓ Auth session returns pair info: status={pair.get('status')}")
        else:
            print("⚠ User not paired")


class TestProfileEndpoints:
    """Test profile CRUD with new fields"""
    
    def test_get_profile_has_new_fields(self, auth_headers):
        """GET /api/profile should return basic_setup_complete and onboarding_complete"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "basic_setup_complete" in data
        assert "onboarding_complete" in data
        assert "gender" in data
        assert "partner_gender" in data
        assert "ethnicity" in data
        print(f"✓ Profile has all required fields: basic_setup_complete={data.get('basic_setup_complete')}")
    
    def test_update_profile_basic_setup_complete(self, auth_headers):
        """PUT /api/profile should accept basic_setup_complete field"""
        # First get current state
        get_response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        original_value = get_response.json().get("basic_setup_complete")
        
        # Update to true
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"basic_setup_complete": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("basic_setup_complete") == True
        print("✓ PUT /api/profile accepts basic_setup_complete=true")
        
        # Verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert verify_response.json().get("basic_setup_complete") == True
        print("✓ basic_setup_complete persisted correctly")
    
    def test_update_profile_display_name(self, auth_headers):
        """PUT /api/profile should accept display_name (used in BasicSetup)"""
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"display_name": "TestUser"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("display_name") == "TestUser"
        print("✓ PUT /api/profile accepts display_name")
    
    def test_update_profile_birth_date(self, auth_headers):
        """PUT /api/profile should accept birth_date (used in BasicSetup)"""
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"birth_date": "1990-05-15"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("birth_date") == "1990-05-15"
        print("✓ PUT /api/profile accepts birth_date")
    
    def test_update_profile_onboarding_complete(self, auth_headers):
        """PUT /api/profile should accept onboarding_complete field"""
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"onboarding_complete": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("onboarding_complete") == True
        print("✓ PUT /api/profile accepts onboarding_complete=true")
    
    def test_update_profile_gender_fields(self, auth_headers):
        """PUT /api/profile should accept gender and partner_gender"""
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"gender": "woman", "partner_gender": "woman"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("gender") == "woman"
        assert data.get("partner_gender") == "woman"
        print("✓ PUT /api/profile accepts gender and partner_gender")
    
    def test_update_profile_ethnicity(self, auth_headers):
        """PUT /api/profile should accept ethnicity"""
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={"ethnicity": "latino"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ethnicity") == "latino"
        print("✓ PUT /api/profile accepts ethnicity")


class TestPairingEndpoints:
    """Test pairing system endpoints"""
    
    def test_get_my_pair(self, auth_headers):
        """GET /api/pairs/me should return pair info"""
        response = requests.get(f"{BASE_URL}/api/pairs/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Response should have pair key
        assert "pair" in data
        
        if data.get("pair"):
            pair = data["pair"]
            assert "id" in pair
            assert "code" in pair
            assert "status" in pair
            assert "member_a_uid" in pair
            print(f"✓ GET /api/pairs/me returns pair: code={pair.get('code')}, status={pair.get('status')}")
        else:
            print("⚠ User has no active pair")
    
    def test_create_pair_returns_code(self, auth_headers):
        """POST /api/pairs/create should return a 6-char code"""
        response = requests.post(f"{BASE_URL}/api/pairs/create", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should return pair and code
        assert "pair" in data or "code" in data or "already_exists" in data
        
        if data.get("already_exists"):
            print(f"✓ User already has a pair (already_exists=true)")
        elif data.get("code"):
            code = data["code"]
            assert len(code) == 6, f"Code should be 6 chars, got {len(code)}"
            assert code.isalnum(), "Code should be alphanumeric"
            print(f"✓ POST /api/pairs/create returns 6-char code: {code}")
        else:
            # Check if pair has code
            pair = data.get("pair", {})
            if pair.get("code"):
                assert len(pair["code"]) == 6
                print(f"✓ Pair created with code: {pair['code']}")
    
    def test_join_pair_invalid_code(self, auth_headers):
        """POST /api/pairs/join with invalid code should return error"""
        response = requests.post(
            f"{BASE_URL}/api/pairs/join",
            headers=auth_headers,
            json={"code": "XXXXXX"}
        )
        # Should return 400 or 404 for invalid code
        assert response.status_code in [400, 404]
        print(f"✓ POST /api/pairs/join with invalid code returns {response.status_code}")


class TestZodiacEndpoint:
    """Test zodiac signs endpoint (public)"""
    
    def test_get_zodiac_signs(self):
        """GET /api/zodiac-signs should return all 12 signs"""
        response = requests.get(f"{BASE_URL}/api/zodiac-signs")
        assert response.status_code == 200
        data = response.json()
        
        assert "signs" in data
        signs = data["signs"]
        assert len(signs) == 12
        
        # Check for expected signs
        expected_signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", 
                         "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]
        for sign in expected_signs:
            assert sign in signs, f"Missing sign: {sign}"
        
        print(f"✓ GET /api/zodiac-signs returns all 12 signs")


class TestExistingUserFlow:
    """Test that existing paired+onboarded user lands on HomeScreen"""
    
    def test_existing_user_has_all_flags_set(self, auth_headers):
        """Existing test user should have basic_setup_complete, onboarding_complete, and pair"""
        # Get session
        session_response = requests.post(f"{BASE_URL}/api/auth/session", headers=auth_headers)
        assert session_response.status_code == 200
        session_data = session_response.json()
        
        user = session_data.get("user", {})
        pair = session_data.get("pair")
        
        # Check all conditions for landing on HomeScreen
        basic_setup = user.get("basic_setup_complete")
        onboarding = user.get("onboarding_complete")
        has_pair = pair is not None and pair.get("status") == "ACTIVE"
        
        print(f"User state: basic_setup_complete={basic_setup}, onboarding_complete={onboarding}, has_active_pair={has_pair}")
        
        # For existing test user, all should be true
        assert basic_setup == True, "Test user should have basic_setup_complete=true"
        assert onboarding == True, "Test user should have onboarding_complete=true"
        assert has_pair == True, "Test user should have an active pair"
        
        print("✓ Existing test user has all flags set - should land on HomeScreen")


class TestOnboardingFields:
    """Test that onboarding saves all required fields"""
    
    def test_update_all_onboarding_fields(self, auth_headers):
        """PUT /api/profile should accept all onboarding fields at once"""
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers=auth_headers,
            json={
                "gender": "woman",
                "partner_gender": "woman",
                "ethnicity": "latino",
                "zodiac_sign": "leo",
                "partner_zodiac": "pisces",
                "onboarding_complete": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all fields saved
        assert data.get("gender") == "woman"
        assert data.get("partner_gender") == "woman"
        assert data.get("ethnicity") == "latino"
        assert data.get("zodiac_sign") == "leo"
        assert data.get("partner_zodiac") == "pisces"
        assert data.get("onboarding_complete") == True
        
        print("✓ All onboarding fields saved correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
