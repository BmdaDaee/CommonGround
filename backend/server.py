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
from datetime import datetime, timezone
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase config
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
SUPABASE_SECRET_KEY = os.environ.get('SUPABASE_SECRET_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(title="CommonGround API")

# Create routers
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supabase_uid: str
    email: str
    display_name: Optional[str] = None
    active_pair_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Pair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    status: str = "PENDING"  # PENDING, ACTIVE
    member_a_uid: str
    member_b_uid: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pair_id: str
    sender_uid: str
    text: str
    message_type: str = "user"  # user, assistant, system, callout
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mode: str = "commonground"  # commonground, deeplyus
    vibe: str = "realtalk"  # soft, realtalk, savage
    tone_state: Optional[Dict[str, Any]] = None
    pattern_tracker: Dict[str, Any] = Field(default_factory=lambda: {"counts": {}, "topic_counts": {}, "fired_topics": {}})
    history: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response models
class CreatePairRequest(BaseModel):
    pass

class JoinPairRequest(BaseModel):
    code: str

class SendMessageRequest(BaseModel):
    message_id: Optional[str] = None
    text: str

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

# ============== AUTH ==============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Supabase JWT and return user info."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication")
    
    try:
        # Use secret key for backend verification if available
        api_key = SUPABASE_SECRET_KEY or SUPABASE_ANON_KEY
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {credentials.credentials}",
                    "apikey": api_key,
                },
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return {"uid": user_data["id"], "email": user_data.get("email", ""), "token": credentials.credentials}
            else:
                logger.error(f"Auth verification failed: {response.status_code} - {response.text}")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except httpx.RequestError as e:
        logger.error(f"Auth request error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

# ============== HELPERS ==============

def generate_pair_code() -> str:
    """Generate a 6-character pair code."""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def serialize_doc(doc: dict) -> dict:
    """Serialize MongoDB document for JSON response."""
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != '_id'}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result

# ============== PERSONA ENGINE ==============

CALLOUTS = {
    "money|money|tired": "I'm noticing a pattern: when money comes up, you get tired and shut down. That makes sense, but it also keeps the stress stuck. One small decision today is better than avoiding it altogether.",
    "conflict|conflict|overwhelmed": "I'm noticing a pattern: when things get tense, you call it being overwhelmed and go quiet. That pause can help, but only if you come back and say what you're actually feeling.",
    "intimacy|intimacy|numb": "I'm noticing a pattern: when intimacy comes up, you say you feel numb and pull away. That's understandable, but it also keeps you disconnected from what you want to feel.",
}

TOPIC_DEFAULT_CALLOUT_KEY = {
    "money": "money|money|tired",
    "conflict": "conflict|conflict|overwhelmed",
    "intimacy": "intimacy|intimacy|numb",
}

def infer_mode(text: str, current_mode: str = "checkin") -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ["money", "bills", "rent", "pay", "job", "income"]):
        return "money"
    if any(w in text_lower for w in ["fight", "argue", "conflict", "tension", "mad", "angry"]):
        return "conflict"
    if any(w in text_lower for w in ["sex", "intimacy", "affection", "touch", "disconnect", "numb"]):
        return "intimacy"
    return current_mode or "checkin"

def detect_tone_state(message: str, session: dict) -> dict:
    text = message.lower()
    mode = infer_mode(text, session.get("mode", "checkin"))
    topic = mode
    emotion = "neutral"
    tone_mode = "steady"
    
    if any(w in text for w in ["tired", "exhausted", "drained"]):
        emotion = "tired"
    if any(w in text for w in ["overwhelmed", "too much", "shutdown", "freeze", "avoid", "panic"]):
        emotion = "overwhelmed"
    if any(w in text for w in ["numb", "disconnected", "nothing", "empty"]):
        emotion = "numb"
    
    if emotion == "numb":
        tone_mode = "push"
    
    return {"mode": mode, "topic": topic, "emotion": emotion, "tone_mode": tone_mode}

def check_pattern_callout(session: dict, tone_state: dict) -> Optional[dict]:
    key = f"{tone_state['mode']}|{tone_state['topic']}|{tone_state['emotion']}"
    topic = tone_state['topic']
    
    tracker = session.get("pattern_tracker", {"counts": {}, "topic_counts": {}, "fired_topics": {}})
    
    tracker["counts"][key] = tracker["counts"].get(key, 0) + 1
    tracker["topic_counts"][topic] = tracker["topic_counts"].get(topic, 0) + 1
    
    if tracker.get("fired_topics", {}).get(topic):
        return None
    
    if tracker["topic_counts"][topic] == 3:
        best_key = key if key in CALLOUTS else TOPIC_DEFAULT_CALLOUT_KEY.get(topic)
        text = CALLOUTS.get(best_key)
        
        if not text:
            return None
        
        tracker["fired_topics"][topic] = True
        session["pattern_tracker"] = tracker
        
        return {"key": best_key, "topic": topic, "text": text}
    
    session["pattern_tracker"] = tracker
    return None

def get_system_prompt(vibe: str = "realtalk", callout_shown: bool = False) -> str:
    vibe_instructions = {
        "soft": "Be gentle, validating, and warm. Use soft language and lots of affirmation.",
        "realtalk": "Be direct but caring. Call things out when needed, but always with love.",
        "savage": "Be brutally honest. No sugarcoating. Say what needs to be said.",
    }
    
    base = f"""You are Shantell, a relationship coach AI. You help couples communicate better.

Your style: {vibe_instructions.get(vibe, vibe_instructions['realtalk'])}

Guidelines:
- Keep responses concise (2-4 sentences usually)
- Focus on emotional truth, not fixing
- Ask questions that invite reflection
- Never be preachy or lecture-y
- Use natural, conversational language
"""
    
    if callout_shown:
        base += "\nA pattern insight was just shown. Acknowledge it briefly if relevant, but don't make it the whole response."
    
    return base

async def generate_ai_response(prompt: str, session_id: str) -> str:
    """Generate AI response using Emergent LLM."""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=prompt.split("USER:")[0].strip() if "USER:" in prompt else ""
        )
        chat.with_model("openai", "gpt-4o")
        
        user_message = prompt.split("USER:")[-1].split("ASSISTANT:")[0].strip() if "USER:" in prompt else prompt
        
        response = await chat.send_message(UserMessage(text=user_message))
        return response
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        return "I'm having trouble connecting right now. Let's try again in a moment."

# ============== TASK PROMPTS ==============

TASK_PROMPTS = {
    "draft_reply": """You're helping someone craft a thoughtful reply to their partner.

Context they shared:
{context}

Vibe: {vibe}

Write a reply they could send. Make it sound like THEM, not a therapist. Keep it real, honest, and emotionally intelligent. 2-4 sentences max.""",

    "vent_analysis": """Someone just vented to you about a relationship situation.

What they said:
{context}

Vibe: {vibe}

Break down what's happening:
1. What they're feeling (the real emotion under the surface)
2. What their partner might be feeling
3. The gap between them
4. One thing they could try

Keep it short and actionable. No lectures.""",

    "date_plan": """Help plan a meaningful date or quality time activity.

What they shared:
{context}

Vibe: {vibe}

Suggest something specific they could do together. Consider their energy level and what might actually help them connect. Give them a concrete plan they could do THIS WEEK.""",

    "spark": """Create a conversation starter or question that could spark a meaningful moment.

Context:
{context}

Vibe: {vibe}

Give them ONE question or prompt they could bring up with their partner. Something that invites real sharing without feeling like therapy homework.""",

    "note": """Help write a short, heartfelt note to their partner.

Context:
{context}

Vibe: {vibe}

Write something they could text or say. Make it feel genuine, not cheesy. 1-3 sentences.""",
}

# ============== ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "CommonGround API", "status": "ok"}

@api_router.get("/health")
async def health():
    return {"ok": True, "service": "commonground-api"}

# === Auth/Profile Routes ===

@api_router.post("/auth/session")
async def create_session(current_user: dict = Depends(get_current_user)):
    """Verify token and ensure user profile exists."""
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    
    if not user_doc:
        new_user = UserProfile(
            supabase_uid=current_user["uid"],
            email=current_user["email"]
        )
        await db.users.insert_one(new_user.model_dump())
        user_doc = new_user.model_dump()
    
    return {"uid": current_user["uid"], "user": serialize_doc(user_doc)}

@api_router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user_doc)

@api_router.put("/profile")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    """Update user profile."""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.display_name:
        update_data["display_name"] = data.display_name
    
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": update_data}
    )
    
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]}, {"_id": 0})
    return serialize_doc(user_doc)

# === Pairing Routes ===

@api_router.post("/pairs")
async def create_pair(current_user: dict = Depends(get_current_user)):
    """Create a new pair."""
    # Check if user already has active pair
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if user_doc and user_doc.get("active_pair_id"):
        raise HTTPException(status_code=409, detail="user_already_paired")
    
    # Generate unique code
    code = generate_pair_code()
    while await db.pairs.find_one({"code": code, "status": "PENDING"}):
        code = generate_pair_code()
    
    pair = Pair(code=code, member_a_uid=current_user["uid"])
    pair_dict = pair.model_dump()
    pair_dict["created_at"] = pair_dict["created_at"].isoformat()
    pair_dict["updated_at"] = pair_dict["updated_at"].isoformat()
    
    await db.pairs.insert_one(pair_dict)
    
    # Update user's active pair
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": {"active_pair_id": pair.id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"pairId": pair.id, "code": code}

@api_router.post("/pairs/join")
async def join_pair(data: JoinPairRequest, current_user: dict = Depends(get_current_user)):
    """Join an existing pair with code."""
    # Check if user already has active pair
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if user_doc and user_doc.get("active_pair_id"):
        raise HTTPException(status_code=409, detail="user_already_paired")
    
    # Find pending pair with code
    pair_doc = await db.pairs.find_one({"code": data.code.upper(), "status": "PENDING"})
    if not pair_doc:
        raise HTTPException(status_code=404, detail="pair_not_found")
    
    if pair_doc.get("member_a_uid") == current_user["uid"]:
        raise HTTPException(status_code=400, detail="cannot_join_own_pair")
    
    # Update pair
    await db.pairs.update_one(
        {"id": pair_doc["id"]},
        {"$set": {
            "member_b_uid": current_user["uid"],
            "status": "ACTIVE",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update both users
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": {"active_pair_id": pair_doc["id"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"pairId": pair_doc["id"], "status": "ACTIVE"}

@api_router.get("/pairs/me")
async def get_my_pair(current_user: dict = Depends(get_current_user)):
    """Get current user's active pair."""
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc or not user_doc.get("active_pair_id"):
        return {"pair": None}
    
    pair_doc = await db.pairs.find_one({"id": user_doc["active_pair_id"]}, {"_id": 0})
    return {"pair": serialize_doc(pair_doc)}

@api_router.post("/pairs/leave")
async def leave_pair(current_user: dict = Depends(get_current_user)):
    """Leave current pair."""
    user_doc = await db.users.find_one({"supabase_uid": current_user["uid"]})
    if not user_doc or not user_doc.get("active_pair_id"):
        raise HTTPException(status_code=400, detail="not_paired")
    
    pair_id = user_doc["active_pair_id"]
    
    # Clear user's pair
    await db.users.update_one(
        {"supabase_uid": current_user["uid"]},
        {"$set": {"active_pair_id": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"left": True, "pairId": pair_id}

# === Chat Routes ===

@api_router.post("/chat/{pair_id}/send")
async def send_message(pair_id: str, data: SendMessageRequest, current_user: dict = Depends(get_current_user)):
    """Send a message in a pair chat."""
    # Verify user is in this pair
    pair_doc = await db.pairs.find_one({"id": pair_id})
    if not pair_doc:
        raise HTTPException(status_code=404, detail="pair_not_found")
    
    if current_user["uid"] not in [pair_doc.get("member_a_uid"), pair_doc.get("member_b_uid")]:
        raise HTTPException(status_code=403, detail="not_in_pair")
    
    message = ChatMessage(
        id=data.message_id or str(uuid.uuid4()),
        pair_id=pair_id,
        sender_uid=current_user["uid"],
        text=data.text
    )
    
    msg_dict = message.model_dump()
    msg_dict["created_at"] = msg_dict["created_at"].isoformat()
    
    # Idempotent insert
    existing = await db.messages.find_one({"id": message.id})
    if not existing:
        await db.messages.insert_one(msg_dict)
    
    return {"message": serialize_doc(msg_dict)}

@api_router.get("/chat/{pair_id}/list")
async def list_messages(pair_id: str, limit: int = 50, before: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """List messages in a pair chat."""
    # Verify user is in this pair
    pair_doc = await db.pairs.find_one({"id": pair_id})
    if not pair_doc:
        raise HTTPException(status_code=404, detail="pair_not_found")
    
    if current_user["uid"] not in [pair_doc.get("member_a_uid"), pair_doc.get("member_b_uid")]:
        raise HTTPException(status_code=403, detail="not_in_pair")
    
    query = {"pair_id": pair_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Determine author type for each message
    for msg in messages:
        if msg.get("message_type") == "system":
            msg["authorType"] = "system"
        elif msg.get("sender_uid") == current_user["uid"]:
            msg["authorType"] = "self"
        else:
            msg["authorType"] = "partner"
    
    return {"messages": [serialize_doc(m) for m in reversed(messages)]}

# === AI Chat Routes ===

@api_router.post("/chat")
async def ai_chat(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    """AI persona chat endpoint."""
    # Get or create session
    session_doc = await db.sessions.find_one({"user_id": current_user["uid"]})
    
    if not session_doc:
        session = Session(user_id=current_user["uid"], mode=data.mode or "commonground", vibe=data.vibe or "realtalk")
        session_dict = session.model_dump()
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["updated_at"] = session_dict["updated_at"].isoformat()
        await db.sessions.insert_one(session_dict)
        session_doc = session_dict
    
    # Update mode/vibe if provided
    if data.mode:
        session_doc["mode"] = data.mode
    if data.vibe:
        session_doc["vibe"] = data.vibe
    
    # Detect tone state and check for pattern callout
    tone_state = detect_tone_state(data.message, session_doc)
    callout = check_pattern_callout(session_doc, tone_state)
    
    # Build prompt
    system_prompt = get_system_prompt(session_doc.get("vibe", "realtalk"), callout_shown=bool(callout))
    
    history_str = "\n".join([
        f"{m['role'].upper()}: {m['content']}"
        for m in session_doc.get("history", [])[-10:]  # Last 10 messages
    ])
    
    prompt = f"""{system_prompt}

Conversation so far:
{history_str or "None"}

USER: {data.message}
ASSISTANT:"""
    
    # Generate response
    reply = await generate_ai_response(prompt, session_doc["id"])
    
    # Update session
    history = session_doc.get("history", [])
    history.append({"role": "user", "content": data.message, "ts": datetime.now(timezone.utc).isoformat()})
    history.append({"role": "assistant", "content": reply, "ts": datetime.now(timezone.utc).isoformat()})
    
    await db.sessions.update_one(
        {"id": session_doc["id"]},
        {"$set": {
            "history": history[-50:],  # Keep last 50 messages
            "tone_state": tone_state,
            "mode": session_doc.get("mode", "commonground"),
            "pattern_tracker": session_doc.get("pattern_tracker", {}),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    meta = {"callout": callout} if callout else {}
    
    return {
        "reply": reply,
        "toneState": tone_state,
        "sessionId": session_doc["id"],
        "meta": meta
    }

@api_router.post("/ai")
async def ai_task(data: AITaskRequest, current_user: dict = Depends(get_current_user)):
    """AI task endpoint (Draft Reply, Break It Down, etc.)."""
    task_prompt = TASK_PROMPTS.get(data.task)
    if not task_prompt:
        raise HTTPException(status_code=400, detail=f"Unknown task: {data.task}")
    
    vibe_desc = {"soft": "gentle and validating", "realtalk": "direct but caring", "savage": "brutally honest"}
    
    prompt = task_prompt.format(
        context=data.context,
        vibe=vibe_desc.get(data.vibe, "direct but caring")
    )
    
    session_id = f"task-{current_user['uid']}-{data.task}"
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="You are Shantell, a relationship coach. Help couples communicate better."
        )
        chat.with_model("openai", "gpt-4o")
        
        output = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "ok": True,
            "task": data.task,
            "output": output,
            "sessionId": session_id
        }
    except Exception as e:
        logger.error(f"AI task error: {e}")
        raise HTTPException(status_code=500, detail="ai_task_failed")

@api_router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get session details."""
    session_doc = await db.sessions.find_one({"id": session_id, "user_id": current_user["uid"]}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=404, detail="session_not_found")
    return serialize_doc(session_doc)

# Include router
app.include_router(api_router)

# CORS middleware
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
