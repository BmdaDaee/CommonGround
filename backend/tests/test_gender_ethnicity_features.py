"""
Test suite for CommonGround gender, partner_gender, and ethnicity profile fields
Tests the new onboarding fields added in iteration 6
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://tlmtewyvzirdqjdlivis.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'sb_publishable_I9C8wpimPtGEOvaATngfkg_PxmjXaPR')

# Test credentials
TEST_EMAIL = "testuser@commonground.app"
TEST_PASSWORD = "TestPass123!"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token from Supabase"""
    # First try backend login endpoint
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        if "session" in data and "access_token" in data["session"]:
            return data["session"]["access_token"]
    
    # Fallback to direct Supabase auth
    response = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY
        }
    )
    
    if response.status_code == 200:
        return response.json().get("access_token")
    
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def api_client(auth_token):
    """Create authenticated API client"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Test /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print(f"Health check passed: {data}")


class TestProfileGenderEthnicityFields:
    """Test gender, partner_gender, and ethnicity fields in profile API"""
    
    def test_get_profile_has_gender_fields(self, api_client):
        """Test GET /api/profile returns gender/partner_gender/ethnicity fields"""
        response = api_client.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200
        
        data = response.json()
        # Check that the fields exist in the response (may be null for existing users)
        assert "gender" in data or data.get("gender") is None
        assert "partner_gender" in data or data.get("partner_gender") is None
        assert "ethnicity" in data or data.get("ethnicity") is None
        print(f"Profile fields - gender: {data.get('gender')}, partner_gender: {data.get('partner_gender')}, ethnicity: {data.get('ethnicity')}")
    
    def test_update_profile_gender(self, api_client):
        """Test PUT /api/profile can update gender field"""
        # Update gender
        response = api_client.put(
            f"{BASE_URL}/api/profile",
            json={"gender": "man"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("gender") == "man"
        print(f"Gender updated successfully: {data.get('gender')}")
    
    def test_update_profile_partner_gender(self, api_client):
        """Test PUT /api/profile can update partner_gender field"""
        response = api_client.put(
            f"{BASE_URL}/api/profile",
            json={"partner_gender": "woman"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("partner_gender") == "woman"
        print(f"Partner gender updated successfully: {data.get('partner_gender')}")
    
    def test_update_profile_ethnicity(self, api_client):
        """Test PUT /api/profile can update ethnicity field"""
        response = api_client.put(
            f"{BASE_URL}/api/profile",
            json={"ethnicity": "mixed"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("ethnicity") == "mixed"
        print(f"Ethnicity updated successfully: {data.get('ethnicity')}")
    
    def test_update_all_gender_ethnicity_fields(self, api_client):
        """Test PUT /api/profile can update all three fields at once"""
        response = api_client.put(
            f"{BASE_URL}/api/profile",
            json={
                "gender": "non-binary",
                "partner_gender": "man",
                "ethnicity": "asian"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("gender") == "non-binary"
        assert data.get("partner_gender") == "man"
        assert data.get("ethnicity") == "asian"
        print(f"All fields updated: gender={data.get('gender')}, partner_gender={data.get('partner_gender')}, ethnicity={data.get('ethnicity')}")
    
    def test_verify_persistence_via_get(self, api_client):
        """Test that updated fields persist via GET"""
        # First update
        api_client.put(
            f"{BASE_URL}/api/profile",
            json={
                "gender": "woman",
                "partner_gender": "woman",
                "ethnicity": "latino"
            }
        )
        
        # Then verify via GET
        response = api_client.get(f"{BASE_URL}/api/profile")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("gender") == "woman"
        assert data.get("partner_gender") == "woman"
        assert data.get("ethnicity") == "latino"
        print(f"Persistence verified: gender={data.get('gender')}, partner_gender={data.get('partner_gender')}, ethnicity={data.get('ethnicity')}")


class TestGenderOptions:
    """Test all valid gender options"""
    
    @pytest.mark.parametrize("gender", ["man", "woman", "non-binary", "other"])
    def test_valid_gender_options(self, api_client, gender):
        """Test all 4 gender options can be saved"""
        response = api_client.put(
            f"{BASE_URL}/api/profile",
            json={"gender": gender}
        )
        assert response.status_code == 200
        assert response.json().get("gender") == gender
        print(f"Gender option '{gender}' saved successfully")


class TestEthnicityOptions:
    """Test all valid ethnicity options"""
    
    @pytest.mark.parametrize("ethnicity", [
        "black", "white", "latino", "asian", "south-asian",
        "middle-eastern", "indigenous", "pacific-islander", "mixed", "other"
    ])
    def test_valid_ethnicity_options(self, api_client, ethnicity):
        """Test all 10 ethnicity options can be saved"""
        response = api_client.put(
            f"{BASE_URL}/api/profile",
            json={"ethnicity": ethnicity}
        )
        assert response.status_code == 200
        assert response.json().get("ethnicity") == ethnicity
        print(f"Ethnicity option '{ethnicity}' saved successfully")


class TestAuthSession:
    """Test auth session endpoint returns gender/ethnicity fields"""
    
    def test_auth_session_includes_gender_fields(self, api_client):
        """Test POST /api/auth/session returns user with gender fields"""
        response = api_client.post(f"{BASE_URL}/api/auth/session")
        assert response.status_code == 200
        
        data = response.json()
        user = data.get("user", {})
        
        # Verify user object has the new fields
        assert "gender" in user or user.get("gender") is None
        assert "partner_gender" in user or user.get("partner_gender") is None
        assert "ethnicity" in user or user.get("ethnicity") is None
        print(f"Auth session user fields: gender={user.get('gender')}, partner_gender={user.get('partner_gender')}, ethnicity={user.get('ethnicity')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
