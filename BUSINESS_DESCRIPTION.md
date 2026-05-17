# MockITV — Business Analysis & Project Overview
 
## 1. Reason for Choosing This Topic
 
Interview preparation is one of the most critical challenges for software engineers and technology professionals. While theoretical knowledge can be studied from books, real-world mock interviews are extremely difficult to organize and professional mentoring services are prohibitively expensive.
 
We chose this topic because:
- **High Mentor/Interviewer Costs:** Booking experienced interviewers for mock sessions costs hundreds of dollars per hour, making it inaccessible for student developers, interns, and junior engineers.
- **Scheduling Bottlenecks:** Coordinating schedules between active developers (mentors) and candidates is highly inefficient.
- **AI Adaptability:** LLMs (specifically Google Gemini) have matured to a level where they can act as highly realistic, technical, and behavioral interviewers tailored to any custom tech stack and experience level.
- **Practical Application:** This project is highly relevant to modern software development, directly addressing career growth and employability.
 
The project also provides an excellent opportunity to combine:
- **Full-stack Development:** Building high-performance services with React/Next.js (Frontend) and FastAPI/Python (Backend).
- **Advanced Prompt Engineering:** Instructing AI models to act as strict, realistic interviewers and output stable structured data.
- **Cost-Optimized AI Architectures:** Implementing batch-evaluation strategies to reduce API token costs by over 80%.
- **Visualized Feedback Systems:** Highlighting user answers in green/yellow/red with interactive micro-animations.
 
---
 
## 2. Pain Points
 
### Generic and Unhelpful Feedback
When candidate developers fail real interviews, they rarely receive detailed, actionable feedback. Traditional online mock tools only give generic, wall-of-text AI reviews that do not pinpoint exactly where the candidate succeeded or struggled.
 
### High Cost of Practice
Quality mock interviews are:
- Expensive (recurring subscription or high hourly mentor fees)
- Infrequent (limited by availability of real human interviewers)
- Stressful (candidates prefer a safe, private space to practice their initial answers first)
 
This dramatically slows down career transition and interview preparation efficiency.
 
### Lack of Granular, Sentence-Level Analysis
Candidates do not just fail or pass a question as a whole. They might answer the core concept correctly but miss specific technical keywords or details. 
- Existing platforms lack the ability to break down a candidate's actual answer word-for-word.
- Candidates cannot easily see which exact phrases were considered "excellent" (green), "incomplete" (yellow), or "missing/incorrect" (red).
 
---
 
## 3. Proposed Solution & Next Action
 
### Current Solution
**MockITV** addresses all these pain points through a fully-automated, state-of-the-art AI Mock Interview platform:
- **Personalized Session Generation:** Generates customized sets of technical, situational, and behavioral questions based on the candidate's target Job Title, Experience Level (Intern, Junior, Senior, Principal), and Tech Stack (Java, Node.js, Spring Boot, AWS, system design, etc.).
- **Efficient Token Batching Mechanism:** Instead of requesting AI assessment after every single question, the system collects all user answers during the session and evaluates them in a single batch request once the interview finishes. This reduces LLM API token overhead and response latency dramatically.
- **Granular Verbatim Highlighting:** Parses candidate's exact responses and styles them dynamically using color-coded status elements (success/warning/danger). Renders instant pop-up tooltips containing AI explanation, missing concepts, and concrete improvement advice.
- **Smart Fallback Verification:** Implements real-time front-end validation to gracefully handle older legacy mock evaluations or formatting anomalies by dynamically falling back to raw answers styled based on performance scores.
 
### Next Actions for Future Development
 
#### Voice & Speech-to-Text Integration
Integrate Web Speech API / Whisper API to allow candidates to speak their answers out loud, simulating a real online Zoom/Teams interview and evaluating speaking pace, filler words, and vocal confidence.
 
#### AI Behavioral & Face Analysis
Utilize camera integration to analyze candidate facial expressions and eye contact to deliver behavioral tips on body language and confidence.
 
---
 
## 4. Issues During Implementation
 
### Unstable JSON Formatting from LLM
AI models occasionally return unstructured markdown or include introductory conversational phrases instead of returning raw segmented chunks matching the user's verbatim text.
- **Resolution:** Upgraded the system prompt with strict matching rules (verbatim string segmentation) and created an elegant frontend IIFE verification check to safeguard the user experience and ensure smooth data rendering.
 
### Aspect-Ratio & Typography Layout Clipping
Modern sans-serif typography like *Outfit* features tall glyph boundaries. Combining it with strict vertical bounding elements (such as strict `aspect-[5/3]` values and tight line-height constraints on cards) led to cropped and vertically cut titles on various screen sizes.
- **Resolution:** Replaced rigid card constraints with flexible minimum height grids (`min-h-[240px]` & `min-h-[250px]`) and applied relaxed typography line heights (`leading-normal py-1`) to enable beautiful, fluid rendering on all screen viewports.
