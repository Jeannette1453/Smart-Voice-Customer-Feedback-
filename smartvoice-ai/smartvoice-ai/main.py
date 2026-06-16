from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="SmartVoice AI Service")


class AnalyzeRequest(BaseModel):
    message: str
    category: str | None = None
    subCategory: str | None = None


class AnalyzeResponse(BaseModel):
    feedbackType: str
    sentiment: str
    priority: str
    suggestedDepartment: str
    confidence: float
    summary: str


# ── Word lists ────────────────────────────────────────────────────────────────

POSITIVE_WORDS = [
    "good", "great", "excellent", "helpful", "thank", "thanks", "thank you",
    "happy", "satisfied", "love", "amazing", "nice", "wonderful", "appreciate",
    "appreciated", "best", "perfect", "outstanding", "impressive", "well done",
    "pleased", "glad", "friendly", "professional", "efficient", "fast service",
    "quick", "polite", "kind", "supportive", "recommend", "impressed"
]

NEGATIVE_WORDS = [
    "delay", "late", "problem", "error", "bad", "angry",
    "not working", "failed", "missing", "stuck", "issue", "can't", "cannot",
    "rude", "slow", "frustrating", "disappointed", "terrible", "awful",
    "worst", "unacceptable", "ignored", "no response", "waiting", "overcharged",
    "wrong", "incorrect", "broken", "not received", "never", "useless",
    "incompetent", "unprofessional", "disrespectful", "wasted", "charged twice"
]

# Words that strongly indicate a COMPLIMENT
COMPLIMENT_WORDS = [
    "thank", "thanks", "thank you", "helpful", "great service", "excellent",
    "good service", "happy with", "appreciate", "well done", "outstanding",
    "impressed", "love the service", "best service", "amazing staff",
    "wonderful", "professional", "efficient", "polite", "kind", "friendly",
    "satisfied", "pleased", "glad", "perfect", "recommend", "good job",
    "great job", "awesome", "superb", "brilliant", "fantastic", "well handled"
]

# Words that strongly indicate a SUGGESTION
SUGGESTION_WORDS = [
    "suggest", "improve", "would be better", "should add",
    "could add", "please add", "consider", "it would help", "feature request",
    "wish", "hope", "maybe", "perhaps", "why not", "how about",
    "you should", "you could", "i think you", "it would be nice"
]

# Words that trigger URGENT priority — only for complaints/issues
URGENT_WORDS = [
    "fraud", "lost money", "money missing", "not getting the money",
    "cashing out", "cash out", "stolen", "scam", "emergency", "harassment",
    "threatening", "threat", "security breach", "hacked", "unauthorized",
    "account blocked", "account frozen", "cannot access", "critical",
    "immediately", "right now", "asap", "help me now", "life threatening"
]

HIGH_WORDS = [
    "delay", "late", "not working", "failed", "missing", "stuck", "issue",
    "problem", "error", "broken", "no response", "waiting too long",
    "overcharged", "wrong amount", "incorrect", "charged twice"
]


# ── Detection functions ───────────────────────────────────────────────────────

def detect_sentiment(text: str) -> str:
    t = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in t)
    neg = sum(1 for w in NEGATIVE_WORDS if w in t)

    if pos > neg:
        return "POSITIVE"
    if neg > 0:
        return "NEGATIVE"
    return "NEUTRAL"


def detect_type(text: str) -> str:
    t = text.lower()

    compliment_score = sum(1 for w in COMPLIMENT_WORDS if w in t)
    suggestion_score = sum(1 for w in SUGGESTION_WORDS if w in t)
    neg_score = sum(1 for w in NEGATIVE_WORDS if w in t)

    # Compliment wins if it has more signals than negative
    if compliment_score > 0 and compliment_score >= neg_score:
        return "COMPLIMENT"

    # Suggestion
    if suggestion_score > 0 and neg_score == 0:
        return "SUGGESTION"

    if any(w in t for w in ["survey", "rating", "questionnaire", "feedback form"]):
        return "SURVEY"

    # Default — COMPLAINT is the safe fallback (valid Java enum value)
    return "COMPLAINT"


def detect_department(text: str) -> str:
    t = text.lower()

    if any(w in t for w in ["loan", "borrow", "lending", "repayment", "installment"]):
        return "Loans"
    if any(w in t for w in ["mobile app", "app", "login", "password", "otp", "system", "website", "portal", "online"]):
        return "IT"
    if any(w in t for w in ["cash out", "cashing out", "money", "charge", "charges", "balance", "fee", "transfer", "deposit", "withdraw"]):
        return "Accounts"
    if any(w in t for w in ["atm", "card", "debit", "credit"]):
        return "Cards/ATM"
    if any(w in t for w in ["branch", "staff", "service", "customer care", "helpful", "agent", "teller"]):
        return "Customer Care"
    return "Customer Care"


def detect_priority(text: str, sentiment: str, feedback_type: str) -> str:
    t = text.lower()

    # COMPLIMENT and SUGGESTION are ALWAYS LOW — no exceptions
    if feedback_type in ("COMPLIMENT", "SUGGESTION", "SURVEY"):
        return "LOW"

    # Only check urgent/high words for complaints
    if any(w in t for w in URGENT_WORDS):
        return "URGENT"

    if any(w in t for w in HIGH_WORDS):
        return "HIGH"

    if sentiment == "NEGATIVE":
        return "HIGH"

    return "MEDIUM"


def compute_confidence(text: str, feedback_type: str, sentiment: str) -> float:
    t = text.lower()
    signals = 0
    total = 2

    if feedback_type == "COMPLIMENT" and any(w in t for w in COMPLIMENT_WORDS):
        signals += 1
    elif feedback_type == "COMPLAINT" and any(w in t for w in NEGATIVE_WORDS):
        signals += 1
    elif feedback_type == "SUGGESTION" and any(w in t for w in SUGGESTION_WORDS):
        signals += 1

    if sentiment == "POSITIVE" and any(w in t for w in POSITIVE_WORDS):
        signals += 1
    elif sentiment == "NEGATIVE" and any(w in t for w in NEGATIVE_WORDS):
        signals += 1

    base = signals / total
    return round(0.65 + base * 0.32, 2)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    text = f"{req.category or ''} {req.subCategory or ''} {req.message or ''}".strip()

    feedback_type = detect_type(text)
    sentiment = detect_sentiment(text)
    department = detect_department(text)
    priority = detect_priority(text, sentiment, feedback_type)
    confidence = compute_confidence(text, feedback_type, sentiment)

    summary = (
        f"{feedback_type.title()} — {sentiment.lower()} sentiment, "
        f"routed to {department} with {priority.lower()} priority."
    )

    return {
        "feedbackType": feedback_type,
        "sentiment": sentiment,
        "priority": priority,
        "suggestedDepartment": department,
        "confidence": confidence,
        "summary": summary
    }
