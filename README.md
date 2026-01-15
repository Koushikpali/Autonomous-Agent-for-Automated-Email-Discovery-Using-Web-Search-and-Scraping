

## 📌 Overview

This project implements an **agentic AI system** that autonomously discovers contact emails from the web by **planning, searching, scraping, observing outcomes, and adapting its strategy** over multiple steps.

Unlike simple scrapers or scripts, the system behaves like an **intelligent agent**:

* It decides *what to do next*
* Evaluates success/failure
* Adjusts strategy based on past results
* Stops automatically when diminishing returns are detected

---

## 🎯 Problem Statement

Manually finding verified contact emails (HR, hiring, support) across company websites is:

* Time-consuming
* Error-prone
* Difficult to automate reliably

Most scrapers blindly crawl pages without understanding **when to search, scrape, stop, or pivot**.

---

## 💡 Solution

A **step-based autonomous agent** powered by an LLM planner that:

1. Searches the web for relevant pages
2. Scrapes selected URLs
3. Extracts emails and contact forms
4. Observes outcomes (email found, form only, blocked, no signal)
5. Updates internal memory and metrics
6. Replans the next step dynamically

---

## 🧠 Key Concepts Implemented

* Agent lifecycle (Plan → Act → Observe → Reflect)
* Tool registry (search / scrape as pluggable tools)
* Diff-based context for LLM planning
* Persistent memory using MongoDB
* Self-monitoring metrics for termination decisions

---

## 🏗️ Architecture (High Level)

```
Client
  ↓
Agent Controller
  ↓
LLM Planner (Ollama / Mock)
  ↓
Tool Registry
  ├── Search Tool
  └── Scrape Tool
  ↓
Observation Classifier
  ↓
State + Metrics Update
  ↓
Next Step Decision
```

---

## 🗂️ Project Structure

```
server/
├── app.js                 # Express bootstrap
├── controllers/           # Agent & memory controllers
├── services/
│   ├── llmService.js      # LLM planner (agent brain)
│   ├── observationService.js
│   ├── reflectionService.js
│   └── tools/             # Search & Scrape tools
├── models/                # MongoDB schemas
├── middleware/            # Policy & domain guards
├── config/                # Settings & policies
└── utils/                 # Logger utilities
```

---

## ⚙️ Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB (Mongoose)**
* **Ollama (LLM Planner)** – optional
* **Playwright /duckgoduck/ Browser automation** (for scraping)
* **REST API**

--

## 🚀 How to Run

### Prerequisites

* Node.js (v18+)
* MongoDB running locally
* (Optional) Ollama running on `localhost:11434`

### Setup

```bash
cd server
npm install
npm run dev
```

### Run the Agent

```http
POST /agent/run
```

```json
{
  "goal": "Find contact emails from company career pages",
  "debugMode": true
}
```

---

## 🧾 Example Output (Summary)

<img width="749" height="866" alt="Screenshot 2026-01-15 022425" src="https://github.com/user-attachments/assets/0bdb738e-0378-4985-8d39-7eca42148549" />


## 🔐 Safety & Ethics

* Domain allow/deny policies
* Robots.txt respect (configurable)
* No phone number scraping
* Educational & research-oriented use

---

## 📈 Why This Project Matters

This project demonstrates:

* **True agentic behavior**, not prompt-to-response scripting
* Practical application of LLMs in backend systems
* Strong separation of concerns (planner, tools, memory, metrics)
* Production-style logging and observability

---

## 🧑‍💻 Author

**Koushik Pali**
Computer Science & Design Student
Backend Systems & Agentic AI Enthusiast

---

Say the word.
