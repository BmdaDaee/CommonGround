from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date
import httpx
import random
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Config
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_SECRET_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="CommonGround API - Full Platform")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============== CONSTANTS ==============

ZODIAC_SIGNS = {
    "aries": {"symbol": "♈", "element": "Fire", "dates": "Mar 21 - Apr 19", "traits": ["Bold", "Passionate", "Independent"]},
    "taurus": {"symbol": "♉", "element": "Earth", "dates": "Apr 20 - May 20", "traits": ["Reliable", "Sensual", "Patient"]},
    "gemini": {"symbol": "♊", "element": "Air", "dates": "May 21 - Jun 20", "traits": ["Curious", "Witty", "Adaptable"]},
    "cancer": {"symbol": "♋", "element": "Water", "dates": "Jun 21 - Jul 22", "traits": ["Nurturing", "Intuitive", "Protective"]},
    "leo": {"symbol": "♌", "element": "Fire", "dates": "Jul 23 - Aug 22", "traits": ["Confident", "Generous", "Dramatic"]},
    "virgo": {"symbol": "♍", "element": "Earth", "dates": "Aug 23 - Sep 22", "traits": ["Analytical", "Helpful", "Perfectionist"]},
    "libra": {"symbol": "♎", "element": "Air", "dates": "Sep 23 - Oct 22", "traits": ["Harmonious", "Fair", "Romantic"]},
    "scorpio": {"symbol": "♏", "element": "Water", "dates": "Oct 23 - Nov 21", "traits": ["Intense", "Loyal", "Mysterious"]},
    "sagittarius": {"symbol": "♐", "element": "Fire", "dates": "Nov 22 - Dec 21", "traits": ["Adventurous", "Optimistic", "Honest"]},
    "capricorn": {"symbol": "♑", "element": "Earth", "dates": "Dec 22 - Jan 19", "traits": ["Ambitious", "Disciplined", "Responsible"]},
    "aquarius": {"symbol": "♒", "element": "Air", "dates": "Jan 20 - Feb 18", "traits": ["Innovative", "Independent", "Humanitarian"]},
    "pisces": {"symbol": "♓", "element": "Water", "dates": "Feb 19 - Mar 20", "traits": ["Dreamy", "Empathetic", "Artistic"]},
}

DAILY_QUESTIONS = [
    {"category": "deep", "question": "What's one thing you wish I understood better about you?"},
    {"category": "deep", "question": "When do you feel most loved by me?"},
    {"category": "deep", "question": "What's a fear you haven't shared with me yet?"},
    {"category": "fun", "question": "If we could teleport anywhere right now, where would you take me?"},
    {"category": "fun", "question": "What's a childhood memory that still makes you smile?"},
    {"category": "growth", "question": "What's one thing we could do better as a team?"},
    {"category": "growth", "question": "How can I support you better this week?"},
    {"category": "trust", "question": "What makes you feel secure in our relationship?"},
    {"category": "trust", "question": "Is there anything weighing on you that you haven't told me?"},
    {"category": "intimacy", "question": "What kind of touch makes you feel most connected?"},
    {"category": "values", "question": "What does a perfect weekend together look like to you?"},
    {"category": "reflection", "question": "What moment from this week are you most grateful for?"},
    {"category": "future", "question": "What's one goal you want us to achieve together this year?"},
]

TRUST_EXERCISES = [
    {"id": "vulnerability-share", "title": "Vulnerability Share", "description": "Take turns sharing something you've been hesitant to say. The listener only responds with 'Thank you for sharing that with me.'", "duration": "15 min", "difficulty": "Medium"},
    {"id": "eye-contact", "title": "4-Minute Eye Contact", "description": "Sit facing each other and maintain eye contact for 4 minutes without speaking.", "duration": "4 min", "difficulty": "Easy"},
    {"id": "appreciation-flood", "title": "Appreciation Flood", "description": "Set a timer for 3 minutes. One partner shares as many things they appreciate about the other as possible.", "duration": "6 min", "difficulty": "Easy"},
    {"id": "hurt-healing", "title": "Hurt & Healing", "description": "Share one small hurt from the past week and what would help you heal from it.", "duration": "20 min", "difficulty": "Hard"},
    {"id": "dream-mapping", "title": "Dream Mapping", "description": "Each share 3 dreams for your relationship. Find the overlaps and make one small plan together.", "duration": "30 min", "difficulty": "Medium"},
    {"id": "repair-practice", "title": "Repair Practice", "description": "Think of a recent conflict. Take turns saying: 'When [X happened], I felt [emotion]. What I needed was [need].'", "duration": "15 min", "difficulty": "Hard"},
]

GROWTH_MODULES = [
    {"id": "closer", "title": "Feel Closer", "description": "7-day journey to deepen your emotional connection", "days": 7, "icon": "sparkles", "outcomes": ["Rekindle feelings", "Notice attraction", "Feel more connected"]},
    {"id": "conflict", "title": "Healthy Conflict", "description": "Learn to argue better, together", "days": 7, "icon": "heart", "outcomes": ["Stop spiraling", "Feel heard", "Resolve faster"]},
    {"id": "communication", "title": "Clear Communication", "description": "Fix misunderstandings and communicate clearly", "days": 7, "icon": "message", "outcomes": ["Fewer assumptions", "Smoother talks", "Less frustration"]},
    {"id": "intimacy", "title": "Deeper Intimacy", "description": "Build physical and emotional closeness", "days": 7, "icon": "flame", "outcomes": ["More connection", "Better understanding", "Renewed passion"]},
    {"id": "trust", "title": "Trust Rebuild", "description": "Repair and strengthen your foundation of trust", "days": 14, "icon": "shield", "outcomes": ["Feel secure", "Open up more", "Heal together"]},
]

SPARKS = [
    "What is one small thing I did this week that made you feel loved?",
    "If we could teleport anywhere right now, where would you take me?",
    "What's your favorite memory of us?",
    "What's something you've always wanted to try together?",
    "If our relationship was a movie, what would the title be?",
    "What's one thing I do that always makes you smile?",
    "What's something you're grateful for about us today?",
    "If we had one day with no responsibilities, how would we spend it?",
    "What's a song that makes you think of us?",
    "What's the bravest thing you've ever done in our relationship?",
]

# ============== MODELS ==============

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supabase_uid: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar_prompt: Optional[str] = None
    appearance: Optional[str] = None
    zodiac_sign: Optional[str] = None
    partner_zodiac: Optional[str] = None
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None
    astrology_profile: Optional[Dict[str, Any]] = None
    active_pair_id: Optional[str] = None
    favorites: Dict[str, List[str]] = Field(default_factory=lambda: {"music": [], "games": [], "movies": []})
    playlist: List[Dict[str, str]] = Field(default_factory=list)
    watching: Dict[str, List[Dict[str, Any]]] = Field(default_factory=lambda: {"anime": [], "shows": []})
    quick_answers: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pair_id: Optional[str] = None
    title: str
    date: str
    time: Optional[str] = None
    description: Optional[str] = None
    event_type: str = "general"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ListItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pair_id: Optional[str] = None
    list_type: str  # shopping, wishlist
    text: str
    checked: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JournalEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    text: str
    analysis: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ModuleProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    module_id: str
    current_day: int = 1
    completed_days: List[int] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class CouplePortrait(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pair_id: Optional[str] = None
    prompt: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    question: str
    category: str
    date: str
    answer: Optional[str] = None
    partner_answer: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pair_id: str
    sender_uid: str
    text: str
    message_type: str = "user"
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mode: str = "commonground"
    vibe: str = "realtalk"
    tone_state: Optional[Dict[str, Any]] = None
    pattern_tracker: Dict[str, Any] = Field(default_factory=lambda: {"counts": {}, "topic_counts": {}, "fired_topics": {}})
    history: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== REQUEST MODELS ==============

class ChatRequest(BaseModel):
    message: str
    mode: Optional[str] = "commonground"
    vibe: Optional[str] = "realtalk"

class AITaskRequest(BaseModel):
    task: str
    context: str
    vibe: Optional[str] = "realtalk"

class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    zodiac_sign: Optional[str] = None
    partner_zodiac: Optional[str] = None
    appearance: Optional[str] = None
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None

class UpdateFavoritesRequest(BaseModel):
    category: str
    items: List[str]

class AddPlaylistRequest(BaseModel):
    title: str
    artist: str
    cover: Optional[str] = None

class AddWatchingRequest(BaseModel):
    media_type: str  # anime, shows
    title: str
    current_episode: Optional[str] = None
    status: str = "watching"

class QuickAnswerRequest(BaseModel):
    key: str
    value: str

class CreateEventRequest(BaseModel):
    title: str
    date: str
    time: Optional[str] = None
    description: Optional[str] = None
    event_type: str = "general"

class CreateListItemRequest(BaseModel):
    list_type: str
    text: str

class JournalRequest(BaseModel):
    text: str

class GenerateAvatarRequest(BaseModel):
    appearance: str
    style: str = "anime"

class GeneratePortraitRequest(BaseModel):
    prompt: str
    style: str = "anime"

class GenerateAstrologyRequest(BaseModel):
    birth_date: str
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None

class ModuleExerciseRequest(BaseModel):
    module_id: str
    day: int

class AnswerQuestionRequest(BaseModel):
    answer: str

# ============== AUTH ==============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication")
    
    try:
        api_key = SUPABASE_SECRET_KEY or SUPABASE_ANON_KEY
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {credentials.credentials}", "apikey": api_key},
            )
            if response.status_code == 200:
                user_data = response.json()
                return {"uid": user_data["id"], "email": user_data.get("email", ""), "token": credentials.credentials}
            else:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except httpx.RequestError as e:
        logger.error(f"Auth request error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

# ============== HELPERS ==============

def serialize_doc(doc: dict) -> dict:
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != '_id'}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result

def get_today_date() -> str:
    return date.today().isoformat()

# ============== AI HELPERS ==============

async def generate_ai_text(prompt: str, session_id: str, system_message: str = "") -> str:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message
        )
        chat.with_model("openai", "gpt-4o")
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logger.error(f"AI text generation error: {e}")
        return "I'm having trouble connecting right now. Let's try again."

# ============== TASK PROMPTS ==============

TASK_PROMPTS = {
    "draft_reply": """Help craft a thoughtful reply to their partner.
Context: {context}
Vibe: {vibe}
Write a reply that sounds natural, honest, and emotionally intelligent. 2-4 sentences.""",

    "vent_analysis": """Someone vented about a relationship situation.
What they said: {context}
Break down: 1) Their real feelings 2) Partner's possible feelings 3) The gap 4) One thing to try. Keep it short.""",

    "date_plan": """Plan a meaningful date activity.
Context: {context}
Suggest something specific they could do THIS WEEK. Be concrete.""",

    "spark": """Create a conversation starter.
Context: {context}
Give ONE question that invites real sharing without feeling like therapy homework.""",

    "note": """Write a heartfelt note to their partner.
Context: {context}
Make it genuine, not cheesy. 1-3 sentences.""",

    "horoscope": """Generate a relationship-focused daily horoscope.
Sign: {sign}, Partner Sign: {partner_sign}, Date: {date}
Include: Overall energy, Love tip, Communication advice, Lucky moment to connect.""",

    "trust_advice": """Provide trust-building guidance.
Exercise: {exercise}
Context: {context}
Advice on: Setup, mindset, handling emotions, closing the exercise.""",

    "astrology": """Generate an astrology profile.
Birth Date: {birth_date}
Birth Time: {birth_time}
Birth Location: {birth_location}
Generate sun sign, moon sign (estimate if no time), rising sign (estimate if no time), and a personality summary focused on love and relationships. Format as JSON with keys: sun_sign, moon_sign, rising_sign, summary.""",

    "journal_analysis": """Analyze this journal entry with empathy.
Entry: {text}
Provide: 1) What emotions you sense 2) What might be underneath 3) A gentle reflection question. Be warm, not clinical.""",

    "module_exercise": """Generate a relationship exercise.
Module: {module_title} - {module_description}
Day {day} of {total_days}
Outcomes: {outcomes}
Create a specific exercise for today. Include: Title, Instructions (3-5 steps), Reflection question, Time needed.""",

    "gift_ideas": """Suggest thoughtful gift ideas.
Context: {context}
Partner info: {partner_info}
Give 5 specific gift ideas ranging from small gestures to bigger gifts. Be creative and personal.""",

    "ingredients": """Suggest ingredients for a recipe or meal.
Context: {context}
Provide a shopping list with quantities. Keep it practical.""",

    "ignite": """Suggest something spicy and intimate for couples.
Context: {context}
Vibe: {vibe}
Be tasteful but not clinical. Suggest something to try together tonight.""",
}

# ============== ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "CommonGround API - Full Platform", "status": "ok", "ai": "BentlyAI"}

@api_router.get("/health")
async def health():
    return {"ok": True, "service": "commonground-api", "ai": "BentlyAI", "features": ["chat", "horoscope", "trust", "modules", "journal", "calendar", "lists", "portraits"]}

# === Auth/Profile ===

@api_router.post("/auth/session")
async def create_session(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc:
        new_user = UserProfile(supabase_uid=current_user["uid"], email=current_user["email"])
        user_dict = new_user.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        user_dict["updated_at"] = user_dict["updated_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_doc = user_dict
    return {"uid": current_user["uid"], "user": serialize_doc(user_doc)}

@api_router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user_doc)

@api_router.put("/profile")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for field in ["display_name", "zodiac_sign", "partner_zodiac", "appearance", "birth_date", "birth_time", "birth_location"]:
        val = getattr(data, field, None)
        if val is not None:
            update_data[field] = val.lower() if field in ["zodiac_sign", "partner_zodiac"] else val
    
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": update_data})
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return serialize_doc(user_doc)

# === Favorites/Playlist/Watching ===

@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return {"favorites": user_doc.get("favorites", {"music": [], "games": [], "movies": []})}

@api_router.put("/favorites")
async def update_favorites(data: UpdateFavoritesRequest, current_user: dict = Depends(get_current_user)):
    if data.category not in ["music", "games", "movies"]:
        raise HTTPException(status_code=400, detail="Invalid category")
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": {f"favorites.{data.category}": data.items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return {"favorites": user_doc.get("favorites", {})}

@api_router.post("/playlist")
async def add_to_playlist(data: AddPlaylistRequest, current_user: dict = Depends(get_current_user)):
    song = {"id": str(uuid.uuid4()), "title": data.title, "artist": data.artist, "cover": data.cover or ""}
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$push": {"playlist": song}})
    return {"song": song}

@api_router.delete("/playlist/{song_id}")
async def remove_from_playlist(song_id: str, current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$pull": {"playlist": {"id": song_id}}})
    return {"deleted": song_id}

@api_router.post("/watching")
async def add_watching(data: AddWatchingRequest, current_user: dict = Depends(get_current_user)):
    if data.media_type not in ["anime", "shows"]:
        raise HTTPException(status_code=400, detail="Invalid media type")
    item = {"id": str(uuid.uuid4()), "title": data.title, "current_episode": data.current_episode, "status": data.status}
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$push": {f"watching.{data.media_type}": item}})
    return {"item": item}

@api_router.post("/quick-answer")
async def save_quick_answer(data: QuickAnswerRequest, current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {f"quick_answers.{data.key}": data.value}})
    return {"saved": True}

# === Horoscope ===

@api_router.get("/horoscope")
async def get_horoscope(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    user_sign = user_doc.get("zodiac_sign", "aries")
    partner_sign = user_doc.get("partner_zodiac", "libra")
    today = get_today_date()
    
    cached = await db.horoscopes.find_one({"user_id": current_user["uid"], "date": today}, {"_id": 0})
    if cached:
        return cached
    
    prompt = TASK_PROMPTS["horoscope"].format(sign=user_sign.capitalize(), partner_sign=partner_sign.capitalize(), date=today)
    content = await generate_ai_text(prompt, f"horoscope-{current_user['uid']}-{today}", "You are BentlyAI, a warm relationship companion.")
    
    horoscope = {
        "user_id": current_user["uid"],
        "date": today,
        "sign": user_sign,
        "partner_sign": partner_sign,
        "sign_info": ZODIAC_SIGNS.get(user_sign, {}),
        "partner_sign_info": ZODIAC_SIGNS.get(partner_sign, {}),
        "content": content
    }
    await db.horoscopes.insert_one(horoscope)
    if "_id" in horoscope:
        del horoscope["_id"]
    return horoscope

@api_router.get("/zodiac-signs")
async def get_zodiac_signs():
    return {"signs": ZODIAC_SIGNS}

@api_router.post("/astrology/generate")
async def generate_astrology(data: GenerateAstrologyRequest, current_user: dict = Depends(get_current_user)):
    prompt = TASK_PROMPTS["astrology"].format(
        birth_date=data.birth_date,
        birth_time=data.birth_time or "Unknown",
        birth_location=data.birth_location or "Unknown"
    )
    result = await generate_ai_text(prompt, f"astrology-{current_user['uid']}", "You are an astrologer. Always respond in valid JSON.")
    
    # Try to parse JSON from response
    try:
        import json
        # Find JSON in response
        start = result.find('{')
        end = result.rfind('}') + 1
        if start != -1 and end > start:
            astro_data = json.loads(result[start:end])
        else:
            astro_data = {"sun_sign": "unknown", "moon_sign": "unknown", "rising_sign": "unknown", "summary": result}
    except:
        astro_data = {"sun_sign": "unknown", "moon_sign": "unknown", "rising_sign": "unknown", "summary": result}
    
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": {
            "astrology_profile": astro_data,
            "birth_date": data.birth_date,
            "birth_time": data.birth_time,
            "birth_location": data.birth_location,
            "zodiac_sign": astro_data.get("sun_sign", "").lower(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"astrology": astro_data}

# === Daily Question ===

@api_router.get("/daily-question")
async def get_daily_question(current_user: dict = Depends(get_current_user)):
    today = get_today_date()
    existing = await db.daily_questions.find_one({"user_id": current_user["uid"], "date": today}, {"_id": 0})
    if existing:
        return serialize_doc(existing)
    
    question_data = random.choice(DAILY_QUESTIONS)
    new_question = DailyQuestion(user_id=current_user["uid"], question=question_data["question"], category=question_data["category"], date=today)
    q_dict = new_question.model_dump()
    q_dict["created_at"] = q_dict["created_at"].isoformat()
    await db.daily_questions.insert_one(q_dict)
    return serialize_doc(q_dict)

@api_router.post("/daily-question/answer")
async def answer_daily_question(data: AnswerQuestionRequest, current_user: dict = Depends(get_current_user)):
    today = get_today_date()
    await db.daily_questions.update_one({"user_id": current_user["uid"], "date": today}, {"$set": {"answer": data.answer}})
    question = await db.daily_questions.find_one({"user_id": current_user["uid"], "date": today}, {"_id": 0})
    return serialize_doc(question)

@api_router.get("/sparks")
async def get_sparks():
    return {"sparks": SPARKS}

# === Trust Building ===

@api_router.get("/trust-exercises")
async def get_trust_exercises():
    return {"exercises": TRUST_EXERCISES}

@api_router.post("/trust-advice")
async def get_trust_advice(exercise_id: str, context: str = "", vibe: str = "realtalk", current_user: dict = Depends(get_current_user)):
    exercise = next((e for e in TRUST_EXERCISES if e["id"] == exercise_id), None)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    prompt = TASK_PROMPTS["trust_advice"].format(exercise=f"{exercise['title']}: {exercise['description']}", context=context or "No additional context", vibe=vibe)
    advice = await generate_ai_text(prompt, f"trust-{current_user['uid']}-{exercise_id}", "You are BentlyAI, focused on building trust.")
    return {"exercise": exercise, "advice": advice}

# === Growth Modules ===

@api_router.get("/modules")
async def get_modules():
    return {"modules": GROWTH_MODULES}

@api_router.get("/modules/progress")
async def get_module_progress(current_user: dict = Depends(get_current_user)):
    progress = await db.module_progress.find({"user_id": current_user["uid"]}, {"_id": 0}).to_list(50)
    return {"progress": [serialize_doc(p) for p in progress]}

@api_router.post("/modules/{module_id}/start")
async def start_module(module_id: str, current_user: dict = Depends(get_current_user)):
    module = next((m for m in GROWTH_MODULES if m["id"] == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    existing = await db.module_progress.find_one({"user_id": current_user["uid"], "module_id": module_id})
    if existing:
        return {"progress": serialize_doc(existing), "already_started": True}
    
    progress = ModuleProgress(user_id=current_user["uid"], module_id=module_id)
    p_dict = progress.model_dump()
    p_dict["started_at"] = p_dict["started_at"].isoformat()
    await db.module_progress.insert_one(p_dict)
    return {"progress": serialize_doc(p_dict)}

@api_router.post("/modules/exercise")
async def generate_module_exercise(data: ModuleExerciseRequest, current_user: dict = Depends(get_current_user)):
    module = next((m for m in GROWTH_MODULES if m["id"] == data.module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    prompt = TASK_PROMPTS["module_exercise"].format(
        module_title=module["title"],
        module_description=module["description"],
        day=data.day,
        total_days=module["days"],
        outcomes=", ".join(module["outcomes"])
    )
    exercise = await generate_ai_text(prompt, f"module-{current_user['uid']}-{data.module_id}-day{data.day}", "You are BentlyAI, a relationship coach.")
    return {"exercise": exercise, "module": module, "day": data.day}

@api_router.post("/modules/{module_id}/complete-day/{day}")
async def complete_module_day(module_id: str, day: int, current_user: dict = Depends(get_current_user)):
    result = await db.module_progress.update_one(
        {"user_id": current_user["uid"], "module_id": module_id},
        {"$addToSet": {"completed_days": day}, "$set": {"current_day": day + 1}}
    )
    progress = await db.module_progress.find_one({"user_id": current_user["uid"], "module_id": module_id}, {"_id": 0})
    return {"progress": serialize_doc(progress)}

# === Calendar ===

@api_router.get("/calendar/events")
async def get_calendar_events(month: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["uid"]}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    events = await db.calendar_events.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return {"events": [serialize_doc(e) for e in events]}

@api_router.post("/calendar/events")
async def create_calendar_event(data: CreateEventRequest, current_user: dict = Depends(get_current_user)):
    event = CalendarEvent(user_id=current_user["uid"], title=data.title, date=data.date, time=data.time, description=data.description, event_type=data.event_type)
    e_dict = event.model_dump()
    e_dict["created_at"] = e_dict["created_at"].isoformat()
    await db.calendar_events.insert_one(e_dict)
    return {"event": serialize_doc(e_dict)}

@api_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    await db.calendar_events.delete_one({"id": event_id, "user_id": current_user["uid"]})
    return {"deleted": event_id}

# === Lists (Shopping/Wishlist) ===

@api_router.get("/lists/{list_type}")
async def get_list_items(list_type: str, current_user: dict = Depends(get_current_user)):
    if list_type not in ["shopping", "wishlist"]:
        raise HTTPException(status_code=400, detail="Invalid list type")
    items = await db.list_items.find({"user_id": current_user["uid"], "list_type": list_type}, {"_id": 0}).to_list(100)
    return {"items": [serialize_doc(i) for i in items]}

@api_router.post("/lists")
async def add_list_item(data: CreateListItemRequest, current_user: dict = Depends(get_current_user)):
    if data.list_type not in ["shopping", "wishlist"]:
        raise HTTPException(status_code=400, detail="Invalid list type")
    item = ListItem(user_id=current_user["uid"], list_type=data.list_type, text=data.text)
    i_dict = item.model_dump()
    i_dict["created_at"] = i_dict["created_at"].isoformat()
    await db.list_items.insert_one(i_dict)
    return {"item": serialize_doc(i_dict)}

@api_router.put("/lists/{item_id}/toggle")
async def toggle_list_item(item_id: str, current_user: dict = Depends(get_current_user)):
    item = await db.list_items.find_one({"id": item_id, "user_id": current_user["uid"]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.list_items.update_one({"id": item_id}, {"$set": {"checked": not item.get("checked", False)}})
    return {"toggled": True}

@api_router.delete("/lists/{item_id}")
async def delete_list_item(item_id: str, current_user: dict = Depends(get_current_user)):
    await db.list_items.delete_one({"id": item_id, "user_id": current_user["uid"]})
    return {"deleted": item_id}

@api_router.post("/lists/ai-suggest/{list_type}")
async def ai_suggest_list(list_type: str, context: str, current_user: dict = Depends(get_current_user)):
    if list_type == "shopping":
        prompt = TASK_PROMPTS["ingredients"].format(context=context)
    elif list_type == "wishlist":
        user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
        partner_info = f"Favorites: {user_doc.get('favorites', {})}"
        prompt = TASK_PROMPTS["gift_ideas"].format(context=context, partner_info=partner_info)
    else:
        raise HTTPException(status_code=400, detail="Invalid list type")
    
    suggestions = await generate_ai_text(prompt, f"list-{current_user['uid']}-{list_type}", "You are BentlyAI, helpful and practical.")
    return {"suggestions": suggestions}

# === Journal/Confessional ===

@api_router.get("/journal")
async def get_journal_entries(limit: int = 20, current_user: dict = Depends(get_current_user)):
    entries = await db.journal_entries.find({"user_id": current_user["uid"]}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"entries": [serialize_doc(e) for e in entries]}

@api_router.post("/journal")
async def create_journal_entry(data: JournalRequest, current_user: dict = Depends(get_current_user)):
    entry = JournalEntry(user_id=current_user["uid"], text=data.text)
    e_dict = entry.model_dump()
    e_dict["created_at"] = e_dict["created_at"].isoformat()
    await db.journal_entries.insert_one(e_dict)
    return {"entry": serialize_doc(e_dict)}

@api_router.post("/journal/{entry_id}/analyze")
async def analyze_journal_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.journal_entries.find_one({"id": entry_id, "user_id": current_user["uid"]})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    prompt = TASK_PROMPTS["journal_analysis"].format(text=entry["text"])
    analysis = await generate_ai_text(prompt, f"journal-{current_user['uid']}-{entry_id}", "You are BentlyAI, empathetic and insightful.")
    
    await db.journal_entries.update_one({"id": entry_id}, {"$set": {"analysis": analysis}})
    entry["analysis"] = analysis
    return {"entry": serialize_doc(entry)}

# === Portraits ===

@api_router.get("/portraits")
async def get_portraits(current_user: dict = Depends(get_current_user)):
    portraits = await db.portraits.find({"user_id": current_user["uid"]}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"portraits": [serialize_doc(p) for p in portraits]}

@api_router.post("/portraits/generate")
async def generate_portrait(data: GeneratePortraitRequest, current_user: dict = Depends(get_current_user)):
    # For now, return a placeholder - image generation would need separate implementation
    portrait = CouplePortrait(user_id=current_user["uid"], prompt=data.prompt)
    p_dict = portrait.model_dump()
    p_dict["created_at"] = p_dict["created_at"].isoformat()
    p_dict["image_url"] = f"https://placehold.co/512x512/2d1b4e/ffffff?text=Portrait"  # Placeholder
    await db.portraits.insert_one(p_dict)
    if "_id" in p_dict:
        del p_dict["_id"]
    return {"portrait": p_dict, "note": "Image generation coming soon - placeholder used"}

# === AI Chat ===

@api_router.post("/chat")
async def ai_chat(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    session_doc = await db.sessions.find_one({"user_id": current_user["uid"]})
    if not session_doc:
        session = Session(user_id=current_user["uid"], mode=data.mode or "commonground", vibe=data.vibe or "realtalk")
        session_dict = session.model_dump()
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["updated_at"] = session_dict["updated_at"].isoformat()
        await db.sessions.insert_one(session_dict)
        session_doc = session_dict
    
    vibe_instructions = {
        "soft": "Be gentle, validating, and warm.",
        "realtalk": "Be direct but caring. Call things out with love.",
        "savage": "Be brutally honest. No sugarcoating.",
    }
    
    system_prompt = f"""You are BentlyAI, a relationship coach and companion. You help couples communicate better, build trust, and grow together.
Your style: {vibe_instructions.get(data.vibe or session_doc.get('vibe', 'realtalk'), vibe_instructions['realtalk'])}
Keep responses concise (2-4 sentences). Focus on emotional truth. Ask questions that invite reflection. Never be preachy."""
    
    history = session_doc.get("history", [])[-10:]
    history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history])
    
    prompt = f"Conversation:\n{history_str or 'None'}\n\nUSER: {data.message}"
    reply = await generate_ai_text(prompt, session_doc["id"], system_prompt)
    
    history.append({"role": "user", "content": data.message, "ts": datetime.now(timezone.utc).isoformat()})
    history.append({"role": "assistant", "content": reply, "ts": datetime.now(timezone.utc).isoformat()})
    
    await db.sessions.update_one({"id": session_doc["id"]}, {"$set": {"history": history[-50:], "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    return {"reply": reply, "sessionId": session_doc["id"]}

@api_router.post("/ai")
async def ai_task(data: AITaskRequest, current_user: dict = Depends(get_current_user)):
    task_prompt = TASK_PROMPTS.get(data.task)
    if not task_prompt:
        raise HTTPException(status_code=400, detail=f"Unknown task: {data.task}")
    
    prompt = task_prompt.format(context=data.context, vibe=data.vibe or "direct but caring")
    output = await generate_ai_text(prompt, f"task-{current_user['uid']}-{data.task}", "You are BentlyAI, a relationship coach.")
    return {"ok": True, "task": data.task, "output": output}

@api_router.post("/ai/ignite")
async def ai_ignite(context: str = "", vibe: str = "realtalk", current_user: dict = Depends(get_current_user)):
    prompt = TASK_PROMPTS["ignite"].format(context=context or "Looking for something fun and intimate", vibe=vibe)
    suggestion = await generate_ai_text(prompt, f"ignite-{current_user['uid']}", "You are BentlyAI for intimate suggestions. Be tasteful but not clinical.")
    return {"suggestion": suggestion}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
