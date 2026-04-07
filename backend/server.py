from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, File, UploadFile
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
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# ============== DEEPLYUS CONTENT ==============

DEEPLY_PROMPTS = [
    {"category": "fantasy", "prompt": "What's a fantasy you've never told me about?"},
    {"category": "fantasy", "prompt": "If we had zero inhibitions tonight, what would you want to try?"},
    {"category": "desire", "prompt": "What's something I do that turns you on that I might not know about?"},
    {"category": "desire", "prompt": "Where do you most like to be touched?"},
    {"category": "insecurity", "prompt": "What makes you feel insecure about your body or our intimacy?"},
    {"category": "insecurity", "prompt": "Is there anything you've been afraid to ask for in bed?"},
    {"category": "exploration", "prompt": "What's something new you'd be curious to explore together?"},
    {"category": "exploration", "prompt": "Is there a kink or interest you've been curious about?"},
    {"category": "connection", "prompt": "What makes you feel most desired by me?"},
    {"category": "connection", "prompt": "When do you feel the most intimate connection with me?"},
    {"category": "aftercare", "prompt": "What do you need from me after we're intimate?"},
    {"category": "aftercare", "prompt": "How can I make you feel more safe and loved during intimate moments?"},
]

DEEPLY_EXERCISES = [
    {"id": "sensate-focus", "title": "Sensate Focus", "description": "Take turns exploring each other's bodies without goal-oriented touch. Focus purely on sensation and presence.", "duration": "30 min", "difficulty": "Medium", "category": "exploration"},
    {"id": "desire-mapping", "title": "Desire Mapping", "description": "Draw on each other's bodies where you like to be touched, using different pressures to indicate intensity.", "duration": "20 min", "difficulty": "Easy", "category": "communication"},
    {"id": "fantasy-share", "title": "Fantasy Share", "description": "Take turns sharing one fantasy each. No judgment, just listening and curiosity.", "duration": "15 min", "difficulty": "Hard", "category": "vulnerability"},
    {"id": "yes-no-maybe", "title": "Yes/No/Maybe List", "description": "Go through a list of intimate activities and mark yes, no, or maybe. Compare and discuss.", "duration": "30 min", "difficulty": "Medium", "category": "boundaries"},
    {"id": "aftercare-talk", "title": "Aftercare Conversation", "description": "Discuss what each of you needs after intimacy - physical, emotional, verbal.", "duration": "15 min", "difficulty": "Easy", "category": "care"},
    {"id": "insecurity-share", "title": "Body Insecurity Share", "description": "Share one insecurity about your body. Partner responds only with what they love about that part.", "duration": "10 min", "difficulty": "Hard", "category": "vulnerability"},
]

# ============== LOVE LANGUAGE QUIZ ==============

LOVE_LANGUAGES = ["words_of_affirmation", "acts_of_service", "receiving_gifts", "quality_time", "physical_touch"]

LOVE_LANGUAGE_LABELS = {
    "words_of_affirmation": "Words of Affirmation",
    "acts_of_service": "Acts of Service",
    "receiving_gifts": "Receiving Gifts",
    "quality_time": "Quality Time",
    "physical_touch": "Physical Touch",
}

LOVE_LANGUAGE_QUIZ = [
    {"id": 1, "a": {"text": "I feel loved when my partner tells me they appreciate me", "lang": "words_of_affirmation"}, "b": {"text": "I feel loved when my partner helps me with tasks", "lang": "acts_of_service"}},
    {"id": 2, "a": {"text": "I feel loved when my partner gives me a thoughtful gift", "lang": "receiving_gifts"}, "b": {"text": "I feel loved when my partner spends quality time with me", "lang": "quality_time"}},
    {"id": 3, "a": {"text": "I feel loved when my partner holds my hand or hugs me", "lang": "physical_touch"}, "b": {"text": "I feel loved when my partner says encouraging things", "lang": "words_of_affirmation"}},
    {"id": 4, "a": {"text": "I feel loved when my partner does chores without being asked", "lang": "acts_of_service"}, "b": {"text": "I feel loved when my partner surprises me with something", "lang": "receiving_gifts"}},
    {"id": 5, "a": {"text": "I feel loved when my partner gives me their undivided attention", "lang": "quality_time"}, "b": {"text": "I feel loved when my partner is physically affectionate", "lang": "physical_touch"}},
    {"id": 6, "a": {"text": "I feel loved when my partner writes me a note or text", "lang": "words_of_affirmation"}, "b": {"text": "I feel loved when my partner cooks or fixes things for me", "lang": "acts_of_service"}},
    {"id": 7, "a": {"text": "I feel loved when my partner picks out something special for me", "lang": "receiving_gifts"}, "b": {"text": "I feel loved when we do activities together", "lang": "quality_time"}},
    {"id": 8, "a": {"text": "I feel loved when my partner cuddles with me", "lang": "physical_touch"}, "b": {"text": "I feel loved when my partner compliments me", "lang": "words_of_affirmation"}},
    {"id": 9, "a": {"text": "I feel loved when my partner takes care of something I've been stressing about", "lang": "acts_of_service"}, "b": {"text": "I feel loved when my partner remembers occasions with gifts", "lang": "receiving_gifts"}},
    {"id": 10, "a": {"text": "I feel loved when my partner plans a date for us", "lang": "quality_time"}, "b": {"text": "I feel loved when my partner gives me a back rub", "lang": "physical_touch"}},
    {"id": 11, "a": {"text": "I feel loved when my partner says 'I love you'", "lang": "words_of_affirmation"}, "b": {"text": "I feel loved when my partner and I go on walks together", "lang": "quality_time"}},
    {"id": 12, "a": {"text": "I feel loved when my partner brings me something unexpected", "lang": "receiving_gifts"}, "b": {"text": "I feel loved when my partner rubs my shoulders after a long day", "lang": "physical_touch"}},
    {"id": 13, "a": {"text": "I feel loved when my partner handles errands so I can rest", "lang": "acts_of_service"}, "b": {"text": "I feel loved when my partner tells me what they admire about me", "lang": "words_of_affirmation"}},
    {"id": 14, "a": {"text": "I feel loved when my partner puts away their phone to be with me", "lang": "quality_time"}, "b": {"text": "I feel loved when my partner makes something for me", "lang": "acts_of_service"}},
    {"id": 15, "a": {"text": "I feel loved when my partner plays with my hair or holds me", "lang": "physical_touch"}, "b": {"text": "I feel loved when my partner picks out a gift that shows they know me", "lang": "receiving_gifts"}},
]

# ============== MODELS ==============

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supabase_uid: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    appearance: Optional[str] = None
    zodiac_sign: Optional[str] = None
    partner_zodiac: Optional[str] = None
    birth_date: Optional[str] = None
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None
    astrology_profile: Optional[Dict[str, Any]] = None
    active_pair_id: Optional[str] = None
    deeply_unlocked: bool = False
    onboarding_complete: bool = False
    love_languages: Optional[Dict[str, int]] = None
    push_subscription: Optional[Dict[str, Any]] = None
    favorites: Dict[str, List[str]] = Field(default_factory=lambda: {"music": [], "games": [], "movies": []})
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Pair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    status: str = "PENDING"  # PENDING, ACTIVE
    member_a_uid: str
    member_a_name: Optional[str] = None
    member_b_uid: Optional[str] = None
    member_b_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pair_id: Optional[str] = None
    question: str
    category: str
    date: str
    answers: Dict[str, str] = Field(default_factory=dict)  # {user_id: answer}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pair_id: Optional[str] = None
    sender_uid: str
    text: str
    message_type: str = "user"  # user, assistant, system, media
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # image, video, audio
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouplePortrait(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pair_id: Optional[str] = None
    user_id: str
    prompt: str
    style: str = "anime"
    image_data: Optional[str] = None  # base64
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeeplyItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pair_id: Optional[str] = None
    user_id: str
    item_type: str  # fantasy, desire, insecurity, boundary, note
    text: str
    shared_with_partner: bool = False
    partner_response: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    list_type: str
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

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mode: str = "commonground"
    vibe: str = "realtalk"
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
    deeply_unlocked: Optional[bool] = None
    onboarding_complete: Optional[bool] = None

class UpdateFavoritesRequest(BaseModel):
    category: str
    items: List[str]

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

class GenerateAstrologyRequest(BaseModel):
    birth_date: str
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None

class ModuleExerciseRequest(BaseModel):
    module_id: str
    day: int

class AnswerQuestionRequest(BaseModel):
    answer: str

class JoinPairRequest(BaseModel):
    code: str

class SendMessageRequest(BaseModel):
    text: str
    media_data: Optional[str] = None  # base64
    media_type: Optional[str] = None

class DeeplyItemRequest(BaseModel):
    item_type: str
    text: str
    shared_with_partner: bool = False

class GeneratePortraitRequest(BaseModel):
    prompt: str
    style: str = "anime"

class LoveLanguageSubmitRequest(BaseModel):
    answers: List[str]  # list of chosen language keys

class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class AstrologyDeepDiveRequest(BaseModel):
    birth_date: str
    birth_time: Optional[str] = None
    birth_location: Optional[str] = None
    partner_birth_date: Optional[str] = None
    partner_birth_time: Optional[str] = None

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

def generate_pair_code() -> str:
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

async def generate_ai_text(prompt: str, session_id: str, system_message: str = "") -> str:
    try:
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system_message)
        chat.with_model("openai", "gpt-4o")
        response = await chat.send_message(UserMessage(text=prompt))
        return response
    except Exception as e:
        logger.error(f"AI text generation error: {e}")
        return "I'm having trouble connecting right now. Let's try again."

async def generate_ai_image(prompt: str) -> Optional[str]:
    try:
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
        if images and len(images) > 0:
            return base64.b64encode(images[0]).decode('utf-8')
        return None
    except Exception as e:
        logger.error(f"AI image generation error: {e}")
        return None

# ============== TASK PROMPTS ==============

TASK_PROMPTS = {
    "draft_reply": "Help craft a thoughtful reply. Context: {context}. Vibe: {vibe}. Write natural, honest, emotionally intelligent. 2-4 sentences.",
    "vent_analysis": "Someone vented: {context}. Break down: 1) Their real feelings 2) Partner's possible feelings 3) The gap 4) One thing to try.",
    "date_plan": "Plan a meaningful date. Context: {context}. Suggest something specific for THIS WEEK.",
    "spark": "Create a conversation starter. Context: {context}. ONE question that invites real sharing.",
    "note": "Write a heartfelt note. Context: {context}. Genuine, not cheesy. 1-3 sentences.",
    "horoscope": "Generate relationship horoscope. Sign: {sign}, Partner: {partner_sign}, Date: {date}. Include: energy, love tip, communication advice.",
    "trust_advice": "Trust exercise guidance. Exercise: {exercise}. Context: {context}. Advice on setup, mindset, handling emotions.",
    "astrology": "Generate astrology profile. Birth: {birth_date}, Time: {birth_time}, Location: {birth_location}. Return JSON with sun_sign, moon_sign, rising_sign, summary.",
    "journal_analysis": "Analyze journal entry with empathy. Entry: {text}. Provide: emotions sensed, what's underneath, gentle reflection question.",
    "module_exercise": "Generate relationship exercise. Module: {module_title} - {module_description}. Day {day} of {total_days}. Outcomes: {outcomes}. Include title, instructions, reflection question, time.",
    "gift_ideas": "Suggest gift ideas. Context: {context}. Partner info: {partner_info}. Give 5 specific ideas.",
    "ingredients": "Suggest ingredients. Context: {context}. Provide shopping list with quantities.",
    "ignite": "Suggest something intimate for tonight. Context: {context}. Vibe: {vibe}. Be tasteful but not clinical. Something to try together.",
    "deeply_fantasy": "Help explore a fantasy thoughtfully. Context: {context}. Be open, non-judgmental, and help them articulate what they want.",
    "deeply_insecurity": "Help process an intimacy insecurity. Context: {context}. Be gentle, validating, and offer perspective.",
    "deeply_exploration": "Suggest ways to explore this desire. Context: {context}. Be practical, safe, and consensual.",
    "portrait_prompt": "Create an artistic prompt for a couple portrait. Their description: {context}. Style: {style}. Create a detailed, romantic prompt for AI image generation.",
}

# ============== ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "CommonGround API", "status": "ok", "ai": "BentlyAI"}

@api_router.get("/health")
async def health():
    return {"ok": True, "service": "commonground-api", "ai": "BentlyAI"}

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
    
    # Get pair info if exists
    pair = None
    if user_doc.get("active_pair_id"):
        pair = await db.pairs.find_one({"id": user_doc["active_pair_id"]}, {"_id": 0})
    
    return {"uid": current_user["uid"], "user": serialize_doc(user_doc), "pair": serialize_doc(pair) if pair else None}

@api_router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user_doc)

@api_router.put("/profile")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for field in ["display_name", "zodiac_sign", "partner_zodiac", "appearance", "birth_date", "birth_time", "birth_location", "deeply_unlocked", "onboarding_complete"]:
        val = getattr(data, field, None)
        if val is not None:
            update_data[field] = val.lower() if field in ["zodiac_sign", "partner_zodiac"] and isinstance(val, str) else val
    
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": update_data})
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return serialize_doc(user_doc)

# === Pairing System ===

@api_router.post("/pairs/create")
async def create_pair(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if user_doc and user_doc.get("active_pair_id"):
        existing = await db.pairs.find_one({"id": user_doc["active_pair_id"]}, {"_id": 0})
        if existing:
            return {"pair": serialize_doc(existing), "already_exists": True}
    
    code = generate_pair_code()
    while await db.pairs.find_one({"code": code, "status": "PENDING"}):
        code = generate_pair_code()
    
    pair = Pair(code=code, member_a_uid=current_user["uid"], member_a_name=user_doc.get("display_name"))
    pair_dict = pair.model_dump()
    pair_dict["created_at"] = pair_dict["created_at"].isoformat()
    await db.pairs.insert_one(pair_dict)
    
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"active_pair_id": pair.id}})
    
    return {"pair": serialize_doc(pair_dict), "code": code}

@api_router.post("/pairs/join")
async def join_pair(data: JoinPairRequest, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if user_doc and user_doc.get("active_pair_id"):
        raise HTTPException(status_code=400, detail="Already in a pair")
    
    pair = await db.pairs.find_one({"code": data.code.upper(), "status": "PENDING"})
    if not pair:
        raise HTTPException(status_code=404, detail="Pair not found or already active")
    
    if pair["member_a_uid"] == current_user["uid"]:
        raise HTTPException(status_code=400, detail="Cannot join your own pair")
    
    await db.pairs.update_one(
        {"id": pair["id"]},
        {"$set": {"member_b_uid": current_user["uid"], "member_b_name": user_doc.get("display_name"), "status": "ACTIVE"}}
    )
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"active_pair_id": pair["id"]}})
    
    updated_pair = await db.pairs.find_one({"id": pair["id"]}, {"_id": 0})
    return {"pair": serialize_doc(updated_pair)}

@api_router.get("/pairs/me")
async def get_my_pair(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc or not user_doc.get("active_pair_id"):
        return {"pair": None}
    
    pair = await db.pairs.find_one({"id": user_doc["active_pair_id"]}, {"_id": 0})
    
    # Get partner info
    partner = None
    if pair:
        partner_uid = pair["member_b_uid"] if pair["member_a_uid"] == current_user["uid"] else pair["member_a_uid"]
        if partner_uid:
            partner_doc = await db.users.find_one({"supabase_uid": partner_uid}, {"_id": 0, "display_name": 1, "avatar_url": 1, "zodiac_sign": 1})
            partner = serialize_doc(partner_doc) if partner_doc else None
    
    return {"pair": serialize_doc(pair) if pair else None, "partner": partner}

@api_router.post("/pairs/leave")
async def leave_pair(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc or not user_doc.get("active_pair_id"):
        raise HTTPException(status_code=400, detail="Not in a pair")
    
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"active_pair_id": None}})
    return {"left": True}

# === Favorites ===

@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return {"favorites": user_doc.get("favorites", {"music": [], "games": [], "movies": []})}

@api_router.put("/favorites")
async def update_favorites(data: UpdateFavoritesRequest, current_user: dict = Depends(get_current_user)):
    if data.category not in ["music", "games", "movies"]:
        raise HTTPException(status_code=400, detail="Invalid category")
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {f"favorites.{data.category}": data.items}})
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return {"favorites": user_doc.get("favorites", {})}

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
    
    horoscope = {"user_id": current_user["uid"], "date": today, "sign": user_sign, "partner_sign": partner_sign, "sign_info": ZODIAC_SIGNS.get(user_sign, {}), "content": content}
    await db.horoscopes.insert_one(horoscope)
    if "_id" in horoscope:
        del horoscope["_id"]
    return horoscope

@api_router.get("/zodiac-signs")
async def get_zodiac_signs():
    return {"signs": ZODIAC_SIGNS}

@api_router.post("/astrology/generate")
async def generate_astrology(data: GenerateAstrologyRequest, current_user: dict = Depends(get_current_user)):
    prompt = TASK_PROMPTS["astrology"].format(birth_date=data.birth_date, birth_time=data.birth_time or "Unknown", birth_location=data.birth_location or "Unknown")
    result = await generate_ai_text(prompt, f"astrology-{current_user['uid']}", "You are an astrologer. Always respond in valid JSON.")
    
    try:
        import json
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
        {"$set": {"astrology_profile": astro_data, "birth_date": data.birth_date, "birth_time": data.birth_time, "birth_location": data.birth_location, "zodiac_sign": astro_data.get("sun_sign", "").lower()}}
    )
    return {"astrology": astro_data}

# === Daily Question ===

@api_router.get("/daily-question")
async def get_daily_question(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    pair_id = user_doc.get("active_pair_id")
    today = get_today_date()
    
    query = {"date": today}
    if pair_id:
        query["pair_id"] = pair_id
    else:
        query["pair_id"] = None
        query["answers." + current_user["uid"]] = {"$exists": True}
    
    # Try to find existing question for pair
    if pair_id:
        existing = await db.daily_questions.find_one({"pair_id": pair_id, "date": today}, {"_id": 0})
    else:
        existing = await db.daily_questions.find_one({"pair_id": None, "date": today, f"answers.{current_user['uid']}": {"$exists": True}}, {"_id": 0})
    
    if existing:
        return serialize_doc(existing)
    
    question_data = random.choice(DAILY_QUESTIONS)
    new_question = DailyQuestion(pair_id=pair_id, question=question_data["question"], category=question_data["category"], date=today)
    q_dict = new_question.model_dump()
    q_dict["created_at"] = q_dict["created_at"].isoformat()
    await db.daily_questions.insert_one(q_dict)
    return serialize_doc(q_dict)

@api_router.post("/daily-question/answer")
async def answer_daily_question(data: AnswerQuestionRequest, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    pair_id = user_doc.get("active_pair_id")
    today = get_today_date()
    
    query = {"date": today}
    if pair_id:
        query["pair_id"] = pair_id
    
    await db.daily_questions.update_one(query, {"$set": {f"answers.{current_user['uid']}": data.answer}})
    question = await db.daily_questions.find_one(query, {"_id": 0})
    return serialize_doc(question)

@api_router.get("/sparks")
async def get_sparks():
    return {"sparks": random.sample(DEEPLY_PROMPTS if random.random() > 0.7 else DAILY_QUESTIONS, min(5, len(DAILY_QUESTIONS)))}

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
    
    prompt = TASK_PROMPTS["module_exercise"].format(module_title=module["title"], module_description=module["description"], day=data.day, total_days=module["days"], outcomes=", ".join(module["outcomes"]))
    exercise = await generate_ai_text(prompt, f"module-{current_user['uid']}-{data.module_id}-day{data.day}", "You are BentlyAI, a relationship coach.")
    return {"exercise": exercise, "module": module, "day": data.day}

@api_router.post("/modules/{module_id}/complete-day/{day}")
async def complete_module_day(module_id: str, day: int, current_user: dict = Depends(get_current_user)):
    await db.module_progress.update_one({"user_id": current_user["uid"], "module_id": module_id}, {"$addToSet": {"completed_days": day}, "$set": {"current_day": day + 1}})
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
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    event = CalendarEvent(user_id=current_user["uid"], pair_id=user_doc.get("active_pair_id"), title=data.title, date=data.date, time=data.time, description=data.description, event_type=data.event_type)
    e_dict = event.model_dump()
    e_dict["created_at"] = e_dict["created_at"].isoformat()
    await db.calendar_events.insert_one(e_dict)
    return {"event": serialize_doc(e_dict)}

@api_router.delete("/calendar/events/{event_id}")
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    await db.calendar_events.delete_one({"id": event_id, "user_id": current_user["uid"]})
    return {"deleted": event_id}

# === Lists ===

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
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    item = ListItem(user_id=current_user["uid"], pair_id=user_doc.get("active_pair_id"), list_type=data.list_type, text=data.text)
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
        prompt = TASK_PROMPTS["gift_ideas"].format(context=context, partner_info=str(user_doc.get("favorites", {})))
    else:
        raise HTTPException(status_code=400, detail="Invalid list type")
    
    suggestions = await generate_ai_text(prompt, f"list-{current_user['uid']}-{list_type}", "You are BentlyAI, helpful and practical.")
    return {"suggestions": suggestions}

# === Journal ===

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

# === Chat with Media ===

@api_router.get("/chat/messages")
async def get_chat_messages(limit: int = 50, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    pair_id = user_doc.get("active_pair_id")
    
    query = {"pair_id": pair_id} if pair_id else {"sender_uid": current_user["uid"]}
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"messages": [serialize_doc(m) for m in reversed(messages)]}

@api_router.post("/chat/send")
async def send_chat_message(data: SendMessageRequest, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    pair_id = user_doc.get("active_pair_id")
    
    msg = ChatMessage(
        pair_id=pair_id,
        sender_uid=current_user["uid"],
        text=data.text,
        message_type="media" if data.media_data else "user",
        media_url=data.media_data,
        media_type=data.media_type
    )
    m_dict = msg.model_dump()
    m_dict["created_at"] = m_dict["created_at"].isoformat()
    await db.chat_messages.insert_one(m_dict)
    return {"message": serialize_doc(m_dict)}

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
    
    # Get user love language for personalization
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    love_lang_context = ""
    if user_doc and user_doc.get("love_languages"):
        ll = user_doc["love_languages"]
        sorted_ll = sorted(ll.items(), key=lambda x: x[1], reverse=True)
        primary = LOVE_LANGUAGE_LABELS.get(sorted_ll[0][0], sorted_ll[0][0]) if sorted_ll else "unknown"
        secondary = LOVE_LANGUAGE_LABELS.get(sorted_ll[1][0], sorted_ll[1][0]) if len(sorted_ll) > 1 else "unknown"
        love_lang_context = f"\nThis user's primary love language is {primary}, secondary is {secondary}. Tailor advice to match their communication style."

    # Different system prompts for CommonGround vs DeeplyUs
    if data.mode == "deeplyus":
        system_prompt = f"""You are BentlyAI in DeeplyUs mode - helping couples explore their intimate connection, desires, fantasies, and insecurities around sexuality and physical intimacy.
Be open, non-judgmental, warm, and sex-positive. Help them communicate about desires, boundaries, kinks, and insecurities.
Keep responses concise but thoughtful. Never shame. Always emphasize consent and communication.{love_lang_context}"""
    else:
        vibe_instructions = {"soft": "Be gentle, validating, warm.", "realtalk": "Be direct but caring.", "savage": "Be brutally honest."}
        system_prompt = f"""You are BentlyAI, a relationship coach. Help couples communicate better.
Your style: {vibe_instructions.get(data.vibe or 'realtalk', vibe_instructions['realtalk'])}
Keep responses concise (2-4 sentences). Focus on emotional truth. Never be preachy.{love_lang_context}"""
    
    history = session_doc.get("history", [])[-10:]
    history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history])
    
    prompt = f"Conversation:\n{history_str or 'None'}\n\nUSER: {data.message}"
    reply = await generate_ai_text(prompt, session_doc["id"], system_prompt)
    
    history.append({"role": "user", "content": data.message, "ts": datetime.now(timezone.utc).isoformat()})
    history.append({"role": "assistant", "content": reply, "ts": datetime.now(timezone.utc).isoformat()})
    
    await db.sessions.update_one({"id": session_doc["id"]}, {"$set": {"history": history[-50:], "mode": data.mode, "vibe": data.vibe}})
    
    return {"reply": reply, "sessionId": session_doc["id"]}

@api_router.post("/ai")
async def ai_task(data: AITaskRequest, current_user: dict = Depends(get_current_user)):
    task_prompt = TASK_PROMPTS.get(data.task)
    if not task_prompt:
        raise HTTPException(status_code=400, detail=f"Unknown task: {data.task}")
    
    prompt = task_prompt.format(context=data.context, vibe=data.vibe or "direct but caring")
    output = await generate_ai_text(prompt, f"task-{current_user['uid']}-{data.task}", "You are BentlyAI.")
    return {"ok": True, "task": data.task, "output": output}

# === DeeplyUs Mode ===

@api_router.get("/deeply/prompts")
async def get_deeply_prompts(category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc.get("deeply_unlocked"):
        raise HTTPException(status_code=403, detail="DeeplyUs mode is locked")
    
    prompts = DEEPLY_PROMPTS
    if category:
        prompts = [p for p in prompts if p["category"] == category]
    return {"prompts": prompts}

@api_router.get("/deeply/exercises")
async def get_deeply_exercises(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc.get("deeply_unlocked"):
        raise HTTPException(status_code=403, detail="DeeplyUs mode is locked")
    return {"exercises": DEEPLY_EXERCISES}

@api_router.post("/deeply/unlock")
async def unlock_deeply(current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"deeply_unlocked": True}})
    return {"unlocked": True}

@api_router.post("/deeply/items")
async def create_deeply_item(data: DeeplyItemRequest, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc.get("deeply_unlocked"):
        raise HTTPException(status_code=403, detail="DeeplyUs mode is locked")
    
    item = DeeplyItem(pair_id=user_doc.get("active_pair_id"), user_id=current_user["uid"], item_type=data.item_type, text=data.text, shared_with_partner=data.shared_with_partner)
    i_dict = item.model_dump()
    i_dict["created_at"] = i_dict["created_at"].isoformat()
    await db.deeply_items.insert_one(i_dict)
    return {"item": serialize_doc(i_dict)}

@api_router.get("/deeply/items")
async def get_deeply_items(item_type: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc.get("deeply_unlocked"):
        raise HTTPException(status_code=403, detail="DeeplyUs mode is locked")
    
    query = {"user_id": current_user["uid"]}
    if item_type:
        query["item_type"] = item_type
    
    items = await db.deeply_items.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"items": [serialize_doc(i) for i in items]}

@api_router.post("/deeply/ignite")
async def deeply_ignite(context: str = "", vibe: str = "realtalk", current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc.get("deeply_unlocked"):
        raise HTTPException(status_code=403, detail="DeeplyUs mode is locked")
    
    prompt = TASK_PROMPTS["ignite"].format(context=context or "Looking for something fun and intimate", vibe=vibe)
    suggestion = await generate_ai_text(prompt, f"ignite-{current_user['uid']}", "You are BentlyAI for intimate suggestions. Be tasteful, playful, and consensual.")
    return {"suggestion": suggestion}

@api_router.post("/deeply/explore")
async def deeply_explore(topic: str, context: str, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc.get("deeply_unlocked"):
        raise HTTPException(status_code=403, detail="DeeplyUs mode is locked")
    
    if topic == "fantasy":
        prompt = TASK_PROMPTS["deeply_fantasy"].format(context=context)
    elif topic == "insecurity":
        prompt = TASK_PROMPTS["deeply_insecurity"].format(context=context)
    else:
        prompt = TASK_PROMPTS["deeply_exploration"].format(context=context)
    
    response = await generate_ai_text(prompt, f"deeply-{current_user['uid']}-{topic}", "You are BentlyAI in intimate mode. Be open, warm, non-judgmental.")
    return {"response": response}

# === Portraits ===

@api_router.get("/portraits")
async def get_portraits(current_user: dict = Depends(get_current_user)):
    portraits = await db.portraits.find({"user_id": current_user["uid"]}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    return {"portraits": [serialize_doc(p) for p in portraits]}

@api_router.post("/portraits/generate")
async def generate_portrait(data: GeneratePortraitRequest, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    
    # Generate a descriptive prompt for the image
    enhanced_prompt = await generate_ai_text(
        TASK_PROMPTS["portrait_prompt"].format(context=data.prompt, style=data.style),
        f"portrait-prompt-{current_user['uid']}",
        "You are an art director. Create a short, vivid prompt for a romantic couple portrait. Max 200 words. Just the prompt, no explanation."
    )
    
    # Generate actual image using GPT Image 1
    image_data = await generate_ai_image(enhanced_prompt)
    
    portrait = CouplePortrait(pair_id=user_doc.get("active_pair_id"), user_id=current_user["uid"], prompt=data.prompt, style=data.style, image_data=image_data)
    p_dict = portrait.model_dump()
    p_dict["created_at"] = p_dict["created_at"].isoformat()
    p_dict["enhanced_prompt"] = enhanced_prompt
    await db.portraits.insert_one(p_dict)
    if "_id" in p_dict:
        del p_dict["_id"]
    
    return {"portrait": p_dict}

# Include router

# === Love Language Quiz ===

@api_router.get("/love-language/quiz")
async def get_love_language_quiz():
    return {"questions": LOVE_LANGUAGE_QUIZ, "languages": LOVE_LANGUAGE_LABELS}

@api_router.post("/love-language/submit")
async def submit_love_language(data: LoveLanguageSubmitRequest, current_user: dict = Depends(get_current_user)):
    scores = {lang: 0 for lang in LOVE_LANGUAGES}
    for answer in data.answers:
        if answer in scores:
            scores[answer] += 1
    
    sorted_langs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_langs[0][0]
    secondary = sorted_langs[1][0] if len(sorted_langs) > 1 else sorted_langs[0][0]
    
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"love_languages": scores}})
    
    return {
        "scores": scores,
        "primary": primary,
        "primary_label": LOVE_LANGUAGE_LABELS[primary],
        "secondary": secondary,
        "secondary_label": LOVE_LANGUAGE_LABELS[secondary],
    }

@api_router.get("/love-language/results")
async def get_love_language_results(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    ll = user_doc.get("love_languages")
    if not ll:
        return {"completed": False, "scores": None}
    
    sorted_langs = sorted(ll.items(), key=lambda x: x[1], reverse=True)
    primary = sorted_langs[0][0]
    secondary = sorted_langs[1][0] if len(sorted_langs) > 1 else primary
    
    # Try to get partner love languages
    partner_ll = None
    if user_doc.get("active_pair_id"):
        pair = await db.pairs.find_one({"id": user_doc["active_pair_id"]})
        if pair:
            partner_uid = pair["member_b_uid"] if pair["member_a_uid"] == current_user["uid"] else pair.get("member_a_uid")
            if partner_uid:
                partner_doc = await db.users.find_one({"supabase_uid": partner_uid}, {"_id": 0})
                if partner_doc and partner_doc.get("love_languages"):
                    p_sorted = sorted(partner_doc["love_languages"].items(), key=lambda x: x[1], reverse=True)
                    partner_ll = {
                        "scores": partner_doc["love_languages"],
                        "primary": p_sorted[0][0],
                        "primary_label": LOVE_LANGUAGE_LABELS[p_sorted[0][0]],
                    }
    
    return {
        "completed": True,
        "scores": ll,
        "primary": primary,
        "primary_label": LOVE_LANGUAGE_LABELS[primary],
        "secondary": secondary,
        "secondary_label": LOVE_LANGUAGE_LABELS[secondary],
        "partner": partner_ll,
        "labels": LOVE_LANGUAGE_LABELS,
    }

# === Enhanced Astrology ===

@api_router.post("/astrology/deep-dive")
async def astrology_deep_dive(data: AstrologyDeepDiveRequest, current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    partner_info = ""
    if data.partner_birth_date:
        partner_info = f"Partner birth: {data.partner_birth_date}, time: {data.partner_birth_time or 'unknown'}."
    
    prompt = f"""Generate a detailed astrology profile and compatibility reading.
Person: Born {data.birth_date}, time: {data.birth_time or 'unknown'}, location: {data.birth_location or 'unknown'}.
{partner_info}
Partner zodiac: {user_doc.get('partner_zodiac', 'unknown')}.

Return JSON with:
- sun_sign, moon_sign, rising_sign
- element, modality
- personality_summary (3 sentences)
- love_style (2 sentences about how they love)
- compatibility_score (1-100)
- compatibility_summary (3 sentences)
- strengths (list of 3)
- challenges (list of 3)
- advice (1 practical tip)
- weekly_forecast (3 sentences about this week)"""
    
    result = await generate_ai_text(prompt, f"astro-deep-{current_user['uid']}", "You are an expert astrologer. Always respond in valid JSON only.")
    
    try:
        start = result.find('{')
        end = result.rfind('}') + 1
        if start != -1 and end > start:
            astro_data = json.loads(result[start:end])
        else:
            astro_data = {"sun_sign": "unknown", "summary": result}
    except Exception:
        astro_data = {"sun_sign": "unknown", "summary": result}
    
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": {"astrology_profile": astro_data, "birth_date": data.birth_date, "birth_time": data.birth_time, "birth_location": data.birth_location}}
    )
    return {"astrology": astro_data}

# === Partner Sync (Daily Questions) ===

@api_router.get("/daily-question/partner")
async def get_partner_answer(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    pair_id = user_doc.get("active_pair_id")
    if not pair_id:
        return {"partner_answered": False, "partner_answer": None}
    
    today = get_today_date()
    question = await db.daily_questions.find_one({"pair_id": pair_id, "date": today}, {"_id": 0})
    
    if not question or not question.get("answers"):
        return {"partner_answered": False, "partner_answer": None}
    
    # Find partner uid
    pair = await db.pairs.find_one({"id": pair_id})
    partner_uid = pair["member_b_uid"] if pair["member_a_uid"] == current_user["uid"] else pair.get("member_a_uid")
    
    user_answered = current_user["uid"] in question["answers"]
    partner_answered = partner_uid in question["answers"] if partner_uid else False
    
    # Only reveal partner answer if BOTH have answered
    partner_answer = None
    if user_answered and partner_answered:
        partner_answer = question["answers"].get(partner_uid)
    
    return {
        "partner_answered": partner_answered,
        "both_answered": user_answered and partner_answered,
        "partner_answer": partner_answer,
        "question": question.get("question"),
    }

# === Push Notification Subscriptions ===

@api_router.post("/push/subscribe")
async def push_subscribe(data: PushSubscriptionRequest, current_user: dict = Depends(get_current_user)):
    sub_data = {"endpoint": data.endpoint, "keys": data.keys}
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"push_subscription": sub_data}})
    return {"subscribed": True}

@api_router.delete("/push/subscribe")
async def push_unsubscribe(current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"supabase_uid": current_user["uid"]}, {"$set": {"push_subscription": None}})
    return {"unsubscribed": True}

@api_router.get("/push/status")
async def push_status(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return {"enabled": user_doc.get("push_subscription") is not None}

# === Notifications (In-App) ===

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    pair_id = user_doc.get("active_pair_id")
    notifs = []
    today = get_today_date()
    
    # Check if partner answered daily question
    if pair_id:
        question = await db.daily_questions.find_one({"pair_id": pair_id, "date": today})
        if question:
            pair = await db.pairs.find_one({"id": pair_id})
            partner_uid = pair["member_b_uid"] if pair["member_a_uid"] == current_user["uid"] else pair.get("member_a_uid")
            if partner_uid and partner_uid in question.get("answers", {}):
                user_answered = current_user["uid"] in question.get("answers", {})
                if user_answered:
                    notifs.append({"type": "partner_answered", "message": "Your partner answered today's question! See their response.", "date": today})
                else:
                    notifs.append({"type": "partner_waiting", "message": "Your partner already answered today's question. Your turn!", "date": today})
    
    # Check if love language quiz not taken
    if not user_doc.get("love_languages"):
        notifs.append({"type": "love_language", "message": "Take the Love Language Quiz to personalize your BentlyAI experience!", "date": today})
    
    return {"notifications": notifs}

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
