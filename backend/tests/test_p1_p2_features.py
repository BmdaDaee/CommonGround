"""
Test P1+P2 Features for CommonGround App
- Partner-to-partner messaging
- Streak tracker
- Shared playlists
- AI avatar generation
- Milestones
- Weekly reports
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = "testuser@commonground.app"
TEST_PASSWORD = "TestPass123!"

# Supabase auth endpoint
SUPABASE_URL = "https://tlmtewyvzirdqjdlivis.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_I9C8wpimPtGEOvaATngfkg_PxmjXaPR"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token from Supabase"""
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
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated API client"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_returns_ok(self):
        """GET /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        assert "BentlyAI" in str(data)
        print(f"✓ Health check passed: {data}")


class TestPartnerChat:
    """Partner-to-partner messaging tests"""
    
    def test_get_partner_messages(self, api_client):
        """GET /api/partner-chat/messages returns messages array"""
        response = api_client.get(f"{BASE_URL}/api/partner-chat/messages")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Partner messages retrieved: {len(data['messages'])} messages")
    
    def test_send_partner_message(self, api_client):
        """POST /api/partner-chat/send creates a new message"""
        test_message = f"TEST_message_{int(time.time())}"
        response = api_client.post(
            f"{BASE_URL}/api/partner-chat/send",
            json={"text": test_message}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"]["text"] == test_message
        assert "id" in data["message"]
        assert "created_at" in data["message"]
        print(f"✓ Partner message sent: {data['message']['id']}")
        
        # Verify message appears in list
        response = api_client.get(f"{BASE_URL}/api/partner-chat/messages")
        assert response.status_code == 200
        messages = response.json()["messages"]
        message_texts = [m["text"] for m in messages]
        assert test_message in message_texts
        print(f"✓ Message verified in list")


class TestStreak:
    """Streak tracker tests"""
    
    def test_get_streak(self, api_client):
        """GET /api/streak returns current_streak, longest_streak, total_days"""
        response = api_client.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 200
        data = response.json()
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "total_days" in data
        assert isinstance(data["current_streak"], int)
        assert isinstance(data["longest_streak"], int)
        assert isinstance(data["total_days"], int)
        print(f"✓ Streak data: current={data['current_streak']}, longest={data['longest_streak']}, total={data['total_days']}")


class TestSharedPlaylist:
    """Shared playlist tests"""
    
    def test_get_shared_playlist(self, api_client):
        """GET /api/shared-playlist returns songs array"""
        response = api_client.get(f"{BASE_URL}/api/shared-playlist")
        assert response.status_code == 200
        data = response.json()
        assert "songs" in data
        assert isinstance(data["songs"], list)
        print(f"✓ Shared playlist retrieved: {len(data['songs'])} songs")
    
    def test_add_song_to_playlist(self, api_client):
        """POST /api/shared-playlist adds a song with title, artist"""
        test_title = f"TEST_Song_{int(time.time())}"
        test_artist = "Test Artist"
        response = api_client.post(
            f"{BASE_URL}/api/shared-playlist",
            json={
                "title": test_title,
                "artist": test_artist,
                "url": "https://example.com/song",
                "notes": "Test note"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "song" in data
        assert data["song"]["title"] == test_title
        assert data["song"]["artist"] == test_artist
        assert "id" in data["song"]
        song_id = data["song"]["id"]
        print(f"✓ Song added: {song_id}")
        
        # Verify song appears in list
        response = api_client.get(f"{BASE_URL}/api/shared-playlist")
        assert response.status_code == 200
        songs = response.json()["songs"]
        song_ids = [s["id"] for s in songs]
        assert song_id in song_ids
        print(f"✓ Song verified in playlist")
        
        return song_id
    
    def test_delete_song_from_playlist(self, api_client):
        """DELETE /api/shared-playlist/{id} removes a song"""
        # First add a song
        test_title = f"TEST_DeleteSong_{int(time.time())}"
        response = api_client.post(
            f"{BASE_URL}/api/shared-playlist",
            json={"title": test_title, "artist": "Delete Test"}
        )
        assert response.status_code == 200
        song_id = response.json()["song"]["id"]
        
        # Delete the song
        response = api_client.delete(f"{BASE_URL}/api/shared-playlist/{song_id}")
        assert response.status_code == 200
        print(f"✓ Song deleted: {song_id}")
        
        # Verify song is removed
        response = api_client.get(f"{BASE_URL}/api/shared-playlist")
        assert response.status_code == 200
        songs = response.json()["songs"]
        song_ids = [s["id"] for s in songs]
        assert song_id not in song_ids
        print(f"✓ Song removal verified")


class TestAvatar:
    """Avatar tests"""
    
    def test_get_avatar(self, api_client):
        """GET /api/avatar returns avatar data"""
        response = api_client.get(f"{BASE_URL}/api/avatar")
        assert response.status_code == 200
        data = response.json()
        # Avatar may be null if not generated yet
        assert "avatar" in data
        assert "description" in data
        assert "style" in data
        print(f"✓ Avatar data retrieved: has_avatar={data['avatar'] is not None}")


class TestMilestones:
    """Milestones tests"""
    
    def test_get_milestones(self, api_client):
        """GET /api/milestones returns milestones array"""
        response = api_client.get(f"{BASE_URL}/api/milestones")
        assert response.status_code == 200
        data = response.json()
        assert "milestones" in data
        assert isinstance(data["milestones"], list)
        print(f"✓ Milestones retrieved: {len(data['milestones'])} milestones")
    
    def test_create_milestone(self, api_client):
        """POST /api/milestones creates a milestone with title, date, category"""
        test_title = f"TEST_Milestone_{int(time.time())}"
        test_date = "2024-01-15"
        test_category = "first"
        response = api_client.post(
            f"{BASE_URL}/api/milestones",
            json={
                "title": test_title,
                "date": test_date,
                "description": "Test milestone description",
                "category": test_category
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "milestone" in data
        assert data["milestone"]["title"] == test_title
        assert data["milestone"]["date"] == test_date
        assert data["milestone"]["category"] == test_category
        assert "id" in data["milestone"]
        milestone_id = data["milestone"]["id"]
        print(f"✓ Milestone created: {milestone_id}")
        
        # Verify milestone appears in list
        response = api_client.get(f"{BASE_URL}/api/milestones")
        assert response.status_code == 200
        milestones = response.json()["milestones"]
        milestone_ids = [m["id"] for m in milestones]
        assert milestone_id in milestone_ids
        print(f"✓ Milestone verified in list")
        
        return milestone_id
    
    def test_delete_milestone(self, api_client):
        """DELETE /api/milestones/{id} removes a milestone"""
        # First create a milestone
        test_title = f"TEST_DeleteMilestone_{int(time.time())}"
        response = api_client.post(
            f"{BASE_URL}/api/milestones",
            json={
                "title": test_title,
                "date": "2024-02-20",
                "category": "custom"
            }
        )
        assert response.status_code == 200
        milestone_id = response.json()["milestone"]["id"]
        
        # Delete the milestone
        response = api_client.delete(f"{BASE_URL}/api/milestones/{milestone_id}")
        assert response.status_code == 200
        print(f"✓ Milestone deleted: {milestone_id}")
        
        # Verify milestone is removed
        response = api_client.get(f"{BASE_URL}/api/milestones")
        assert response.status_code == 200
        milestones = response.json()["milestones"]
        milestone_ids = [m["id"] for m in milestones]
        assert milestone_id not in milestone_ids
        print(f"✓ Milestone removal verified")


class TestWeeklyReport:
    """Weekly report tests (AI-powered, may take time)"""
    
    def test_get_weekly_report(self, api_client):
        """GET /api/weekly-report returns report text and stats"""
        # This endpoint uses AI and may take 10-15 seconds
        response = api_client.get(f"{BASE_URL}/api/weekly-report", timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "report" in data
        assert "stats" in data
        assert isinstance(data["report"], str)
        assert len(data["report"]) > 0
        assert "questions_answered" in data["stats"]
        assert "messages_sent" in data["stats"]
        assert "week_start" in data["stats"]
        assert "week_end" in data["stats"]
        print(f"✓ Weekly report generated: {len(data['report'])} chars")
        print(f"  Stats: questions={data['stats']['questions_answered']}, messages={data['stats']['messages_sent']}")


class TestAuthProtection:
    """Test that endpoints require authentication"""
    
    def test_partner_chat_requires_auth(self):
        """Partner chat endpoints require auth"""
        response = requests.get(f"{BASE_URL}/api/partner-chat/messages")
        assert response.status_code == 401
        print("✓ Partner chat GET requires auth")
        
        response = requests.post(f"{BASE_URL}/api/partner-chat/send", json={"text": "test"})
        assert response.status_code == 401
        print("✓ Partner chat POST requires auth")
    
    def test_streak_requires_auth(self):
        """Streak endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/streak")
        assert response.status_code == 401
        print("✓ Streak requires auth")
    
    def test_shared_playlist_requires_auth(self):
        """Shared playlist endpoints require auth"""
        response = requests.get(f"{BASE_URL}/api/shared-playlist")
        assert response.status_code == 401
        print("✓ Shared playlist GET requires auth")
        
        response = requests.post(f"{BASE_URL}/api/shared-playlist", json={"title": "test"})
        assert response.status_code == 401
        print("✓ Shared playlist POST requires auth")
    
    def test_avatar_requires_auth(self):
        """Avatar endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/avatar")
        assert response.status_code == 401
        print("✓ Avatar requires auth")
    
    def test_milestones_requires_auth(self):
        """Milestones endpoints require auth"""
        response = requests.get(f"{BASE_URL}/api/milestones")
        assert response.status_code == 401
        print("✓ Milestones GET requires auth")
        
        response = requests.post(f"{BASE_URL}/api/milestones", json={"title": "test", "date": "2024-01-01"})
        assert response.status_code == 401
        print("✓ Milestones POST requires auth")
    
    def test_weekly_report_requires_auth(self):
        """Weekly report endpoint requires auth"""
        response = requests.get(f"{BASE_URL}/api/weekly-report")
        assert response.status_code == 401
        print("✓ Weekly report requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
