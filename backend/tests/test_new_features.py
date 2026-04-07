"""
CommonGround API Tests - New Features (Iteration 3)
Tests for newly added features:
- Love Language Quiz (GET quiz, POST submit, GET results)
- Couple Portraits (GET portraits, POST generate)
- Astrology Deep-Dive (POST deep-dive)
- Partner Sync (GET partner answer)
- Push Notifications (POST subscribe, DELETE subscribe, GET status)
- In-App Notifications (GET notifications)
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


class TestLoveLanguageQuiz:
    """Tests for Love Language Quiz feature"""
    
    def test_get_quiz_no_auth_required(self, api_client):
        """Test GET /api/love-language/quiz returns quiz without auth"""
        response = api_client.get(f"{BASE_URL}/api/love-language/quiz")
        assert response.status_code == 200
        data = response.json()
        
        # Verify 15 questions
        assert "questions" in data
        assert len(data["questions"]) == 15
        
        # Verify 5 languages
        assert "languages" in data
        assert len(data["languages"]) == 5
        
        # Verify language keys
        expected_langs = ["words_of_affirmation", "acts_of_service", "receiving_gifts", "quality_time", "physical_touch"]
        for lang in expected_langs:
            assert lang in data["languages"]
        
        # Verify question structure
        q = data["questions"][0]
        assert "id" in q
        assert "a" in q and "b" in q
        assert "text" in q["a"] and "lang" in q["a"]
        assert "text" in q["b"] and "lang" in q["b"]
        
        print(f"✅ Love Language Quiz: {len(data['questions'])} questions, {len(data['languages'])} languages")
    
    def test_submit_love_language_requires_auth(self, api_client):
        """Test POST /api/love-language/submit requires auth"""
        response = api_client.post(
            f"{BASE_URL}/api/love-language/submit",
            json={"answers": ["words_of_affirmation"] * 15}
        )
        assert response.status_code in [401, 403]
        print("✅ Love Language submit endpoint protected")
    
    def test_submit_love_language(self, authenticated_client):
        """Test POST /api/love-language/submit calculates scores correctly"""
        # Submit answers with known distribution
        answers = [
            "words_of_affirmation", "quality_time", "physical_touch",  # 1-3
            "acts_of_service", "quality_time", "words_of_affirmation",  # 4-6
            "receiving_gifts", "physical_touch", "acts_of_service",  # 7-9
            "quality_time", "words_of_affirmation", "receiving_gifts",  # 10-12
            "acts_of_service", "quality_time", "physical_touch"  # 13-15
        ]
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/love-language/submit",
            json={"answers": answers}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "scores" in data
        assert "primary" in data
        assert "primary_label" in data
        assert "secondary" in data
        assert "secondary_label" in data
        
        # Verify scores are calculated
        assert isinstance(data["scores"], dict)
        total_score = sum(data["scores"].values())
        assert total_score == 15  # Should equal number of questions
        
        print(f"✅ Love Language submitted - Primary: {data['primary_label']}, Secondary: {data['secondary_label']}")
    
    def test_get_love_language_results(self, authenticated_client):
        """Test GET /api/love-language/results returns saved results"""
        response = authenticated_client.get(f"{BASE_URL}/api/love-language/results")
        assert response.status_code == 200
        data = response.json()
        
        # Should have completed quiz from previous test
        if data.get("completed"):
            assert "scores" in data
            assert "primary" in data
            assert "primary_label" in data
            assert "labels" in data
            print(f"✅ Love Language results: {data['primary_label']}")
        else:
            print("✅ Love Language results: Quiz not yet completed")


class TestCouplePortraits:
    """Tests for Couple Portraits feature"""
    
    def test_get_portraits_requires_auth(self, api_client):
        """Test GET /api/portraits requires auth"""
        response = api_client.get(f"{BASE_URL}/api/portraits")
        assert response.status_code in [401, 403]
        print("✅ Portraits endpoint protected")
    
    def test_get_portraits(self, authenticated_client):
        """Test GET /api/portraits returns user portraits"""
        response = authenticated_client.get(f"{BASE_URL}/api/portraits")
        assert response.status_code == 200
        data = response.json()
        assert "portraits" in data
        print(f"✅ Portraits retrieved: {len(data['portraits'])} portraits")
    
    def test_generate_portrait_requires_auth(self, api_client):
        """Test POST /api/portraits/generate requires auth"""
        response = api_client.post(
            f"{BASE_URL}/api/portraits/generate",
            json={"prompt": "test", "style": "anime"}
        )
        assert response.status_code in [401, 403]
        print("✅ Portrait generation endpoint protected")
    
    # Note: Skipping actual portrait generation test as it takes 60+ seconds
    # and uses real AI image generation


class TestAstrologyDeepDive:
    """Tests for Astrology Deep-Dive feature"""
    
    def test_astrology_deep_dive_requires_auth(self, api_client):
        """Test POST /api/astrology/deep-dive requires auth"""
        response = api_client.post(
            f"{BASE_URL}/api/astrology/deep-dive",
            json={"birth_date": "1990-01-15"}
        )
        assert response.status_code in [401, 403]
        print("✅ Astrology deep-dive endpoint protected")
    
    def test_astrology_deep_dive(self, authenticated_client):
        """Test POST /api/astrology/deep-dive returns astrology data"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/astrology/deep-dive",
            json={
                "birth_date": "1990-06-15",
                "birth_time": "14:30",
                "birth_location": "New York, USA"
            },
            timeout=30  # AI generation may take time
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "astrology" in data
        astro = data["astrology"]
        
        # Should have at least sun_sign
        assert "sun_sign" in astro or "summary" in astro
        
        print(f"✅ Astrology deep-dive: Sun sign = {astro.get('sun_sign', 'generated')}")


class TestPartnerSync:
    """Tests for Partner Sync (Daily Question) feature"""
    
    def test_partner_answer_requires_auth(self, api_client):
        """Test GET /api/daily-question/partner requires auth"""
        response = api_client.get(f"{BASE_URL}/api/daily-question/partner")
        assert response.status_code in [401, 403]
        print("✅ Partner answer endpoint protected")
    
    def test_get_partner_answer(self, authenticated_client):
        """Test GET /api/daily-question/partner returns partner status"""
        response = authenticated_client.get(f"{BASE_URL}/api/daily-question/partner")
        assert response.status_code == 200
        data = response.json()
        
        # Should have partner_answered field
        assert "partner_answered" in data
        
        # If both answered, should have partner_answer
        if data.get("both_answered"):
            assert "partner_answer" in data
            print(f"✅ Partner sync: Both answered, partner said: {data.get('partner_answer', '')[:30]}...")
        else:
            print(f"✅ Partner sync: partner_answered={data.get('partner_answered')}")


class TestPushNotifications:
    """Tests for Push Notification subscription feature"""
    
    def test_push_subscribe_requires_auth(self, api_client):
        """Test POST /api/push/subscribe requires auth"""
        response = api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json={"endpoint": "https://test.com", "keys": {"p256dh": "test", "auth": "test"}}
        )
        assert response.status_code in [401, 403]
        print("✅ Push subscribe endpoint protected")
    
    def test_push_status_requires_auth(self, api_client):
        """Test GET /api/push/status requires auth"""
        response = api_client.get(f"{BASE_URL}/api/push/status")
        assert response.status_code in [401, 403]
        print("✅ Push status endpoint protected")
    
    def test_get_push_status(self, authenticated_client):
        """Test GET /api/push/status returns subscription status"""
        response = authenticated_client.get(f"{BASE_URL}/api/push/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "enabled" in data
        print(f"✅ Push status: enabled={data['enabled']}")
    
    def test_push_subscribe(self, authenticated_client):
        """Test POST /api/push/subscribe creates subscription"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json={
                "endpoint": "https://test-push-endpoint.example.com/TEST_subscription",
                "keys": {"p256dh": "test_p256dh_key", "auth": "test_auth_key"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("subscribed") == True
        print("✅ Push subscription created")
    
    def test_push_unsubscribe(self, authenticated_client):
        """Test DELETE /api/push/subscribe removes subscription"""
        response = authenticated_client.delete(f"{BASE_URL}/api/push/subscribe")
        assert response.status_code == 200
        data = response.json()
        assert data.get("unsubscribed") == True
        print("✅ Push subscription removed")


class TestInAppNotifications:
    """Tests for In-App Notifications feature"""
    
    def test_notifications_requires_auth(self, api_client):
        """Test GET /api/notifications requires auth"""
        response = api_client.get(f"{BASE_URL}/api/notifications")
        assert response.status_code in [401, 403]
        print("✅ Notifications endpoint protected")
    
    def test_get_notifications(self, authenticated_client):
        """Test GET /api/notifications returns user notifications"""
        response = authenticated_client.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        
        # Check notification structure if any exist
        if data["notifications"]:
            notif = data["notifications"][0]
            assert "type" in notif
            assert "message" in notif
            print(f"✅ Notifications: {len(data['notifications'])} notifications, first type: {notif['type']}")
        else:
            print("✅ Notifications: 0 notifications (expected if quiz completed)")


class TestChatMediaAttachment:
    """Tests for Chat with media attachment feature"""
    
    def test_send_chat_message_requires_auth(self, api_client):
        """Test POST /api/chat/send requires auth"""
        response = api_client.post(
            f"{BASE_URL}/api/chat/send",
            json={"text": "test"}
        )
        assert response.status_code in [401, 403]
        print("✅ Chat send endpoint protected")
    
    def test_get_chat_messages(self, authenticated_client):
        """Test GET /api/chat/messages returns messages"""
        response = authenticated_client.get(f"{BASE_URL}/api/chat/messages")
        assert response.status_code == 200
        data = response.json()
        
        assert "messages" in data
        print(f"✅ Chat messages: {len(data['messages'])} messages")
    
    def test_send_chat_message(self, authenticated_client):
        """Test POST /api/chat/send creates message"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={
                "text": "TEST_chat_message_for_testing",
                "media_data": None,
                "media_type": None
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert data["message"]["text"] == "TEST_chat_message_for_testing"
        print("✅ Chat message sent")
    
    def test_send_chat_message_with_media(self, authenticated_client):
        """Test POST /api/chat/send with media attachment"""
        # Small base64 test image (1x1 pixel PNG)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = authenticated_client.post(
            f"{BASE_URL}/api/chat/send",
            json={
                "text": "TEST_chat_with_image",
                "media_data": test_image_base64,
                "media_type": "image"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert data["message"]["message_type"] == "media"
        assert data["message"]["media_url"] == test_image_base64
        print("✅ Chat message with media sent")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
