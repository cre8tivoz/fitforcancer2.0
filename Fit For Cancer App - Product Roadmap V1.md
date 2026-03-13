# **Fit For Cancer App \- Product Roadmap (V1.1 \- V1.5)**

**Priority 1: Markdown UI Polish** (Immediate UX win)

* **Goal:** Improve the readability of AI responses so exercise lists and nutritional guidelines look like professional health plans.  
* **Implementation:** Use `react-markdown` on the frontend to parse AI output. Apply clean, mobile-friendly CSS styles to lists, bold text, and headers.

**Priority 2: Voice Dictation** (High accessibility impact)

* **Goal:** Reduce motor load for patients in the "Red Zone" (high fatigue/steroid crash) who may find typing exhausting.  
* **Implementation:** Integrate the native HTML5 Web Speech API (SpeechRecognition) into the 'Quick Note' micro-form for hands-free logging.

**Priority 3: Persistent Local Memory** (Context retention)

* **Goal:** Ensure users don't have to repeat their specific cancer diagnosis or chronic restrictions across sessions.  
* **Implementation:** Save patient context to browser `localStorage` and pass it to the Vercel backend. Set a strict **14-day expiration** to keep the app lightweight and respect privacy without requiring user accounts.

**Priority 4: Energy Bank Charting** (Clinical data visualization)

* **Goal:** Visualize the "boom-bust" energy cycles of treatments for patients to share with their haematologists/oncologists.  
* **Implementation:** Plot daily 0-10 VAS scores on a line chart. *Strategy:* Pilot this feature with blood cancer profiles first before a wider rollout.

**Priority 5: Caregiver Status Sync** (Passive communication)

* **Goal:** Allow users to share their current energy zone/needs with family members via a single tap.  
* **Implementation:** Currently pushed down the list pending strict privacy and **TGA (Therapeutic Goods Administration)** compliance review regarding the transmission of health data from a medical device/app.

**Priority 6: Verified Resource Links** (Trust and UI enhancement)

* **Goal:** Surface the evidence-based Australian oncology resources (e.g., COSA) the AI uses.  
* **Implementation:** Format AI references cleanly and render them as clickable "Smart Chips" or UI buttons at the bottom of the chat interface.

**Priority 7: Export Plan** (Quality of life)

* **Goal:** Reduce cognitive load by allowing users to easily save AI-generated mobility or nutrition routines.  
* **Implementation:** Add a client-side "Download" button to save specific AI responses as a clean `.txt` or PDF file.

