Build an advanced **AI Product Evaluation System** for the Hacker's Unity Hackathon Platform.

The evaluation system should focus on evaluating a submission as a **real product and potential business**, not just as a technical project.

The AI evaluation must be powered by the **Groq API**.

---

# CORE CONCEPT

The system should analyze whether the participant has built something that can become a real product.

The evaluation should not only focus on code or technical complexity.

Instead, it should answer questions such as:

* Does this product solve a real problem?
* Is the problem important enough to solve?
* Who are the target users?
* Is the solution genuinely useful?
* Is there a clear product-market fit opportunity?
* Does the product have differentiation?
* Can users realistically adopt it?
* Can the product scale?
* Does it have business or startup potential?

The AI should act as an **AI Product Analyst and Evaluation Assistant**.

The AI must analyze the participant's complete submission and generate a structured evaluation report.

---

# SUBMISSION DATA TO ANALYZE

The AI should analyze available submission information such as:

* Product Name
* Product Tagline
* Problem Statement
* Product Description
* Target Users
* Solution Description
* Key Features
* Tech Stack
* GitHub Repository URL
* Live Product/Demo URL
* Demo Video URL
* Presentation/Pitch Deck
* Screenshots
* Additional Submission Notes

The system should only analyze information that is available in the submission.

It must not invent product features or assumptions.

If important information is missing, the AI should clearly mention:

"Insufficient information available to evaluate this aspect accurately."

---

# PRODUCT EVALUATION CRITERIA

Each criterion should receive a score out of 10.

The system should also calculate a weighted final score out of 100.

## 1. Problem Validation & Importance — 15%

Evaluate:

* Is the problem clearly defined?
* Does the problem affect real users?
* How significant is the problem?
* Is there evidence that users actually need this solution?
* Is this solving a real pain point or an imaginary problem?

AI should identify:

* Problem Strength
* Target User Pain Points
* Problem Importance

---

## 2. Product Value & Usefulness — 15%

Evaluate:

* Does the product provide clear value?
* Would users realistically use it?
* Does it save time, money, effort, or solve an important problem?
* Is the value proposition understandable?
* Does the product provide meaningful benefits?

The AI should explain:

"Why would someone actually use this product?"

---

## 3. Innovation & Differentiation — 10%

Evaluate:

* What makes this product different?
* Are similar solutions already likely to exist?
* Does the product introduce a meaningful improvement?
* Is the innovation in technology, user experience, business model, or problem-solving approach?

Important:

Do not give a high innovation score simply because the product uses AI.

Using AI APIs or popular technologies alone should not be considered innovation.

---

## 4. Product Experience & Usability — 10%

Evaluate:

* Is the product easy to understand?
* Is the user flow logical?
* Is the product designed for real users?
* Is the UI/UX appropriate for the target audience?
* Can a new user understand how to use it?

Focus on product usability rather than visual beauty alone.

---

## 5. Market Potential — 15%

Evaluate:

* Who could use this product?
* Is the potential user base significant?
* Does the product target a narrow or large market?
* Is there realistic demand?
* Does this have startup or commercial potential?

AI should provide:

* Potential Target Market
* Primary Users
* Adoption Potential

---

## 6. Scalability & Growth Potential — 10%

Evaluate:

* Can this product grow beyond the hackathon?
* Can it support more users?
* Can more features or markets be added?
* Does the concept have long-term potential?
* Can this become a sustainable product?

---

## 7. Product Execution & Completeness — 15%

Evaluate:

* Is the product actually functional?
* Is there a working prototype?
* Are core features implemented?
* Does the submission demonstrate the claimed functionality?
* Is it only an idea, UI mockup, prototype, or usable product?

The AI should clearly classify the product as:

* Idea Stage
* Concept Prototype
* Functional Prototype
* MVP
* Early Product

---

## 8. Business Model & Sustainability — 10%

Evaluate:

* Does the product have potential for monetization?
* Is there a possible business model?
* Could the product become financially sustainable?
* Is the proposed model realistic for the target users?

Possible models may include:

* SaaS
* Subscription
* Freemium
* B2B
* Marketplace
* Licensing
* Transaction-based
* Enterprise

The AI must not force a business model where none is appropriate.

Instead, it can suggest realistic possibilities.

---

# TECH STACK ANALYSIS

Tech stack should be displayed and analyzed separately.

The AI should evaluate:

* Whether the selected technologies are appropriate
* Whether the architecture appears suitable for the product
* Whether the technology choices support scalability
* Whether the stack is unnecessarily complex
* Whether the technology provides meaningful value to the product

Important:

Do not give high scores simply because the participant used many technologies.

A simple and well-selected stack should be evaluated positively.

Example:

"React + Supabase may be more appropriate for this MVP than an unnecessarily complex microservice architecture."

---

# AI PRODUCT ANALYSIS OUTPUT

For every evaluated submission, generate a structured report.

## PRODUCT SUMMARY

Provide a concise summary explaining:

* What the product is
* Who it is for
* What problem it solves
* How it creates value

---

## PRODUCT STAGE

Classify the submission as one of:

* Idea Stage
* Concept Prototype
* Functional Prototype
* MVP
* Early Product

---

## SCORE BREAKDOWN

Display:

Problem Validation & Importance: X/10
Product Value & Usefulness: X/10
Innovation & Differentiation: X/10
Product Experience & Usability: X/10
Market Potential: X/10
Scalability & Growth Potential: X/10
Product Execution & Completeness: X/10
Business Model & Sustainability: X/10

Then calculate:

FINAL PRODUCT SCORE: XX/100

---

# PRODUCT STRENGTHS

Identify the strongest aspects of the product.

Example:

* Solves a clearly identifiable user problem.
* Strong potential value proposition.
* Functional MVP with core features implemented.
* Clear opportunity for expansion into additional markets.

---

# PRODUCT WEAKNESSES

Identify genuine weaknesses.

Example:

* Target user segment is not clearly defined.
* Product differentiation is limited.
* Monetization strategy is unclear.
* Current implementation may not scale beyond early users.

The AI must be constructive and specific.

Avoid generic feedback.

---

# PRODUCT POTENTIAL

Generate an evaluation such as:

High Potential
Medium Potential
Early Stage Potential
Limited Potential

Explain the reasoning.

---

# BUSINESS POTENTIAL

Analyze:

* Possible customers
* Potential monetization opportunities
* B2C or B2B suitability
* Startup potential
* Growth opportunities

This should be presented as analysis and recommendations, not as guaranteed predictions.

---

# PRODUCT IMPROVEMENT RECOMMENDATIONS

Generate 3 to 5 actionable recommendations.

Example:

1. Validate the problem with actual target users.
2. Improve differentiation from existing solutions.
3. Define a clearer monetization strategy.
4. Focus on one core user persona for the MVP.
5. Add metrics to measure user adoption.

Recommendations should be specific to the submission.

---

# TECH STACK REPORT

Display:

## Detected Tech Stack

Frontend:
Backend:
Database:
AI/ML:
Cloud/Deployment:
Third-Party APIs:

## Technology Assessment

Provide:

* Stack Suitability
* Complexity Assessment
* Scalability Considerations
* Recommended Improvements

---

# AI CONFIDENCE INDICATOR

Because the AI may not have complete information, display an evaluation confidence level:

High Confidence
Medium Confidence
Low Confidence

Example:

"Medium Confidence — The product description and demo were available, but limited information was provided regarding market validation and monetization."

---

# IMPORTANT AI RULES

The Groq-powered AI must:

1. Never invent features that are not present in the submission.
2. Never assume that a technology was used without evidence.
3. Never assume market validation without evidence.
4. Clearly identify missing information.
5. Focus on product value rather than technology quantity.
6. Treat AI APIs or AI integration alone as not automatically innovative.
7. Provide constructive and actionable feedback.
8. Return consistent structured JSON for reliable frontend rendering.
9. Calculate the weighted score deterministically in the backend rather than relying only on AI arithmetic.
10. Clearly separate facts from AI recommendations or assumptions.

---

# REQUIRED JSON RESPONSE FORMAT

The Groq AI should return structured JSON in this format:

{
"productSummary": "",
"productStage": "",
"evaluationConfidence": "",

"scores": {
"problemValidation": {
"score": 0,
"reason": ""
},
"productValue": {
"score": 0,
"reason": ""
},
"innovation": {
"score": 0,
"reason": ""
},
"productExperience": {
"score": 0,
"reason": ""
},
"marketPotential": {
"score": 0,
"reason": ""
},
"scalability": {
"score": 0,
"reason": ""
},
"productExecution": {
"score": 0,
"reason": ""
},
"businessModel": {
"score": 0,
"reason": ""
}
},

"strengths": [],
"weaknesses": [],

"targetUsers": [],
"marketOpportunity": "",

"businessPotential": {
"level": "",
"analysis": "",
"possibleModels": []
},

"techStackAnalysis": {
"detectedStack": [],
"suitability": "",
"complexity": "",
"scalability": "",
"recommendations": []
},

"productPotential": {
"level": "",
"reason": ""
},

"recommendations": [],

"missingInformation": []
}

---

# FINAL SCORE CALCULATION

Do not allow the AI to manually calculate the final weighted score.

The backend should calculate it using:

Problem Validation × 15%
Product Value × 15%
Innovation × 10%
Product Experience × 10%
Market Potential × 15%
Scalability × 10%
Product Execution × 15%
Business Model × 10%

The backend should convert the final score into a value out of 100.

---

# USER INTERFACE

Create a premium product-analysis interface inside the Hacker's Unity platform.

The evaluation page should contain:

1. Overall Product Score
2. Product Potential Level
3. Product Stage
4. Evaluation Confidence
5. Score Breakdown
6. AI Product Summary
7. Strengths
8. Weaknesses
9. Market Opportunity
10. Business Potential
11. Tech Stack Analysis
12. Missing Information
13. Actionable Recommendations

The interface should feel like a professional:

"Startup/Product Intelligence Report"

rather than a basic hackathon judging form.

Use clear data visualization, score cards, progress indicators, expandable sections, and a premium Hacker's Unity design language.

The entire evaluation should be generated using the Groq API and should analyze the participant submission as a potential real-world product and business, not merely as a hackathon project.
