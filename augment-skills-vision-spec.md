# Augment Skills: Vision Specification Document

**Version:** 1.0  
**Date:** February 2026  
**Status:** Vision & Architecture Specification

---

## Executive Summary

Augment Skills is a data-driven sales enablement platform that answers the fundamental question for sales leadership: **"Are we ready to sell?"**

Unlike traditional learning management systems that track course completions, Augment Skills creates a comprehensive skills intelligence system that:

1. **Validates skills** through multiple internal activities (AI role-play, assessments, certifications)
2. **Observes real-world performance** through customer interactions (Gong call analysis, deal outcomes)
3. **Personalizes enablement** based on individual gaps and upcoming customer contexts
4. **Proves ROI** by correlating training investments to field performance and revenue outcomes

The platform prioritizes **field observations as ground truth** - if a sales engineer demonstrates strong discovery skills in actual customer calls, they don't need to complete training activities for vanity metrics. Conversely, the system detects when practice performance doesn't translate to field effectiveness and triggers targeted interventions.

---

## Problem Statement

### Current State Challenges

**For Sales Leadership (CRO, VP Sales):**
- No visibility into team readiness across competencies, industries, and deal contexts
- Cannot quantify if enablement investments translate to revenue
- Reactive to skill gaps only after deals are lost

**For Sales Managers:**
- Rely on gut feel to assess rep capabilities
- Cannot identify struggling reps until performance issues are severe
- No data-driven guidance on coaching priorities

**For Enablement Teams:**
- Track course completions, not actual skill development
- Cannot prove training effectiveness or ROI
- Create one-size-fits-all programs instead of personalized learning

**For Sales Engineers / Solution Architects:**
- Assigned to deals without context-specific preparation
- Generic training that doesn't match their actual gaps
- Busy schedules mean training happens too late or not at all

### The Augment Skills Approach

**Ground Truth from the Field:**
Real customer interactions (via Gong analysis) serve as the primary signal of skill proficiency. Internal validation activities (role-play, tests) are secondary signals used when field data is absent or to prepare for new contexts.

**Context-Aware Skills:**
Skills are tracked not just generically ("discovery") but with context dimensions (industry, deal size, buyer persona, product line). A rep might be excellent at enterprise discovery in fintech but need support for healthcare mid-market deals.

**Just-in-Time Enablement:**
The system monitors upcoming customer meetings (via SFDC/calendar integration) and automatically assigns personalized enablement when context-specific skill gaps are detected. Joe gets a 15-minute healthcare podcast before his Acme Health call, not a 4-hour generic course.

**Closed-Loop Intelligence:**
Learning → Validation → Field Performance → Deal Outcomes form a complete feedback loop. The system learns which training interventions actually translate to better customer interactions and closed deals.

---

## Core Principles

### 1. Field Performance is Ground Truth
- Real customer interactions (Gong calls) always trump practice scores
- Don't require training for vanity metrics if field performance is strong
- Detect when practice doesn't translate to field effectiveness

### 2. Context Matters
- Skills tracked with dimensions: competency × industry × deal size × buyer persona × product
- "Discovery" in healthcare enterprise differs from fintech SMB
- Personalized enablement based on specific upcoming deal context

### 3. Just-in-Time Over Just-in-Case
- Trigger enablement when there's an immediate need (upcoming meeting)
- Short, targeted content (15-min podcasts) over hours of generic courses
- Respect that reps are busy - only assign what's essential

### 4. Data-Driven Decisions
- Every enablement decision backed by skill gap analysis
- Correlation analytics prove training ROI
- Predictive indicators for deal risk based on skill readiness

### 5. Privacy and Psychological Safety
- Role-based data access (individuals see own data, managers see directs, leadership sees all)
- Constructive feedback focused on development, not punishment
- Confidence indicators show data quality (low confidence ratings handled carefully)

---

## Target Users & Use Cases

### Sales Leadership (CRO, VP Sales, Regional Directors)

**Primary Question:** "Are we ready to sell?"

**Key Use Cases:**
- **Team Readiness Dashboard:** View organization-wide skill coverage by competency and context
- **Gap Analysis:** Identify critical skill gaps across the team (e.g., "Only 40% of SEs validated on Product X")
- **ROI Visibility:** See correlation between enablement spend and revenue outcomes
- **Strategic Planning:** Determine hiring needs based on skill inventory vs. pipeline demands

**Success Metrics:**
- Skill validation coverage: 80%+ of SEs validated in core competencies
- Training ROI: Demonstrate measurable revenue impact per training dollar
- Predictive readiness: Forecast deal risk based on SE skill alignment

---

### Sales Managers

**Primary Question:** "Which reps need help, and with what?"

**Key Use Cases:**
- **Individual Rep Profiles:** Deep-dive into each SE's skill strengths and gaps
- **Coaching Priorities:** Data-driven guidance on where to focus 1:1 coaching
- **Performance Trends:** Track skill progression over time (improving, stable, declining)
- **Deal Risk Alerts:** Notification when rep assigned to deal outside their validated context
- **Team Comparisons:** Benchmark individuals against team averages

**Success Metrics:**
- Time to competency: Reduce new hire ramp time by 30%
- Early intervention: Identify struggling reps 60 days earlier via practice trends
- Coaching effectiveness: Measure skill improvement post-coaching sessions

---

### Enablement Teams

**Primary Question:** "Is our training actually working?"

**Key Use Cases:**
- **Content Effectiveness Analysis:** Correlation between specific training and field performance
- **Personalized Learning Paths:** Auto-assign targeted content based on individual gaps
- **Curriculum Optimization:** Identify which training sequences yield best outcomes
- **Skill Taxonomy Management:** Define competencies, contexts, validation rules
- **Program ROI:** Prove value of enablement investments with revenue correlation

**Success Metrics:**
- Training effectiveness: +15pt average improvement in field scores post-training
- Completion rates: 80%+ completion of just-in-time assignments
- ROI proof: $X revenue attributed per training hour invested

---

### Sales Engineers / Solution Architects

**Primary Question:** "What do I need to prepare for this deal?"

**Key Use Cases:**
- **Personal Skill Profile:** Self-assessment view of validated skills and gaps
- **Targeted Assignments:** Receive just-in-time enablement for upcoming meetings
- **Progress Tracking:** See skill development over time
- **Self-Service Learning:** Browse available content to address personal growth areas
- **Context Preparation:** Get account/industry-specific briefings before customer calls

**Success Metrics:**
- Just-in-time completion: 75%+ of triggered enablement completed before meetings
- Field performance: Consistent 80+ scores on real customer interactions
- Deal progression: Deals with prepared SEs advance faster through pipeline

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Augment Skills LMS                      │
│  (Skills System of Record + Intelligence Layer)         │
│                                                          │
│  • Employee skill ratings (competency × context)        │
│  • Observation aggregation & correlation                │
│  • Intervention triggers & workflow orchestration       │
│  • Reporting & analytics engine                         │
└─────────────────────────────────────────────────────────┘
              ▲                    ▲                    ▲
              │                    │                    │
         VALIDATION           FIELD OBSERVATIONS    LEARNING
              │                    │                    │
      ┌───────┴───────┐      ┌─────┴─────┐      ┌─────┴──────┐
      │ Voice         │      │ Gong      │      │ Video      │
      │ Role-Play     │      │ Parser    │      │ Platform   │
      │               │      │           │      │            │
      │ Test/Quiz     │      │ SFDC      │      │ Podcast    │
      │ Platform      │      │ Connector │      │ Generator  │
      │               │      │           │      │            │
      │ Certification │      │ Email     │      │ Docs       │
      │ Exams         │      │ Analysis  │      │ Links      │
      └───────────────┘      └───────────┘      └────────────┘
           (Direct              (Middleware         (Direct
            API calls)           services)          API calls)
```

### Core Components

#### 1. LMS Core (Skills System of Record)

**Technology Stack:**
- **Database:** PostgreSQL 14 (primary operational database)
- **Cache/Queue:** Redis 7 (session management, job queues via Bull)
- **Backend:** Node.js/Express with TypeScript
- **Frontend:** Next.js 14 with React 18, Tailwind CSS
- **Authentication:** Google OAuth 2.0 (Passport.js) + admin fallback
- **Hosting:** Google Cloud Platform (GCP)

**Key Responsibilities:**
- Store and calculate employee skill ratings across all competency × context dimensions
- Aggregate observations from validation activities and field performance
- Apply configurable skill achievement rules and validation logic
- Trigger personalized enablement based on context signals
- Generate reports and dashboards for all user roles
- Manage user authentication and role-based access control

**Database Architecture:**
- **Operational Database (PostgreSQL):** Real-time transactional data, current skill ratings, active assignments
- **Analytical Database (Future):** Time-series data warehouse for historical analysis, correlation studies, ML training

#### 2. Validation Apps (Direct Integration)

**Voice Role-Play Application:**
- **Current State:** Existing GCP-hosted application with UI for scenario-based practice
- **Integration:** Direct API calls to LMS using GCP service accounts (Workload Identity)
- **Data Flow:** POST session results with competency scores immediately upon completion
- **Authentication:** GCP-native service-to-service auth (no API keys)

**Test/Quiz Platform (Future):**
- Multiple-choice assessments, product knowledge checks, certification exams
- Direct API integration to LMS
- Sends overall score + competency-level breakdowns

**Hands-On Labs (Future):**
- Practical technical exercises (build demo environments, configure integrations)
- Completion status + skill validation results sent to LMS

#### 3. Middleware Layer (3rd Party Integrations)

**Purpose:** Parse, enrich, and normalize data from external systems before sending to LMS

**Gong Middleware:**
- Fetches call recordings and transcripts via Gong API
- Uses Claude AI to analyze calls and score competencies (discovery, objections, value articulation, etc.)
- Extracts deal context (industry, deal size, buyer personas discussed)
- POST enriched observations to LMS
- Runs on schedule (batch daily) or triggered by webhooks

**SFDC Middleware:**
- Monitors opportunity assignments and meeting schedules
- Enriches with account context (industry, size, products)
- Detects upcoming meetings and triggers just-in-time enablement
- POST deal assignments and context signals to LMS
- Writes deal outcome data (closed/won, revenue) back for correlation

**Email Analysis Middleware (Future):**
- Analyzes customer email threads for competency demonstration
- Supplements Gong call data with written communication skills
- POST observations to LMS

**Architecture Pattern:**
- Each middleware service is independent (separate Cloud Run services or Cloud Functions)
- Abstract implementation details - focus on input/output contracts
- All middleware authenticates to LMS via GCP service accounts
- No 3rd party system has direct LMS database access

#### 4. Learning Content (Links Only)

**Philosophy:** No content management system. Augment Skills points to external content.

**Supported Content Types:**
- Video platforms (YouTube, Vimeo, internal video hosting)
- Documentation (Confluence, Google Docs, Notion)
- AI-generated podcasts (existing podcast curation system)
- Battlecards and sales collateral (links to files/pages)
- External courses (Udemy, LinkedIn Learning, etc.)

**Integration:**
- Learning platforms POST activity completion to LMS API
- LMS stores metadata (started_at, completed_at, completion_percentage, quiz scores)
- LMS does NOT host or serve content files

---

## Data Model

### Core Entities

#### Employee Skills (System of Record)

```typescript
interface EmployeeSkill {
  skill_id: string;           // UUID
  employee_id: string;        // email or unique identifier
  
  // Competency definition
  competency: string;         // discovery, objection_handling, closing, product_knowledge, etc.
  
  // Context dimensions (nullable = applies generally)
  industry?: string;          // healthcare, fintech, manufacturing, retail, etc.
  deal_size?: string;         // enterprise, mid-market, smb
  buyer_persona?: string;     // technical, executive, procurement
  product_line?: string;      // product-x, platform, security-module, etc.
  
  // Current skill rating
  current_rating: number;     // 0-100 score (ground truth)
  confidence_level: string;   // high, medium, low, unknown
  trend: string;              // improving, stable, declining
  
  // Supporting data
  last_validation_date: Date;        // Most recent internal validation activity
  last_field_observation_date: Date; // Most recent real customer interaction
  observations_count: number;        // Total data points contributing to rating
  last_updated: Date;
  
  // Skill lifecycle (configurable per skill type)
  expires_at?: Date;          // For time-sensitive skills (product versions, compliance)
  requires_recertification: boolean;
}
```

**Key Design Decisions:**
- Skills are multi-dimensional (competency × context)
- Examples:
  - `{joe, discovery, healthcare, enterprise, technical, null}` → 85 (high confidence)
  - `{joe, discovery, fintech, null, null, null}` → 70 (medium confidence)
  - `{joe, discovery, null, null, null, null}` → 78 (overall/general)
- Context fields nullable = applies broadly
- Ground truth score (0-100) with confidence indicator
- Configurable expiration for perishable skills

---

#### Validation Events

```typescript
interface ValidationEvent {
  event_id: string;           // UUID
  employee_id: string;
  
  // Event metadata
  event_type: string;         // role_play, multiple_choice_test, certification_exam, hands_on_lab
  event_source: string;       // voice-roleplay, quiz-platform, cert-system
  timestamp: Date;
  
  // Scoring
  overall_score: number;      // 0-100
  passed: boolean;            // Met minimum threshold
  
  // Competency-level detail
  competency_scores: Array<{
    competency: string;
    score: number;            // 0-100
    context?: {               // Optional context demonstrated
      industry?: string;
      deal_size?: string;
      buyer_persona?: string;
      product_line?: string;
    };
  }>;
  
  // Rich context
  details_url: string;        // Link to full session results, recording, transcript
  session_metadata: {
    duration_seconds: number;
    scenario_id?: string;
    attempt_number?: number;
    certification_eligible: boolean;
  };
}
```

**Example Payloads:**

**Voice Role-Play Session:**
```json
{
  "event_id": "evt_abc123",
  "employee_id": "joe@augmentcode.com",
  "event_type": "role_play",
  "event_source": "voice-roleplay",
  "timestamp": "2026-02-10T14:30:00Z",
  "overall_score": 82,
  "passed": true,
  "competency_scores": [
    {"competency": "discovery", "score": 85},
    {"competency": "objection_handling", "score": 78},
    {"competency": "value_articulation", "score": 83}
  ],
  "details_url": "gs://roleplay-results/session-abc123.json",
  "session_metadata": {
    "duration_seconds": 420,
    "scenario_id": "enterprise-discovery-tech-buyer",
    "attempt_number": 3,
    "certification_eligible": false
  }
}
```

**Product Knowledge Quiz:**
```json
{
  "event_id": "evt_xyz789",
  "employee_id": "sarah@augmentcode.com",
  "event_type": "multiple_choice_quiz",
  "event_source": "quiz-platform",
  "timestamp": "2026-02-11T09:15:00Z",
  "overall_score": 92,
  "passed": true,
  "competency_scores": [
    {
      "competency": "product_knowledge",
      "score": 94,
      "context": {"product_line": "platform"}
    },
    {
      "competency": "technical_architecture",
      "score": 90,
      "context": {"product_line": "platform"}
    }
  ],
  "details_url": "https://quiz-platform/results/xyz789",
  "session_metadata": {
    "duration_seconds": 1200,
    "questions_total": 25,
    "questions_correct": 23
  }
}
```

---

#### Field Observations

```typescript
interface FieldObservation {
  observation_id: string;     // UUID
  employee_id: string;
  
  // Observation source
  observation_source: string; // gong, salesloft, email_analysis
  source_id: string;          // call-12345, email-thread-789
  timestamp: Date;
  
  // Competency scoring (from AI analysis)
  competency_scores: Array<{
    competency: string;
    score: number;            // 0-100
    evidence?: string;        // "Successfully addressed budget concerns using ROI framework"
  }>;
  
  // Deal context
  context: {
    account_name: string;
    industry?: string;
    deal_size?: string;
    deal_stage?: string;      // discovery, demo, technical_validation, negotiation
    buyer_personas?: string[];
    products_discussed?: string[];
  };
  
  // Rich detail
  source_url: string;         // Link to Gong recording, email thread, etc.
  analysis_metadata: {
    model_used?: string;      // claude-sonnet-4-5
    confidence_score?: number;
    human_reviewed?: boolean;
  };
}
```

**Example Payload (Gong Call Analysis):**
```json
{
  "observation_id": "obs_gong_456",
  "employee_id": "joe@augmentcode.com",
  "observation_source": "gong",
  "source_id": "call-gong-98765",
  "timestamp": "2026-02-09T14:30:00Z",
  "competency_scores": [
    {
      "competency": "discovery",
      "score": 78,
      "evidence": "Asked 7/10 key discovery questions, identified technical and business pain"
    },
    {
      "competency": "objection_handling",
      "score": 85,
      "evidence": "Effectively addressed budget concerns with ROI calculator"
    },
    {
      "competency": "product_knowledge",
      "score": 92,
      "evidence": "Accurately explained integration architecture and limitations"
    }
  ],
  "context": {
    "account_name": "Acme Health",
    "industry": "healthcare",
    "deal_size": "enterprise",
    "deal_stage": "technical_discovery",
    "buyer_personas": ["technical_architect", "ciso"],
    "products_discussed": ["platform", "security-module"]
  },
  "source_url": "https://app.gong.io/call/98765",
  "analysis_metadata": {
    "model_used": "claude-sonnet-4-5",
    "confidence_score": 0.89,
    "human_reviewed": false
  }
}
```

---

#### Learning Activities

```typescript
interface LearningActivity {
  activity_id: string;        // UUID
  employee_id: string;
  
  // Activity metadata
  activity_type: string;      // video, course, documentation, podcast, battlecard
  content_id: string;         // Unique identifier for content piece
  content_title: string;
  content_url: string;        // External link (no file hosting)
  
  // Completion tracking
  started_at: Date;
  completed_at?: Date;
  completion_percentage: number; // 0-100
  
  // Assessment (if applicable)
  quiz_score?: number;        // 0-100
  quiz_passed?: boolean;
  
  // Skill alignment
  related_competencies: string[]; // Which skills this content develops
  context_tags?: {            // Optional context focus
    industry?: string[];
    product_line?: string[];
  };
  
  // Assignment context
  assignment_type: string;    // self_serve, manager_assigned, auto_triggered
  trigger_reason?: string;    // "upcoming_healthcare_meeting", "skill_gap_detected"
  due_date?: Date;
}
```

**Example Payload (Just-in-Time Podcast):**
```json
{
  "activity_id": "act_podcast_123",
  "employee_id": "joe@augmentcode.com",
  "activity_type": "podcast",
  "content_id": "healthcare-discovery-primer",
  "content_title": "Healthcare Discovery in 15 Minutes",
  "content_url": "https://podcast-gen/healthcare-discovery-joe-20260210",
  "started_at": "2026-02-10T16:00:00Z",
  "completed_at": "2026-02-10T16:18:00Z",
  "completion_percentage": 100,
  "related_competencies": ["discovery", "healthcare_knowledge"],
  "context_tags": {
    "industry": ["healthcare"]
  },
  "assignment_type": "auto_triggered",
  "trigger_reason": "upcoming_healthcare_meeting_acme_health",
  "due_date": "2026-02-11T09:00:00Z"
}
```

---

#### Deal Outcomes (SFDC Integration)

```typescript
interface DealOutcome {
  deal_id: string;            // Salesforce Opportunity ID
  employee_id: string;        // Primary SE assigned
  
  // Account context
  account_name: string;
  industry?: string;
  deal_size_tier?: string;    // enterprise, mid-market, smb
  
  // Opportunity details
  opportunity_name: string;
  deal_value: number;         // USD
  product_lines: string[];
  
  // Buyer context
  primary_buyer_persona?: string;
  decision_makers?: Array<{
    name: string;
    title: string;
    persona: string;
  }>;
  
  // Timeline
  se_assigned_date: Date;
  created_date: Date;
  close_date?: Date;
  
  // Outcome
  stage: string;              // discovery, demo, technical_validation, proposal, closed_won, closed_lost
  closed_won: boolean;
  closed_lost_reason?: string;
  
  // SE involvement
  demo_calls_conducted: number;
  technical_deep_dives: number;
  poc_delivered: boolean;
}
```

---

#### Deal Skill Snapshots

```typescript
interface DealSkillSnapshot {
  snapshot_id: string;        // UUID
  deal_id: string;
  employee_id: string;
  created_at: Date;           // Typically at SE assignment
  
  // Skills at time of assignment
  skill_ratings: Array<{
    competency: string;
    context_match: boolean;   // Did SE have relevant context experience?
    rating: number;           // Skill level at assignment (0-100)
    confidence: string;       // high, medium, low, unknown
  }>;
  
  // Risk assessment
  overall_readiness_score: number;  // 0-100
  gaps_identified: Array<{
    competency: string;
    context: string;          // Missing industry/product experience
    severity: string;         // critical, high, medium, low
  }>;
}
```

**Purpose:** Capture SE skill state at deal assignment for correlation analysis later

---

### Skill Rating Calculation Logic

**Core Principle:** Field observations are ground truth. Internal validation activities are secondary signals.

**Calculation Algorithm:**

```typescript
function calculateSkillRating(
  employee_id: string,
  competency: string,
  context: {industry?, deal_size?, buyer_persona?, product_line?}
): {rating: number, confidence: string} {
  
  // 1. Fetch all observations for this skill (last 90 days)
  const observations = getObservations(employee_id, competency, context);
  
  // 2. Separate field vs. validation observations
  const fieldObs = observations.filter(o => o.source_type === 'field');
  const validationObs = observations.filter(o => o.source_type === 'validation');
  
  // 3. If sufficient field data exists, prioritize it
  if (fieldObs.length >= 3) {
    // Weighted average: more recent = higher weight
    const weightedScore = calculateWeightedAverage(fieldObs, {
      recencyWeight: 0.4,  // Recent observations matter more
      volumeWeight: 0.6
    });
    
    return {
      rating: weightedScore,
      confidence: fieldObs.length >= 10 ? 'high' : 'medium'
    };
  }
  
  // 4. If limited field data, blend with validation
  if (fieldObs.length > 0 && validationObs.length > 0) {
    const blendedScore = (
      calculateWeightedAverage(fieldObs) * 0.7 +  // Field weighted 2:1
      calculateWeightedAverage(validationObs) * 0.3
    );
    
    return {
      rating: blendedScore,
      confidence: 'medium'
    };
  }
  
  // 5. Only validation data available (new hire, new context)
  if (validationObs.length >= 2) {
    return {
      rating: calculateWeightedAverage(validationObs),
      confidence: validationObs.length >= 5 ? 'medium' : 'low'
    };
  }
  
  // 6. Insufficient data
  return {
    rating: null,
    confidence: 'unknown'
  };
}
```

**Key Principles:**
- **3+ field observations:** Use field data exclusively (high confidence if 10+)
- **Mixed data:** Blend field (70%) and validation (30%)
- **Validation only:** Use for preliminary rating (lower confidence)
- **Recency matters:** More recent observations weighted higher
- **Context matching:** Prefer observations from same context (healthcare discovery vs. general discovery)

---

### Skill Achievement Rules (Configurable)

Enablement admins can configure rules per skill type:

```typescript
interface SkillAchievementRule {
  competency: string;
  
  // Validation requirements
  min_validation_attempts?: number;    // e.g., 3 role-play sessions
  min_validation_score?: number;       // e.g., 80+ average
  
  // Field requirements
  min_field_observations?: number;     // e.g., 5 customer calls
  min_field_score?: number;            // e.g., 75+
  
  // Time constraints
  observation_window_days: number;     // Only count last X days (e.g., 90)
  
  // Skill lifecycle
  expires_after_days?: number;         // Skill needs refresh (product knowledge)
  decay_rate?: number;                 // Gradual decline if not practiced
  requires_recertification: boolean;
  
  // Override logic
  field_overrides_validation: boolean; // If true, strong field performance = validated even without internal practice
}
```

**Example Configurations:**

**Discovery (General Sales Skill):**
```json
{
  "competency": "discovery",
  "min_validation_attempts": 3,
  "min_validation_score": 80,
  "min_field_observations": 3,
  "min_field_score": 75,
  "observation_window_days": 90,
  "expires_after_days": null,
  "field_overrides_validation": true
}
```
*Translation: Complete 3 role-plays averaging 80+, OR demonstrate 75+ in 3 real calls. Field performance can validate without practice.*

**Product Knowledge (Perishable Skill):**
```json
{
  "competency": "product_knowledge",
  "context": {"product_line": "platform-v2"},
  "min_validation_attempts": 1,
  "min_validation_score": 85,
  "min_field_observations": 2,
  "min_field_score": 80,
  "observation_window_days": 60,
  "expires_after_days": 180,
  "requires_recertification": true,
  "field_overrides_validation": false
}
```
*Translation: Pass certification exam (85+) AND demonstrate in 2 customer calls (80+). Expires after 6 months, requires re-cert.*

---

## Integration Architecture

### Phase 1: Validation API Integration

**Objective:** Enable validation apps (voice role-play, testing platforms) to send results to LMS.

**API Endpoints:**

#### POST /api/v1/validation-events
Submit results from validation activities (role-play, tests, certifications).

**Authentication:** GCP service account (Workload Identity) for internal apps

**Request Body:**
```json
{
  "employee_id": "joe@augmentcode.com",
  "event_type": "role_play | multiple_choice_test | certification_exam | hands_on_lab",
  "event_source": "voice-roleplay | quiz-platform | cert-system",
  "timestamp": "2026-02-10T14:30:00Z",
  "overall_score": 82,
  "passed": true,
  "competency_scores": [
    {
      "competency": "discovery",
      "score": 85,
      "context": {
        "industry": "healthcare",
        "deal_size": "enterprise"
      }
    }
  ],
  "details_url": "gs://roleplay-results/session-123.json",
  "session_metadata": {
    "duration_seconds": 420,
    "scenario_id": "enterprise-discovery",
    "certification_eligible": false
  }
}
```

**Response:**
```json
{
  "validation_id": "val_abc123",
  "employee_id": "joe@augmentcode.com",
  "skill_updates": [
    {
      "competency": "discovery",
      "context": {"industry": "healthcare", "deal_size": "enterprise"},
      "previous_rating": 78,
      "new_rating": 82,
      "confidence": "medium",
      "status": "in_progress"
    }
  ],
  "next_recommended_activities": [
    {
      "activity_type": "role_play",
      "scenario_id": "healthcare-objection-handling",
      "reason": "Complete 2 more healthcare scenarios for validation"
    }
  ]
}
```

**Processing Logic:**
1. Validate incoming data (required fields, score ranges)
2. Store validation event in database
3. Update employee skill ratings based on new observation
4. Check skill achievement rules (is skill now validated?)
5. Return updated skill status and recommendations

---

#### GET /api/v1/employees/{employee_id}/skills
Retrieve employee's current skill profile.

**Use Case:** Voice role-play app fetches Joe's skills to recommend next practice scenario.

**Response:**
```json
{
  "employee_id": "joe@augmentcode.com",
  "skills": [
    {
      "competency": "discovery",
      "context": {"industry": "healthcare"},
      "current_rating": 82,
      "confidence": "medium",
      "status": "in_progress",
      "observations_count": 5,
      "last_updated": "2026-02-10T14:30:00Z"
    },
    {
      "competency": "objection_handling",
      "context": null,
      "current_rating": 88,
      "confidence": "high",
      "status": "validated",
      "observations_count": 12,
      "last_updated": "2026-02-05T10:15:00Z"
    }
  ],
  "gaps_identified": [
    {
      "competency": "discovery",
      "context": {"industry": "fintech"},
      "severity": "medium",
      "recommendation": "Complete fintech discovery role-play"
    }
  ]
}
```

---

### Phase 2: Skill Achievement Logic

**Objective:** Define and implement configurable rules for skill validation.

**Admin UI Features:**
- Create/edit skill definitions (competency name, description)
- Configure achievement rules per skill (min attempts, scores, timeframes)
- Set context dimensions (which industries, deal sizes, personas apply)
- Define skill lifecycle (expiration, decay, recertification requirements)
- Preview impact of rule changes on current employee skill statuses

**Database Schema:**
```sql
CREATE TABLE skill_definitions (
  skill_id UUID PRIMARY KEY,
  competency VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR, -- sales_technique, product_knowledge, industry_expertise, soft_skills
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE skill_achievement_rules (
  rule_id UUID PRIMARY KEY,
  skill_id UUID REFERENCES skill_definitions(skill_id),
  
  -- Context applicability
  applies_to_industry VARCHAR,
  applies_to_deal_size VARCHAR,
  applies_to_buyer_persona VARCHAR,
  applies_to_product_line VARCHAR,
  
  -- Validation requirements
  min_validation_attempts INT,
  min_validation_score INT,
  
  -- Field requirements
  min_field_observations INT,
  min_field_score INT,
  
  -- Time constraints
  observation_window_days INT,
  expires_after_days INT,
  
  -- Logic
  field_overrides_validation BOOLEAN DEFAULT true,
  requires_recertification BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Validation Engine:**
Run nightly (or on-demand) to recalculate all employee skill statuses based on rules.

```typescript
// Pseudo-code for validation engine
async function recalculateEmployeeSkills(employee_id: string) {
  const allSkills = await getSkillDefinitions();
  
  for (const skill of allSkills) {
    const rules = await getAchievementRules(skill.skill_id);
    
    for (const rule of rules) {
      // Get context-specific observations
      const observations = await getObservations(
        employee_id,
        skill.competency,
        rule.context,
        rule.observation_window_days
      );
      
      // Apply rule logic
      const meetsValidation = checkValidationRequirements(observations.validation, rule);
      const meetsField = checkFieldRequirements(observations.field, rule);
      
      // Determine status
      let status = 'not_started';
      if (rule.field_overrides_validation && meetsField) {
        status = 'validated';
      } else if (meetsValidation && meetsField) {
        status = 'validated';
      } else if (meetsValidation || meetsField) {
        status = 'in_progress';
      }
      
      // Update skill rating
      await updateEmployeeSkill(employee_id, skill.competency, rule.context, {
        status,
        current_rating: calculateRating(observations),
        confidence: determineConfidence(observations),
        last_updated: new Date()
      });
    }
  }
}
```

---

### Phase 3: Gong Integration & Parsing

**Objective:** Automatically analyze customer calls and post field observations to LMS.

**Architecture:**

```
┌─────────────────────┐
│   Gong Platform     │
│  (Call Recordings   │
│   & Transcripts)    │
└──────────┬──────────┘
           │ Gong API
           ▼
┌─────────────────────┐
│  Gong Middleware    │  (Cloud Run Service)
│  • Fetch calls      │
│  • AI analysis      │
│  • Score comps      │
│  • Extract context  │
└──────────┬──────────┘
           │ LMS API (service account auth)
           ▼
┌─────────────────────┐
│  Augment Skills LMS │
│  (Field Observations)│
└─────────────────────┘
```

**Gong Middleware Responsibilities:**

1. **Call Discovery:**
   - Fetch recent calls via Gong API (scheduled batch or webhook triggers)
   - Filter for calls with SE participation
   - Deduplicate (don't re-process analyzed calls)

2. **Transcript Retrieval:**
   - Download call transcript and metadata
   - Extract speaker identification (map SE to employee_id)

3. **AI Analysis (Claude):**
   - Prompt Claude to analyze call for competency demonstration
   - Score discovery, objections, value articulation, listening, closing
   - Extract deal context (industry, deal stage, buyer personas)
   - Generate evidence snippets for each competency score

4. **Observation Posting:**
   - POST enriched field observation to LMS
   - Include competency scores, context, source URL, confidence metadata

**Example AI Prompt for Call Analysis:**

```
You are analyzing a sales call between a Sales Engineer and a prospect.

Call Context:
- Account: Acme Health
- Industry: Healthcare
- Deal Stage: Technical Discovery
- Participants: Joe (SE), Dr. Sarah Chen (CISO), Mark Williams (CTO)

Transcript:
[Full transcript provided]

Task: Score the Sales Engineer's performance on the following competencies (0-100):

1. Discovery: Asking insightful questions to uncover technical and business needs
2. Objection Handling: Addressing concerns and turning them into opportunities
3. Value Articulation: Clearly explaining how the solution solves problems
4. Listening: Active listening, acknowledging concerns, not interrupting
5. Product Knowledge: Accurate explanation of features, limitations, architecture

For each competency:
- Provide a score (0-100)
- Brief evidence (1-2 sentences explaining the score)

Also identify:
- Deal context: industry, deal size (enterprise/mid-market/smb), buyer personas present
- Overall assessment: Is the SE well-prepared for this context?

Return JSON format:
{
  "competency_scores": [
    {"competency": "discovery", "score": 85, "evidence": "..."},
    ...
  ],
  "context": {
    "industry": "healthcare",
    "deal_size": "enterprise",
    "buyer_personas": ["technical_architect", "ciso"]
  },
  "analysis_confidence": 0.92
}
```

**API Call to LMS:**

```json
POST /api/v1/field-observations
{
  "employee_id": "joe@augmentcode.com",
  "observation_source": "gong",
  "source_id": "call-gong-98765",
  "timestamp": "2026-02-09T14:30:00Z",
  "competency_scores": [
    {
      "competency": "discovery",
      "score": 85,
      "evidence": "Asked 8 targeted questions about current CI/CD process and pain points"
    },
    {
      "competency": "objection_handling",
      "score": 78,
      "evidence": "Addressed budget concerns but could have quantified ROI more clearly"
    },
    {
      "competency": "product_knowledge",
      "score": 92,
      "evidence": "Accurately explained integration architecture and HIPAA compliance features"
    }
  ],
  "context": {
    "account_name": "Acme Health",
    "industry": "healthcare",
    "deal_size": "enterprise",
    "deal_stage": "technical_discovery",
    "buyer_personas": ["technical_architect", "ciso"],
    "products_discussed": ["platform", "security-module"]
  },
  "source_url": "https://app.gong.io/call/98765",
  "analysis_metadata": {
    "model_used": "claude-sonnet-4-5",
    "confidence_score": 0.92,
    "human_reviewed": false
  }
}
```

**Scheduling:**
- **Initial implementation:** Batch process daily (analyze all calls from previous day)
- **Future:** Real-time webhooks (analyze within hours of call completion)
- **Manual triggers:** Managers can request re-analysis of specific calls

---

### Phase 4: Validation-to-Field Correlation

**Objective:** Prove that internal training translates to improved field performance.

**Analytics Queries:**

#### 1. Training Effectiveness Analysis

**Question:** Do reps who complete discovery training show improved discovery scores in customer calls?

```sql
WITH training_cohort AS (
  -- Reps who completed discovery training
  SELECT 
    employee_id,
    completed_at as training_date
  FROM learning_activities
  WHERE content_id = 'discovery-fundamentals'
    AND completed_at > '2025-06-01'
),
pre_post_validation AS (
  -- Validation scores before/after training
  SELECT 
    tc.employee_id,
    AVG(CASE 
      WHEN ve.timestamp < tc.training_date 
      THEN (ve.competency_scores->>'discovery')::int 
    END) as pre_training_validation,
    AVG(CASE 
      WHEN ve.timestamp > tc.training_date 
      THEN (ve.competency_scores->>'discovery')::int 
    END) as post_training_validation
  FROM training_cohort tc
  JOIN validation_events ve ON tc.employee_id = ve.employee_id
  WHERE ve.timestamp BETWEEN tc.training_date - INTERVAL '30 days' 
                         AND tc.training_date + INTERVAL '30 days'
  GROUP BY tc.employee_id
),
pre_post_field AS (
  -- Field scores before/after training
  SELECT 
    tc.employee_id,
    AVG(CASE 
      WHEN fo.timestamp < tc.training_date 
      THEN (fo.competency_scores->>'discovery')::int 
    END) as pre_training_field,
    AVG(CASE 
      WHEN fo.timestamp > tc.training_date 
      THEN (fo.competency_scores->>'discovery')::int 
    END) as post_training_field
  FROM training_cohort tc
  JOIN field_observations fo ON tc.employee_id = fo.employee_id
  WHERE fo.timestamp BETWEEN tc.training_date - INTERVAL '60 days' 
                         AND tc.training_date + INTERVAL '60 days'
  GROUP BY tc.employee_id
)
SELECT 
  ppv.employee_id,
  ppv.pre_training_validation,
  ppv.post_training_validation,
  ppv.post_training_validation - ppv.pre_training_validation as validation_lift,
  ppf.pre_training_field,
  ppf.post_training_field,
  ppf.post_training_field - ppf.pre_training_field as field_lift
FROM pre_post_validation ppv
JOIN pre_post_field ppf ON ppv.employee_id = ppf.employee_id
WHERE ppv.post_training_validation IS NOT NULL 
  AND ppf.post_training_field IS NOT NULL;
```

**Output:**
```
employee_id          | pre_val | post_val | val_lift | pre_field | post_field | field_lift
---------------------|---------|----------|----------|-----------|------------|------------
joe@augmentcode.com  | 72      | 88       | +16      | 68        | 82         | +14
sarah@...            | 80      | 92       | +12      | 78        | 85         | +7
```

**Dashboard Visualization:**
- **Training ROI Card:** "Discovery training → +15pt avg field performance lift"
- **Cohort comparison:** Chart showing trained vs. untrained rep performance over time
- **Time-to-impact:** "Field improvement visible within 14 days of training"

---

#### 2. Just-in-Time Enablement Effectiveness

**Question:** Does personalized enablement before customer meetings improve call outcomes?

```sql
WITH jit_assignments AS (
  -- Just-in-time enablement assignments
  SELECT 
    employee_id,
    content_id,
    completed_at,
    related_competencies,
    trigger_reason
  FROM learning_activities
  WHERE assignment_type = 'auto_triggered'
    AND trigger_reason LIKE '%upcoming_meeting%'
    AND completed_at IS NOT NULL
),
subsequent_calls AS (
  -- Calls that happened after JIT enablement
  SELECT 
    jit.employee_id,
    jit.content_id,
    jit.related_competencies,
    fo.competency_scores,
    fo.context,
    fo.timestamp as call_timestamp,
    jit.completed_at as training_completed
  FROM jit_assignments jit
  JOIN field_observations fo ON jit.employee_id = fo.employee_id
  WHERE fo.timestamp BETWEEN jit.completed_at AND jit.completed_at + INTERVAL '7 days'
)
SELECT 
  employee_id,
  related_competencies,
  AVG((competency_scores->>related_competencies[1])::int) as avg_score_post_jit,
  COUNT(*) as calls_analyzed
FROM subsequent_calls
GROUP BY employee_id, related_competencies;
```

**Dashboard Visualization:**
- **JIT Completion Rate:** "78% of triggered enablement completed before meetings"
- **Effectiveness:** "Reps who complete JIT enablement score +12pts higher in subsequent calls"
- **Context match:** "Healthcare podcasts → 88% avg healthcare call scores"

---

### Phase 5: Learning Activities API

**Objective:** Enable learning platforms to report activity completion to LMS.

**API Endpoint:**

#### POST /api/v1/learning-activities
Report learning activity completion (video watched, course finished, documentation read).

**Authentication:** Service account (internal apps) or OAuth (external platforms)

**Request Body:**
```json
{
  "employee_id": "joe@augmentcode.com",
  "activity_type": "video | course | documentation | podcast | battlecard",
  "content_id": "healthcare-discovery-primer",
  "content_title": "Healthcare Discovery in 15 Minutes",
  "content_url": "https://podcast-gen/healthcare-discovery-joe",
  "started_at": "2026-02-10T16:00:00Z",
  "completed_at": "2026-02-10T16:18:00Z",
  "completion_percentage": 100,
  "quiz_score": 88,
  "quiz_passed": true,
  "related_competencies": ["discovery", "healthcare_knowledge"],
  "context_tags": {
    "industry": ["healthcare"]
  },
  "assignment_type": "auto_triggered | manager_assigned | self_serve",
  "trigger_reason": "upcoming_healthcare_meeting_acme_health",
  "due_date": "2026-02-11T09:00:00Z"
}
```

**Response:**
```json
{
  "activity_id": "act_abc123",
  "employee_id": "joe@augmentcode.com",
  "status": "completed",
  "skill_impact": [
    {
      "competency": "discovery",
      "context": {"industry": "healthcare"},
      "preliminary_rating": 75,
      "confidence": "low",
      "recommendation": "Complete 2 healthcare role-plays to validate"
    }
  ],
  "next_steps": [
    {
      "activity_type": "role_play",
      "scenario": "healthcare-discovery-call",
      "reason": "Validate learning from podcast"
    }
  ]
}
```

**Processing Logic:**
1. Record learning activity completion
2. Update employee skill preliminary ratings (if no validation/field data exists)
3. Check if activity satisfies any assignment requirements
4. Recommend next logical step in learning path

---

### Phase 6: SFDC Integration & Personalized Enablement

**Objective:** Trigger just-in-time enablement when SE assigned to deals outside validated context.

**Architecture:**

```
┌──────────────────────┐
│  Salesforce          │
│  • Opportunities     │
│  • Calendar Events   │
└──────────┬───────────┘
           │ SFDC API / Webhooks
           ▼
┌──────────────────────┐
│  SFDC Middleware     │  (Cloud Run Service)
│  • Monitor opps      │
│  • Enrich context    │
│  • Detect meetings   │
└──────────┬───────────┘
           │ LMS API
           ▼
┌──────────────────────┐
│  Augment Skills LMS  │
│  • Match skills      │
│  • Trigger enablement│
│  • Notify SE         │
└──────────────────────┘
```

**Trigger Scenarios:**

#### Scenario 1: SE Assigned to Opportunity

**SFDC Event:** Opportunity SE field changed

**Middleware Processing:**
1. Fetch opportunity details (account, industry, products, deal size)
2. Fetch upcoming activities/meetings for this opportunity
3. POST deal assignment to LMS

**API Call:**

```json
POST /api/v1/deal-assignments
{
  "deal_id": "opp_sfdc_12345",
  "employee_id": "joe@augmentcode.com",
  "account": {
    "name": "Acme Health",
    "industry": "healthcare",
    "size": "enterprise",
    "headquarters": "Boston, MA"
  },
  "opportunity": {
    "name": "Acme Health - Platform Expansion",
    "value": 500000,
    "stage": "discovery",
    "products": ["platform", "security-module"],
    "timeline": "Q1 2026 close"
  },
  "next_meeting": {
    "date": "2026-02-15T10:00:00Z",
    "type": "technical_discovery",
    "attendees": [
      {"name": "Dr. Sarah Chen", "title": "CISO", "persona": "technical_security"},
      {"name": "Mark Williams", "title": "CTO", "persona": "technical_executive"}
    ]
  }
}
```

**LMS Processing:**
1. Fetch Joe's current skills
2. Identify gaps: Joe has no `healthcare × enterprise × technical_security` experience
3. Check next meeting: 3 days away (sufficient time for enablement)
4. Trigger personalized enablement:

**Enablement Assignment:**
```json
{
  "assignments": [
    {
      "assignment_id": "assign_123",
      "employee_id": "joe@augmentcode.com",
      "assignment_type": "auto_triggered",
      "trigger_reason": "upcoming_healthcare_meeting_acme_health",
      "priority": "high",
      "due_date": "2026-02-14T17:00:00Z",
      "activities": [
        {
          "activity_type": "podcast",
          "content_id": "healthcare-discovery-primer",
          "content_title": "Healthcare Discovery in 15 Minutes",
          "content_url": "https://podcast-gen/healthcare-discovery-joe-20260212",
          "estimated_duration": "15min",
          "reason": "No healthcare discovery experience detected"
        },
        {
          "activity_type": "battlecard",
          "content_title": "HIPAA Compliance Talking Points",
          "content_url": "https://content-repo/hipaa-compliance-battlecard",
          "estimated_duration": "5min",
          "reason": "Healthcare regulatory knowledge gap"
        },
        {
          "activity_type": "call_recording",
          "content_title": "Top healthcare discovery call (Sarah's example)",
          "content_url": "https://gong/call/best-healthcare-discovery-98765",
          "estimated_duration": "12min",
          "reason": "Learn from top performer in similar context"
        }
      ]
    }
  ],
  "risk_assessment": {
    "overall_risk": "medium",
    "factors": [
      {"factor": "No healthcare experience", "severity": "high"},
      {"factor": "Strong general discovery skills (85)", "severity": "mitigating"},
      {"factor": "3 days to prepare", "severity": "sufficient"}
    ],
    "recommendations": [
      "Consider pairing Joe with healthcare-experienced SE for first call",
      "Schedule 30min prep session with manager"
    ]
  },
  "manager_notification": {
    "notify": true,
    "message": "Joe assigned to $500K healthcare deal with limited context experience. JIT enablement triggered. Review risk assessment."
  }
}
```

---

#### Scenario 2: Meeting Scheduled (No Opportunity Assignment Yet)

**Trigger:** Calendar event created with external attendee (prospect)

**Use Case:** Discovery call scheduled before formal opportunity created

**Processing:**
- Enrich meeting with available context (account website, LinkedIn, news)
- Check SE skills against inferred industry/context
- Trigger lighter enablement (industry primer, recent news)

---

**Notification to SE:**

In-app notification:
```
🎯 New Assignment: Prepare for Acme Health Meeting

Meeting: Feb 15, 10:00 AM (3 days away)
Account: Acme Health (Healthcare, Enterprise)
Attendees: Dr. Sarah Chen (CISO), Mark Williams (CTO)

📚 Recommended Prep (30 minutes total):
✅ Healthcare Discovery Primer (15min podcast) - Due: Feb 14, 5pm
✅ HIPAA Compliance Battlecard (5min read)
✅ Example Call: Sarah's healthcare discovery (12min)

⚠️ Skill Gap Detected:
Your healthcare discovery experience is limited. These materials will help you prepare.

💡 Pro Tip: Schedule 30min with your manager to review healthcare pain points.
```

Weekly Manager Digest (Email):
```
Weekly Enablement Digest - Feb 10-16, 2026

🎯 Just-in-Time Enablement Triggered:

• Joe Smith - Acme Health (Healthcare, $500K)
  - Gap: No healthcare experience
  - Assigned: Healthcare discovery primer + battlecards
  - Due: Feb 14 (before meeting)
  - Status: 2/3 completed ✅
  - Risk: Medium (strong general skills, sufficient prep time)

• Sarah Johnson - Fintech Corp (Fintech, $250K)
  - Gap: Limited fintech product knowledge
  - Assigned: Product X fintech use cases
  - Status: Completed ✅
  - Risk: Low

⚠️ Skill Gaps Requiring Attention:

• Discovery (Healthcare context): 4 SEs below threshold
  → Recommendation: Schedule healthcare discovery workshop
  
📊 This Week's Activity:
• 12 JIT assignments triggered
• 10 completed on time (83%)
• +14pt avg improvement in subsequent calls
```

---

### Phase 7: SFDC ROI Correlation

**Objective:** Connect training investments to revenue outcomes.

**Data Requirements:**
- Deal outcomes from SFDC (closed/won, revenue, timeline)
- Skill snapshots at deal assignment
- Training activities completed during deal cycle
- Field observations from customer interactions

**Analytics Queries:**

#### 1. Win Rate by Skill Readiness

**Question:** Do deals with skill-matched SEs close at higher rates?

```sql
WITH deal_readiness AS (
  SELECT 
    do.deal_id,
    do.employee_id,
    do.closed_won,
    do.deal_value,
    do.industry,
    dss.overall_readiness_score,
    dss.gaps_identified
  FROM deal_outcomes do
  JOIN deal_skill_snapshots dss ON do.deal_id = dss.deal_id
  WHERE do.se_assigned_date > '2025-06-01'
)
SELECT 
  CASE 
    WHEN overall_readiness_score >= 80 THEN 'High Readiness'
    WHEN overall_readiness_score >= 60 THEN 'Medium Readiness'
    ELSE 'Low Readiness'
  END as readiness_tier,
  COUNT(*) as total_deals,
  SUM(CASE WHEN closed_won THEN 1 ELSE 0 END) as won_deals,
  ROUND(AVG(CASE WHEN closed_won THEN 1 ELSE 0 END)::numeric * 100, 1) as win_rate,
  SUM(CASE WHEN closed_won THEN deal_value ELSE 0 END) as revenue_won
FROM deal_readiness
GROUP BY readiness_tier
ORDER BY readiness_tier DESC;
```

**Output:**
```
readiness_tier     | total_deals | won_deals | win_rate | revenue_won
-------------------|-------------|-----------|----------|-------------
High Readiness     | 42          | 28        | 66.7%    | $8,400,000
Medium Readiness   | 68          | 34        | 50.0%    | $5,100,000
Low Readiness      | 35          | 10        | 28.6%    | $1,200,000
```

**Dashboard Visualization:**
- **Win Rate Correlation:** Bar chart showing win rates by readiness tier
- **Revenue Impact:** "High-readiness deals win at 2.3x rate of low-readiness"
- **Confidence Interval:** Statistical significance of correlation

---

#### 2. Training ROI by Deal Outcome

**Question:** What's the revenue return on training investments?

```sql
WITH training_cost_per_employee AS (
  SELECT 
    employee_id,
    COUNT(*) * 1.5 as training_hours, -- Assume 1.5hr avg per activity
    COUNT(*) * 100 as training_cost_estimate -- $100/hr blended cost
  FROM learning_activities
  WHERE completed_at BETWEEN '2025-06-01' AND '2025-12-31'
  GROUP BY employee_id
),
post_training_revenue AS (
  SELECT 
    do.employee_id,
    SUM(CASE WHEN do.closed_won THEN do.deal_value ELSE 0 END) as revenue_won
  FROM deal_outcomes do
  WHERE do.se_assigned_date BETWEEN '2025-06-01' AND '2025-12-31'
  GROUP BY do.employee_id
)
SELECT 
  tc.employee_id,
  tc.training_hours,
  tc.training_cost_estimate,
  ptr.revenue_won,
  ROUND((ptr.revenue_won / NULLIF(tc.training_cost_estimate, 0))::numeric, 2) as roi_ratio
FROM training_cost_per_employee tc
JOIN post_training_revenue ptr ON tc.employee_id = ptr.employee_id
ORDER BY roi_ratio DESC;
```

**Dashboard Visualization:**
- **Aggregate ROI:** "$2.4M revenue attributed to $145K training investment = 16.5x ROI"
- **Per-SE breakdown:** "Joe: 8 training hours → $850K revenue → 85x ROI"
- **Content effectiveness:** "Healthcare training → $1.2M in healthcare deals"

---

#### 3. Specific Training Program Impact

**Question:** Did the Q3 2025 Discovery Bootcamp improve win rates?

```sql
WITH bootcamp_cohort AS (
  SELECT DISTINCT employee_id, completed_at as bootcamp_date
  FROM learning_activities
  WHERE content_id = 'q3-2025-discovery-bootcamp'
),
pre_post_deals AS (
  SELECT 
    bc.employee_id,
    SUM(CASE 
      WHEN do.se_assigned_date < bc.bootcamp_date AND do.closed_won 
      THEN 1 ELSE 0 
    END) as pre_wins,
    COUNT(CASE 
      WHEN do.se_assigned_date < bc.bootcamp_date 
      THEN 1 
    END) as pre_total,
    SUM(CASE 
      WHEN do.se_assigned_date >= bc.bootcamp_date AND do.closed_won 
      THEN 1 ELSE 0 
    END) as post_wins,
    COUNT(CASE 
      WHEN do.se_assigned_date >= bc.bootcamp_date 
      THEN 1 
    END) as post_total
  FROM bootcamp_cohort bc
  JOIN deal_outcomes do ON bc.employee_id = do.employee_id
  WHERE do.se_assigned_date BETWEEN bc.bootcamp_date - INTERVAL '90 days' 
                                AND bc.bootcamp_date + INTERVAL '90 days'
  GROUP BY bc.employee_id
)
SELECT 
  ROUND(AVG(pre_wins::numeric / NULLIF(pre_total, 0)) * 100, 1) as pre_bootcamp_win_rate,
  ROUND(AVG(post_wins::numeric / NULLIF(post_total, 0)) * 100, 1) as post_bootcamp_win_rate,
  ROUND((AVG(post_wins::numeric / NULLIF(post_total, 0)) - 
         AVG(pre_wins::numeric / NULLIF(pre_total, 0))) * 100, 1) as win_rate_lift
FROM pre_post_deals;
```

**Output:**
```
pre_bootcamp_win_rate | post_bootcamp_win_rate | win_rate_lift
----------------------|------------------------|---------------
45.2%                 | 58.7%                  | +13.5%
```

**Dashboard Visualization:**
- **Program Impact Card:** "Q3 Discovery Bootcamp → +13.5% win rate lift"
- **Cohort comparison:** Chart showing bootcamp attendees vs. non-attendees
- **Statistical significance:** p-value, confidence intervals

---

## Reporting & Dashboards

### CRO / Sales Leadership Dashboard

**Primary Question:** "Are we ready to sell?"

**Key Metrics:**

**1. Team Skill Readiness Overview**
```
┌─────────────────────────────────────────┐
│  Core Competency Validation Coverage    │
├─────────────────────────────────────────┤
│  Discovery:          ████████░░  82%     │
│  Objection Handling: ██████░░░░  65%     │
│  Value Articulation: ███████░░░  78%     │
│  Product Knowledge:  █████░░░░░  52% ⚠️  │
│  Closing:           ████████░░  80%     │
└─────────────────────────────────────────┘
```

**2. Context-Specific Readiness (Heatmap)**
```
               Healthcare  Fintech  Manufacturing
Discovery        88%        75%       82%
Objections       72%        85%       78%
Product Know.    65% ⚠️     90%       70%
```

**3. Pipeline Risk by Skill Gaps**
```
🚨 High Risk Deals (SE skill mismatch):
• Acme Health ($500K) - Joe: No healthcare exp
• Fintech Corp ($250K) - Sarah: Limited Product X knowledge

⚠️  Medium Risk: 8 deals
✅ Low Risk: 34 deals
```

**4. Training ROI Snapshot**
```
Q4 2025 Enablement Impact:
• Investment: $145K (training hours + content)
• Revenue Attributed: $2.4M
• ROI: 16.5x
• Win Rate Lift: +12% (trained vs. untrained SEs)
```

---

### Sales Manager Dashboard

**Primary Question:** "Which reps need help, and with what?"

**Key Features:**

**1. Team Skill Matrix**
```
Rep          Discovery  Objections  Product X  Healthcare  Status
Joe Smith       82         78         N/A        N/A       ⚠️ Gap: Healthcare
Sarah J.        90         85         92         88        ✅ Validated
Mike T.         75         70         65         N/A       🔴 Needs: Product X + Healthcare
```

**2. Individual Rep Deep-Dive (Joe Smith)**
```
┌──────────────────────────────────────────────────────┐
│  Joe Smith - Skill Profile                           │
├──────────────────────────────────────────────────────┤
│  Overall Readiness: 78/100 (Medium-High)             │
│                                                       │
│  ✅ Strengths:                                        │
│    • Discovery (General): 85 (High Confidence)       │
│    • Objection Handling: 88 (High Confidence)        │
│                                                       │
│  ⚠️  Gaps:                                            │
│    • Healthcare Discovery: Unknown                   │
│    • Product X Knowledge: 65 (Needs improvement)     │
│                                                       │
│  📈 Trend (Last 90 Days):                            │
│    • Discovery: 72 → 78 → 85 (Improving)             │
│    • Product Knowledge: 68 → 65 (Declining) 🔴       │
│                                                       │
│  🎯 Active Assignments:                              │
│    • Healthcare primer (Due: Feb 14) - In Progress   │
│    • Product X certification (Due: Feb 20) - Pending │
│                                                       │
│  📊 Recent Field Performance (Last 5 Calls):         │
│    • Avg Score: 82                                   │
│    • Best: Discovery (88)                            │
│    • Needs Work: Closing (72)                        │
└──────────────────────────────────────────────────────┘
```

**3. Coaching Priorities (Data-Driven)**
```
🎯 Top Coaching Opportunities This Week:

1. Mike - Product X Knowledge (Declining)
   - Field scores dropped from 75 → 65
   - Assigned to 3 Product X deals this month
   - Action: Schedule 1:1, assign Product X deep-dive

2. Joe - Healthcare Context Prep
   - Acme Health meeting Feb 15
   - No healthcare experience
   - Action: Review JIT enablement completion, prep call

3. Sarah - Maintain Excellence
   - Consistently high performer (90+ avg)
   - Action: Pair with Mike for Product X shadowing
```

---

### Enablement Team Dashboard

**Primary Question:** "Is our training actually working?"

**Key Analytics:**

**1. Content Effectiveness Leaderboard**
```
Top Performing Content (by field performance lift):

1. Healthcare Discovery Primer (Podcast)
   - Completions: 18
   - Avg Field Lift: +18 pts
   - Time to Impact: 8 days
   - Revenue Attributed: $1.2M

2. Product X Certification
   - Completions: 42
   - Avg Field Lift: +12 pts
   - Win Rate: 62% (certified) vs. 45% (not certified)

3. Discovery Bootcamp (Live Workshop)
   - Completions: 28
   - Avg Field Lift: +15 pts
   - Time to Impact: 14 days
```

**2. Correlation Heatmap (Training → Field → Revenue)**
```
Content           Validation  Field Perf  Win Rate  Revenue
                  Impact      Impact      Impact    Impact
Discovery Boot.   +16 pts     +15 pts     +13%      $2.1M
Healthcare Prim.  +10 pts     +18 pts     +8%       $1.2M
Product X Cert.   +22 pts     +12 pts     +17%      $3.4M
```

**3. Learning Path Optimization**
```
Optimal Sequence for Healthcare Onboarding:

1. Healthcare Industry Primer (Podcast) → 75% complete in 1 day
2. Healthcare Role-Play Scenarios (3x) → +18pt avg validation score
3. Gong Call Review (Top performer) → Contextual learning
4. First shadowed healthcare call → Field validation

Outcome: 85% validated in healthcare within 14 days
vs. 28 days without structured path
```

**4. Just-in-Time Effectiveness**
```
JIT Enablement Performance (Last 30 Days):

• Assignments Triggered: 47
• Completed On-Time: 38 (81%)
• Avg Time to Complete: 22 minutes
• Field Performance Lift: +14 pts (completed vs. not completed)
• Deal Advancement: 68% advance to next stage (vs. 52% baseline)
```

---

### Individual Contributor (SE) View

**Primary Question:** "What do I need to prepare for this deal?"

**Personal Dashboard:**

```
┌──────────────────────────────────────────────────────┐
│  Joe Smith - My Skill Profile                        │
├──────────────────────────────────────────────────────┤
│  🎯 Upcoming Assignments                             │
│                                                       │
│  ⏰ Due Feb 14 (High Priority):                      │
│    ☐ Healthcare Discovery Primer (15min)            │
│    ☐ HIPAA Compliance Battlecard (5min)             │
│    → For: Acme Health meeting Feb 15                │
│                                                       │
│  📅 Due Feb 20:                                      │
│    ☐ Product X Certification Exam                   │
│    → Complete training modules first (3 remaining)   │
│                                                       │
├──────────────────────────────────────────────────────┤
│  💪 My Strengths                                     │
│  • Discovery: 85/100 ✅                              │
│  • Objection Handling: 88/100 ✅                     │
│  • Value Articulation: 82/100 ✅                     │
│                                                       │
├──────────────────────────────────────────────────────┤
│  📈 Areas to Develop                                 │
│  • Healthcare Knowledge: Unknown                     │
│    → Complete healthcare primer (assigned above)     │
│                                                       │
│  • Product X Deep Dive: 65/100                       │
│    → Certification will boost to ~85                 │
│                                                       │
├──────────────────────────────────────────────────────┤
│  📊 My Progress (Last 30 Days)                       │
│  • Practice Sessions: 6 completed                    │
│  • Avg Practice Score: 82                            │
│  • Customer Calls: 8                                 │
│  • Avg Field Score: 84                               │
│  • Trend: Improving ↗️                               │
└──────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Current Implementation

**Database:** PostgreSQL 14 (Alpine)
- Primary operational database
- Stores employee skills, observations, activities, deals
- Future: Separate analytical database for time-series analysis

**Cache/Queue:** Redis 7 (Alpine)
- Session management
- Job queues (Bull) for async processing (skill recalculation, notifications)

**Backend:** Node.js with Express & TypeScript
- RESTful API server
- Authentication: Passport.js with Google OAuth 2.0
- Database client: pg (PostgreSQL)
- Validation: Joi
- Logging: Winston
- CSV import: csv-parser

**Frontend:** Next.js 14 with React 18
- Server-side rendering for dashboards
- Styling: Tailwind CSS
- Charts: Recharts
- HTTP client: Axios

**Infrastructure:** Google Cloud Platform (GCP)
- **Hosting:** Cloud Run (containerized services)
- **Database:** Cloud SQL for PostgreSQL
- **Cache:** Memorystore for Redis
- **Authentication:** GCP service accounts with Workload Identity
- **Storage:** Cloud Storage (for large files, recordings, transcripts)
- **AI Analysis:** Claude API (Anthropic) for call/transcript analysis
- **Monitoring:** Cloud Logging, Cloud Monitoring

**Development:** Docker Compose for local development

---

### Middleware Architecture (Abstract)

**Purpose:** Isolate 3rd party integration complexity from core LMS

**Implementation Options (To Be Determined):**
- Cloud Functions (lightweight parsing, event-driven)
- Cloud Run services (complex analysis, stateful processing)
- Pub/Sub + Cloud Functions (event-driven architecture)
- Cloud Tasks (scheduled batch jobs)

**Authentication:** GCP service accounts for LMS API calls

---

## Success Metrics

### Phase 1-2: Foundation (Validation + Skill Logic)
- **Skill coverage:** 70%+ of active SEs have validated skills in ≥3 core competencies
- **Data quality:** 80%+ of skill ratings have "medium" or "high" confidence
- **Validation throughput:** Process 100+ validation events/week
- **Admin adoption:** Enablement team configures 15+ skill definitions with custom rules

### Phase 3-4: Field Intelligence (Gong + Correlation)
- **Field observation coverage:** Analyze 80%+ of customer-facing calls
- **Analysis accuracy:** 90%+ human agreement with AI competency scores (sample validation)
- **Correlation clarity:** Demonstrate statistically significant (+10pt) validation-to-field improvement
- **Early warning:** Detect skill gaps in practice 30+ days before field performance decline

### Phase 5-6: Personalized Enablement (Learning + SFDC)
- **JIT completion rate:** 75%+ of triggered enablement completed before customer meetings
- **JIT effectiveness:** +12pt avg field performance lift for reps who complete JIT assignments
- **Context accuracy:** 85%+ of triggered enablement matches actual deal context
- **Deal risk flagging:** 90%+ of high-risk deals (skill mismatch) correctly identified

### Phase 7: Business Impact (ROI)
- **Win rate correlation:** High-readiness SEs win at 15%+ higher rate than low-readiness
- **Revenue attribution:** $2M+ revenue attributed to enablement interventions
- **Training ROI:** 10x+ return on training investment (revenue / cost)
- **Time to competency:** Reduce new hire ramp time by 25%

### Overall Platform Health
- **User engagement:** 80%+ weekly active usage by SEs (check assignments, view profiles)
- **Manager adoption:** 90%+ of managers use dashboard weekly for coaching decisions
- **Leadership confidence:** CRO uses readiness dashboard for quarterly planning
- **Data freshness:** 95%+ of skill ratings updated within 7 days

---

## Phased Roadmap

### Phase 1: Validation API Integration & Reporting (Weeks 1-6)

**Objectives:**
- Voice role-play app can POST session results to LMS
- Testing platforms can POST assessment results to LMS
- Basic employee skill profiles stored and queryable
- Simple dashboard showing skill coverage

**Deliverables:**
1. **LMS API Endpoints:**
   - `POST /api/v1/validation-events` (create validation observation)
   - `GET /api/v1/employees/{id}/skills` (retrieve skill profile)
   - `GET /api/v1/validation-events/{employee_id}` (validation history)

2. **Database Schema:**
   - `employees` table (user management - already exists)
   - `validation_events` table (detailed session results)
   - `employee_skills` table (aggregated skill ratings)

3. **Voice Role-Play Integration:**
   - Update role-play app to call LMS API on session completion
   - GCP service account authentication
   - Error handling and retry logic

4. **Basic Reporting Dashboard:**
   - Team skill coverage view (% validated per competency)
   - Individual employee skill profile page
   - Recent validation activity feed

**Success Criteria:**
- Voice role-play successfully posts 50+ sessions to LMS
- 30+ employees have skill profiles with 3+ competencies tracked
- Dashboard accessible to managers and leadership

---

### Phase 2: Skill Achievement Logic & Configuration (Weeks 7-10)

**Objectives:**
- Define configurable rules for skill validation
- Admin UI to create/edit skills and achievement rules
- Automated skill status calculation (validated, in-progress, not-started)
- Confidence indicators based on data volume

**Deliverables:**
1. **Admin Configuration UI:**
   - Create skill definitions (name, description, category)
   - Configure achievement rules (min attempts, scores, time windows)
   - Set context dimensions (industries, deal sizes, personas)
   - Define skill lifecycle (expiration, recertification)

2. **Validation Engine:**
   - Nightly batch job to recalculate all employee skills
   - Apply configurable rules to determine validation status
   - Calculate confidence levels based on observation count and recency
   - Detect trends (improving, stable, declining)

3. **Enhanced API Responses:**
   - Return skill status and confidence when validation events posted
   - Recommend next activities to complete validation
   - API endpoint for bulk skill recalculation (admin trigger)

4. **Reporting Enhancements:**
   - Skill status breakdown (validated vs. in-progress vs. gaps)
   - Confidence indicators on all skill displays
   - Trend arrows showing skill progression

**Success Criteria:**
- 10+ skill definitions configured with custom rules
- 80%+ of tracked skills have clear status (not "unknown")
- Validation engine processes 100+ employees in <5 minutes

---

### Phase 3: Gong Integration, Parsing & Field Reporting (Weeks 11-16)

**Objectives:**
- Automatically analyze customer calls from Gong
- Extract competency scores and deal context
- POST field observations to LMS
- Dashboard showing validation vs. field performance

**Deliverables:**
1. **Gong Middleware Service:**
   - Authenticate with Gong API
   - Fetch call recordings and transcripts (batch daily)
   - Identify SE participation in calls
   - Store call metadata for processing

2. **AI Analysis Pipeline (Claude):**
   - Prompt engineering for competency scoring
   - Batch processing of transcripts (10+ calls per batch)
   - Extract context (industry, deal stage, buyer personas)
   - Generate evidence snippets for scores
   - Handle low-confidence results (flag for human review)

3. **LMS Field Observation API:**
   - `POST /api/v1/field-observations` (accept Gong data)
   - Store observations linked to deals and employees
   - Recalculate skill ratings with field data prioritization

4. **Enhanced Reporting:**
   - Validation vs. Field performance comparison view
   - Individual call analysis results (link to Gong)
   - Field observation timeline per employee
   - Competency scores broken down by call context

**Success Criteria:**
- Analyze 100+ calls per week automatically
- 85%+ of field observations include competency scores
- Detect 10+ instances where practice scores don't match field performance

---

### Phase 4: Validation-to-Field Correlation Analytics (Weeks 17-20)

**Objectives:**
- Prove training translates to field improvement
- Build correlation dashboards for enablement team
- Identify which content/programs drive results

**Deliverables:**
1. **Correlation Queries:**
   - Pre/post training analysis (validation scores)
   - Pre/post training analysis (field scores)
   - Cohort comparison (trained vs. untrained)
   - Time-to-impact measurement

2. **Analytics Dashboard (Enablement Team):**
   - Content effectiveness leaderboard
   - Training ROI by program
   - Optimal learning path identification
   - Validation-field gap analysis

3. **Automated Insights:**
   - Weekly email digest with key correlation findings
   - Alerts when new training shows strong correlation
   - Recommendations for curriculum changes based on data

**Success Criteria:**
- Demonstrate +10pt field improvement for 3+ training programs
- Identify optimal learning sequences for 5+ skill areas
- Enablement team uses correlation data for Q2 planning

---

### Phase 5: Learning Activities API (Weeks 21-24)

**Objectives:**
- Enable learning platforms to report activity completion
- Track course completions, video views, documentation reads
- Link learning activities to skill development
- Support self-serve and assigned learning

**Deliverables:**
1. **Learning Activity API:**
   - `POST /api/v1/learning-activities` (report completion)
   - `GET /api/v1/learning-activities/{employee_id}` (activity history)
   - Support for various content types (video, course, podcast, etc.)

2. **Content Registry:**
   - Admin UI to register content items
   - Map content to related competencies
   - Tag content with context (industry, product)

3. **Learning Path Logic:**
   - Recommend next logical activity after completion
   - Prerequisite checking (complete A before B)
   - Progress tracking toward learning goals

4. **SE Dashboard Enhancement:**
   - Assigned learning activities view
   - Self-serve content browser
   - Progress bars toward skill validation

**Success Criteria:**
- 500+ learning activities logged in first month
- 70%+ completion rate for assigned activities
- 50+ SEs use self-serve content discovery

---

### Phase 6: SFDC Integration & Personalized Enablement (Weeks 25-30)

**Objectives:**
- Monitor SFDC for SE opportunity assignments
- Detect upcoming customer meetings
- Trigger just-in-time enablement for skill gaps
- Notify SEs and managers of deal risks

**Deliverables:**
1. **SFDC Middleware Service:**
   - Monitor opportunity assignments (webhooks or polling)
   - Fetch meeting schedules from SFDC activities
   - Enrich with account context (industry, size, products)
   - POST deal assignments to LMS

2. **Context-Aware Enablement Triggers:**
   - Match deal context to SE skills
   - Identify gaps (no healthcare experience for healthcare deal)
   - Calculate risk scores (high/medium/low)
   - Trigger personalized learning assignments

3. **Just-in-Time Assignment Logic:**
   - Assign targeted content based on gaps and meeting timeline
   - Prioritize short-form content (podcasts, battlecards)
   - Set due dates before customer meetings
   - Escalate to managers for high-risk deals

4. **Notification System:**
   - In-app notifications for SEs (new assignments)
   - Manager alerts for high-risk deals
   - Weekly digest emails with team activity summary

5. **AI Content Generation Integration:**
   - Connect to existing podcast generation system
   - Dynamically create context-specific primers
   - Generate battlecards for unique deal contexts

**Success Criteria:**
- Monitor 100% of SE opportunity assignments
- Trigger JIT enablement for 30+ deals in first month
- 75%+ JIT completion rate before meetings
- 85%+ context accuracy (right content for right deal)

---

### Phase 7: SFDC ROI Correlation & Revenue Impact (Weeks 31-36)

**Objectives:**
- Link deal outcomes (closed/won, revenue) to skill readiness
- Prove training ROI with revenue attribution
- Build executive dashboards for leadership

**Deliverables:**
1. **Deal Outcome Tracking:**
   - Sync opportunity close dates and outcomes from SFDC
   - Capture deal value, stage progression, timeline
   - Store skill snapshots at deal assignment for comparison

2. **ROI Correlation Queries:**
   - Win rate by skill readiness tier
   - Revenue attribution by training program
   - Training investment vs. revenue return
   - Specific program impact (before/after analysis)

3. **Executive Dashboard (CRO):**
   - "Are we ready to sell?" headline metric
   - Pipeline risk by skill gaps
   - Training ROI summary
   - Win rate correlations (charts and stats)

4. **Predictive Analytics:**
   - Deal risk scoring at assignment
   - Forecast skill gaps vs. pipeline needs
   - Hiring recommendations based on skill inventory

5. **Quarterly Business Review Materials:**
   - Automated reports for leadership
   - Training effectiveness summary
   - Revenue impact statements
   - Strategic recommendations

**Success Criteria:**
- Demonstrate 10x+ training ROI (revenue / investment)
- Prove 15%+ win rate lift for high-readiness SEs
- Attribute $2M+ revenue to enablement interventions
- CRO uses dashboard for quarterly planning

---

## Data Privacy & Access Control

### Role-Based Access

**Individual Contributors (SEs):**
- View: Own skill profile, assigned activities, personal progress
- Cannot view: Team members' data, manager analytics

**Managers:**
- View: Direct reports' skill profiles, team aggregates, coaching priorities
- Cannot view: Peers' teams, detailed recordings (unless granted by admin)

**Senior Management (VP Sales, RVP):**
- View: All teams within their organization, aggregated metrics
- Cannot view: Individual call recordings (unless escalated)

**Enablement Team:**
- View: All employee data for program design
- View: Correlation analytics, content effectiveness
- Cannot view: Individual performance for evaluation purposes (coaching only)

**CRO / Sales Leadership:**
- View: Organization-wide metrics, ROI analytics, strategic insights
- View: Individual profiles for strategic decisions (with audit logging)

**Admin:**
- Full access: Configure skills, rules, integrations
- View: Audit logs, system health, all data

### Data Sensitivity

**Recordings & Transcripts:**
- Access logged and auditable
- Managers can access for coaching (with notification to SE)
- Enablement team can access anonymized samples
- Retention: 12 months, then archived or deleted

**Performance Scores:**
- Used for development, not punishment
- Low scores trigger coaching, not disciplinary action
- Anonymized for aggregate analytics
- Confidence indicators contextualize scores

**Correlation Analytics:**
- Anonymized at team level (no "bottom performer" lists)
- Focus on program effectiveness, not individual rankings
- Statistical significance required before showing correlations

---

## Error Handling & Data Quality

### High-Level Principles

**Validation on Inbound Data:**
- Required fields enforced (employee_id, timestamp, scores)
- Score ranges validated (0-100)
- Duplicate detection (same session posted twice)

**Graceful Degradation:**
- Incomplete data: Store what's available, flag gaps
- Parsing failures: Log error, queue for human review
- API unavailability: Retry with exponential backoff

**Data Conflicts:**
- Field vs. validation mismatch: Prioritize field data, note discrepancy
- Simultaneous updates: Last-write-wins with audit trail
- Low-confidence AI scores: Flag for human validation

**Monitoring & Alerts:**
- API error rates: Alert if >5% failure rate
- Data staleness: Warn if skills not updated in 30+ days
- Integration health: Daily checks for Gong, SFDC connectivity

---

## Initial Data & Onboarding

**Employee Import:**
- CSV upload: name, email, role, manager, hire date
- Sync with Google Workspace (OAuth directory API)

**Skill Definitions:**
- Seed database with starter competencies (discovery, objections, etc.)
- Enablement team configures additional skills via admin UI

**Historical Data:**
- No retroactive import (start fresh)
- Optionally: Import recent certifications (manual entry or CSV)

**Baseline Assessment:**
- New users start with blank skill profile ("unknown" status)
- First validation event or field observation establishes baseline

---

## Future Enhancements (Beyond Phase 7)

**Multi-Tenancy:**
- If productized for other companies, add tenant isolation
- Cross-tenant benchmarking (anonymized industry data)

**Mobile App:**
- Native iOS/Android for on-the-go learning
- Push notifications for JIT assignments
- Offline content download

**Advanced AI Features:**
- Predictive deal risk scoring (ML models)
- Automated coaching recommendations (AI-generated feedback)
- Sentiment analysis on calls (confidence, engagement detection)

**Expanded Integrations:**
- Salesloft / Outreach (email competency analysis)
- Slack (notifications, chatbot for skill lookup)
- Zoom (call recording analysis without Gong)

**Gamification:**
- Skill badges and achievements
- Leaderboards (opt-in, team-based)
- Peer recognition for top performers

**A/B Testing Platform:**
- Test training variations (cohort A vs. cohort B)
- Statistically rigorous program evaluation

---

## Appendix: API Reference Summary

### Validation Events API

**POST /api/v1/validation-events**
Submit results from validation activities (role-play, tests, certifications).

**GET /api/v1/employees/{employee_id}/skills**
Retrieve employee's current skill profile.

**GET /api/v1/validation-events/{employee_id}**
Fetch validation event history for an employee.

---

### Field Observations API

**POST /api/v1/field-observations**
Submit field observation data (Gong call analysis, email analysis).

**GET /api/v1/field-observations/{employee_id}**
Retrieve field observation history.

---

### Learning Activities API

**POST /api/v1/learning-activities**
Report learning activity completion (videos, courses, podcasts).

**GET /api/v1/learning-activities/{employee_id}**
Fetch learning activity history.

---

### Deal Management API

**POST /api/v1/deal-assignments**
Notify LMS of SE assignment to opportunity (SFDC integration).

**GET /api/v1/deals/{deal_id}/skill-snapshot**
Retrieve skill snapshot at time of deal assignment.

**POST /api/v1/deal-outcomes**
Update deal outcome (closed/won, revenue) for correlation analysis.

---

### Admin Configuration API

**POST /api/v1/skills**
Create new skill definition.

**PUT /api/v1/skills/{skill_id}**
Update skill definition or achievement rules.

**GET /api/v1/skills**
List all skill definitions.

**POST /api/v1/skills/recalculate**
Trigger bulk skill recalculation for all employees.

---

## Glossary

**Competency:** A measurable skill area (e.g., discovery, objection handling, product knowledge)

**Context:** Dimensions that specialize a competency (e.g., healthcare × enterprise × technical buyer)

**Validation Event:** Internal activity demonstrating skill (role-play, test, certification)

**Field Observation:** Real-world skill demonstration in customer interaction (Gong call, email)

**Skill Rating:** 0-100 score representing proficiency in a competency (with context)

**Confidence Level:** Data quality indicator (high, medium, low, unknown) based on observation volume

**Ground Truth:** Field performance is the authoritative signal of skill proficiency

**JIT Enablement:** Just-in-time learning assigned based on upcoming deal context

**Skill Snapshot:** Capture of SE's skill ratings at a specific point in time (e.g., deal assignment)

**Correlation Analysis:** Proving causal relationship between training and performance/revenue

---

## Document Control

**Version:** 1.0  
**Status:** Vision Specification (Pre-Implementation)  
**Owner:** Dan Fitzpatrick, Augment Code  
**Last Updated:** February 2026

**Change Log:**
- v1.0 (Feb 2026): Initial vision specification based on stakeholder interviews

**Next Steps:**
1. Review with leadership and enablement team
2. Technical architecture deep-dive (database schema, API contracts)
3. Phase 1 implementation kickoff
4. Iterate based on early user feedback

---

**End of Specification**
