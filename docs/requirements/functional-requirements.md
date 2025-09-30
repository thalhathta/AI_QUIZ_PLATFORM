# AI Quiz Platform — Functional Requirements
**Version:** 1.0  
**Date:** May 22, 2025  
**Owner:** AIE / AI Quiz Platform Team

---

## 0) Document Purpose & Change Control
This document defines the **functional** (and supporting non-functional) requirements for the AI Quiz Platform. It will be used by engineering, QA, and product to plan, build, and validate the system.

- **Status:** Draft → Review → Approved  
- **Change Process:** Open a PR titled `docs: update functional requirements`, link issues, record decisions in the “Decision Log”.
- **Decision Log:**
  - 2025-05-22: Initial baseline created.

---

## 1) Product Overview
The AI Quiz Platform generates **personalized, adaptive quizzes** for students on any topic. It integrates with **Claude** for question generation and stores user progress for **analytics and adaptive difficulty**.

### Goals
- Generate topic-based quizzes within **≤10s** (10 questions).
- Adjust difficulty based on the last **5 attempts** per topic.
- Provide **explanations** for each question.
- Track user progress and show **trends** over time.
- Be **mobile-responsive** and meet **WCAG 2.1 AA** accessibility.

### Out of Scope (Phase 1)
- Payments, subscriptions.
- Live proctoring.
- Teacher dashboards/class management.
- Offline mode.

---

## 2) Users & Personas
- **Student (Primary)**: Wants quick quizzes, explanations, and visible progress.
- **Guest (Secondary)**: Tries the app without storing data (limited features).
- **Admin (Internal)**: Monitors health metrics and content safety flags.

---

## 3) Core User Story (from Day 0)
> As a student, I want an AI-powered quiz platform that generates personalized quizzes on topics I choose, so I can test my knowledge and improve through adaptive difficulty.

### Key Acceptance Criteria
- **Topic Selection:** User can enter any topic and receive a relevant quiz **≤30s** (target: ≤10s for 10 Qs).
- **Progressive Difficulty:** Difficulty adjusts based on prior performance in that topic.
- **Feedback:** Each question includes an explanation (shown after answer).
- **Performance Tracking:** User can view history, accuracy, time per Q, and trends.
- **Accessibility & Mobile:** WCAG 2.1 AA, works on common mobile browsers.

---

## 4) Functional Requirements

### 4.1 Authentication & Profile
**FR-AUTH-01** User can **register** with email & password.  
**FR-AUTH-02** User can **login/logout**; sessions via **JWT** (HTTP-only cookie or Authorization header).  
**FR-AUTH-03** User can view/update **profile**: name, education level, preferences.  
**FR-AUTH-04** Passwords stored as **bcrypt** hash; strong password policy (≥8 chars, mixed case or symbols).  
**FR-AUTH-05** **Rate-limit** auth endpoints (e.g., 5/min/IP) to reduce brute force.

**API**  
- `POST /api/auth/register`  
- `POST /api/auth/login`  
- `POST /api/auth/logout`  
- `GET /api/auth/profile` (auth required)  

**Validation**  
- Email RFC-compliant, unique.  
- Password policy enforced on register & change.

---

### 4.2 Quiz Generation
**FR-QUIZ-01** User can request quiz by **topic**, **count** (default 10), and optional **difficulty** (easy|medium|hard|mixed).  
**FR-QUIZ-02** System calls **Claude** with structured prompt; returns **valid JSON** with fields: `id, question, type, difficulty, options?, answer, explanation, tags[]`.  
**FR-QUIZ-03** Allowed types: `mcq`, `true_false`, `fill_blank`.  
**FR-QUIZ-04** Validate AI output: required fields present; MCQ has ≥2 options; answers sane.  
**FR-QUIZ-05** Store generated quiz + questions (immutable snapshot) with metadata (topic, difficulty, generatedAt, createdBy).  
**FR-QUIZ-06** If generation fails, return informative error and **retry** once (configurable).  
**FR-QUIZ-07** Limit **cost/rate**: configurable per-user and global daily quotas; backoff on 429 from provider.

**API**  
- `POST /api/quiz/generate` (auth required)  
  - **Request**:
    ```json
    {
      "topic": "Photosynthesis",
      "count": 10,
      "difficulty": "mixed"
    }
    ```
  - **Response**:
    ```json
    {
      "quizId": "qz_01H...",
      "topic": "Photosynthesis",
      "count": 10,
      "difficulty": "mixed",
      "generatedAt": "2025-05-22T10:00:00Z",
      "questions": [
        {
          "id": "q1",
          "question": "…",
          "type": "mcq",
          "difficulty": "medium",
          "options": ["A","B","C","D"],
          "answer": "B",
          "explanation": "…",
          "tags": ["biology","photosynthesis"]
        }
      ]
    }
    ```

**Validation & Rules**
- `topic`: string 2–120 chars; sanitize (strip HTML/JS).
- `count`: 1–25 (default 10).
- `difficulty`: enum (default `mixed`).
- Ensure no PII or unsafe content; reject & regenerate if flagged.

---

### 4.3 Quiz Retrieval & Attempts
**FR-QUIZ-08** User can fetch a quiz by `quizId`.  
**FR-QUIZ-09** User can **start an attempt** (creates attempt record with start time).  
**FR-QUIZ-10** User can **submit answers**; backend computes score, per-question correctness, and stores **time-per-question** if provided.  
**FR-QUIZ-11** On completion, return **detailed results** incl. explanations for review.  
**FR-QUIZ-12** User can view **attempt history** filtered by topic and date.

**API**  
- `GET /api/quiz/:id`  
- `POST /api/quiz/:id/attempt` → `{ attemptId }`  
- `PUT /api/quiz/attempt/:attemptId` (submit)  
- `GET /api/quiz/attempts/user/:userId?topic=&from=&to=`

**Submission Payload** (example)
```json
{
  "answers": [
    { "questionId": "q1", "response": "B", "timeMs": 12000 },
    { "questionId": "q2", "response": true, "timeMs": 9000 }
  ]
}
