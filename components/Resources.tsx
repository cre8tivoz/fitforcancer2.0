import React, { useState } from 'react';
import { ExternalLink, BookOpen, Heart, Activity, Utensils, ChevronDown, ChevronUp, User, Stethoscope, Users, Globe, MessageSquare } from 'lucide-react';

const CollapsibleCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = React.useId();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full bg-slate-50 px-6 py-5 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="font-bold text-slate-900 tracking-tight text-lg">{title}</h2>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && (
        <div id={contentId} className="p-8 border-t border-slate-100 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
};

const Resources: React.FC = () => {
  const supportResources = [
    {
      category: 'Exercise Physiologists & Physical Support',
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      items: [
        {
          title: 'ESSA - Find an Accredited Exercise Physiologist',
          description: 'Search for an AEP who specialises in oncology to help you manage treatment side effects safely.',
          url: 'https://www.essa.org.au/find-aep',
          tags: ['Find a Professional', 'Exercise Prescriptions']
        },
        {
          title: 'Pinc & Steel Cancer Rehab',
          description: 'Specialised oncology physiotherapy and exercise physiology programs across Australia and New Zealand.',
          url: 'https://www.pincandsteel.com/',
          tags: ['Rehabilitation', 'Physiotherapy']
        }
      ]
    },
    {
      category: 'Dietitians & Nutritional Support',
      icon: <Utensils className="w-5 h-5 text-orange-600" />,
      items: [
        {
          title: 'Dietitians Australia - Find a Dietitian',
          description: 'Connect with an Accredited Practising Dietitian (APD) with experience in oncology nutrition.',
          url: 'https://dietitiansaustralia.org.au/find-an-apd',
          tags: ['Find a Professional', 'Clinical Nutrition']
        },
        {
          title: 'Cancer Council - Nutrition Services',
          description: 'Access evidence-based information and support regarding diet and nutrition during and after cancer treatment.',
          url: 'https://www.cancer.org.au/support-and-services/after-treatment/nutrition-and-cancer',
          tags: ['Information', 'Dietary Advice']
        }
      ]
    },
    {
      category: 'Mental Health & Emotional Support',
      icon: <Heart className="w-5 h-5 text-rose-600" />,
      items: [
        {
          title: 'Beyond Blue',
          description: 'Providing information and support to help everyone in Australia achieve their best possible mental health.',
          url: 'https://www.beyondblue.org.au/',
          tags: ['Mental Health', 'Anxiety', 'Depression']
        },
        {
          title: 'Lifeline Australia',
          description: '24/7 crisis support and suicide prevention services for all Australians experiencing emotional distress.',
          url: 'https://www.lifeline.org.au/',
          tags: ['Crisis Support', '24/7 Service']
        },
        {
          title: 'Canteen',
          description: 'Supporting young people (12-25) when cancer turns their world upside down.',
          url: 'https://www.canteen.org.au/',
          tags: ['Youth Support', 'Family']
        }
      ]
    },
    {
      category: 'General Cancer Organisations',
      icon: <Users className="w-5 h-5 text-neon-blue" />,
      items: [
        {
          title: 'Cancer Council Australia',
          description: 'The leading national body for cancer control, providing support services and information.',
          url: 'https://www.cancer.org.au/',
          tags: ['General Support', 'Information']
        },
        {
          title: 'Myeloma Australia',
          description: 'Dedicated to supporting those living with myeloma through specialised nurses and community groups.',
          url: 'https://myeloma.org.au/',
          tags: ['Specialist Support', 'Nurses']
        },
        {
          title: 'Breast Cancer Network Australia (BCNA)',
          description: 'Ensuring Australians affected by breast cancer receive the very best support and care.',
          url: 'https://www.bcna.org.au/',
          tags: ['Breast Cancer', 'Support Network']
        },
        {
          title: 'Leukaemia Foundation',
          description: 'Supporting people living with blood cancer, including leukaemia, lymphoma, and myeloma.',
          url: 'https://www.leukaemia.org.au/',
          tags: ['Blood Cancer', 'Research']
        }
      ]
    }
  ];

  const citations = [
    {
      category: 'Exercise & Physical Activity (Oncology Standards)',
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      sources: [
        {
          title: 'COSA Position Statement on Exercise in Cancer Care',
          description: 'The foundational Australian document mandating that exercise be a standard part of cancer care to counteract side effects like fatigue.',
          url: 'https://www.cosa.org.au/groups/exercise-cancer-care/position-statement/'
        },
        {
          title: 'ESSA Consensus Statement - Exercise & Cancer',
          description: 'Provides the clinical framework for Accredited Exercise Physiologists (AEPs) to prescribe tailored, safe movement based on the FITT principle.',
          url: 'https://www.essa.org.au/Public/Public/News/ESSA_Position_Statement_on_Exercise_and_Cancer.aspx'
        },
        {
          title: 'Cancer Council Australia - Exercise & Cancer',
          description: 'Detailed guidance on managing side effects through low, moderate, and vigorous intensity activities.',
          url: 'https://www.cancer.org.au/support-and-services/after-treatment/exercise-for-people-living-with-cancer'
        },
        {
          title: 'Myeloma Australia - Exercise Info Sheet',
          description: 'Evidence-based justifications for supervised, individualised programmes that prioritise bone health.',
          url: 'https://myeloma.org.au/resources/exercise-and-myeloma/'
        }
      ]
    },
    {
      category: 'Nutrition & Dietetics (Oncology Standards)',
      icon: <Utensils className="w-5 h-5 text-orange-600" />,
      sources: [
        {
          title: 'Cancer Council Victoria - Nutrition for People Living with Cancer',
          description: 'Defines the "Nourishing Diet" (High Protein High Energy) required to manage treatment-induced malnutrition.',
          url: 'https://www.cancervic.org.au/get-support/nutrition-and-cancer'
        },
        {
          title: 'COSA Cancer-Related Malnutrition Toolkit',
          description: 'A clinical implementation guide used to screen and treat nutrition-impact symptoms.',
          url: 'https://www.cosa.org.au/groups/nutrition/malnutrition-toolkit/'
        },
        {
          title: 'ESPEN Practical Guideline: Clinical Nutrition in Cancer',
          description: 'Peer-reviewed evidence supporting protein intake above 1 g/kg/day and energy requirement management.',
          url: 'https://www.espen.org/guidelines-home/espen-guidelines'
        },
        {
          title: 'Peter MacCallum Cancer Centre Resources',
          description: 'Specific Australian guidelines for "Nourishing Diets" during chemotherapy and steroid cycles.',
          url: 'https://www.petermac.org/services/support-services/nutrition/nutrition-resources'
        }
      ]
    },
    {
      category: 'Therapeutic Movement & Safety (Physiotherapy Standards)',
      icon: <Heart className="w-5 h-5 text-rose-600" />,
      sources: [
        {
          title: 'Australian Physiotherapy Association (APA) - Five Facts on Cancer',
          description: 'Establishes exercise as the number one treatment for cancer-related fatigue (CRF).',
          url: 'https://australian.physio/'
        },
        {
          title: 'APA - Physiotherapy Cancer Care Continuum',
          description: 'Justifies the use of prehabilitation and restorative movement to improve recovery times.',
          url: 'https://australian.physio/'
        },
        {
          title: 'Exercise Modification & Progression (Cancer Exercise Toolkit)',
          description: 'Clinical rules for regressing exercise based on hematological markers and bone disease.',
          url: 'https://cancerexercisetoolkit.org.au/'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Clinical Safety Note:</strong> This evidence base is provided to support your journey. Please ensure you have medical clearance from your oncology team before starting any new exercise or nutrition protocols.
          </p>
        </div>
      </div>

      <header className="bg-slate-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-neon-blue" />
          <h1 className="text-3xl font-bold">Evidence & Resources</h1>
        </div>
        <p className="opacity-80 max-w-2xl">
          To comply with TGA requirements for medical software, this application cites the following Australian evidence-based guidelines and resources used to inform our exercise, nutrition, and AI assistant data.
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-neon-blue" />
            <h2 className="font-bold text-slate-900 tracking-tight text-lg">Support Organisations & Community</h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">Australian Resources</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {supportResources.map((section, sIdx) => (
            <div key={sIdx} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {section.icon}
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">{section.category}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-neon-blue/30 transition-all group flex flex-col h-full">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-neon-blue transition-colors">{item.title}</h4>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 bg-white text-slate-400 rounded-lg hover:bg-neon-blue/10 hover:text-neon-blue transition-all"
                        aria-label={`Visit ${item.title} website (opens in new tab)`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3 flex-grow">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white text-slate-400 rounded border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Need immediate support? Call Cancer Council on <a href="tel:131120" className="font-bold hover:underline text-slate-900" aria-label="Call Cancer Council on 1 3 1 1 2 0">13 11 20</a>
          </p>
        </div>
      </section>

      <div className="space-y-6">
        <CollapsibleCard 
          title='🟢 Patient-Facing Summary: "Moving with Your Energy"' 
          icon={<User className="w-6 h-6 text-emerald-600" />}
        >
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">This guide is designed for anyone navigating a health journey, focusing on energy management rather than specific diagnoses.</p>
            
            <h3 className="text-lg font-bold text-slate-900 mb-3">Why the Traffic Light System?</h3>
            <p className="text-slate-600 mb-4">Managing a health condition can make your energy levels feel like a moving target. This tool uses a 0–10 scale and a "Traffic Light" system to help you match your daily activities to your current "energy budget".</p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex gap-3">
                <span className="text-xl">🟢</span>
                <div>
                  <strong className="text-slate-900">Green (Score 0–3):</strong>
                  <p className="text-slate-600">Your energy is stable. This is the time to focus on building your strength and stamina.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🟡</span>
                <div>
                  <strong className="text-slate-900">Yellow (Score 4–6):</strong>
                  <p className="text-slate-600">Your energy is dipping. We pivot to "Active Rest"—gentle movements that keep you mobile without draining you.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl">🔴</span>
                <div>
                  <strong className="text-slate-900">Red (Score 7–10):</strong>
                  <p className="text-slate-600">Your energy is low. The priority shifts to Recovery and Energy Conservation. We focus on breathing and gentle circulation to help your body recharge.</p>
                </div>
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-900 mb-3">How it helps you:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">Safety First</h4>
                <p className="text-sm text-slate-600">Automatically filters out high-intensity activities when you are in a high-fatigue state.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">Smart Nutrition</h4>
                <p className="text-sm text-slate-600">Matches meal ideas to your energy budget—from standard cooking when you are feeling "Green" to zero-prep "Red Zone" snacks.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">Empowerment</h4>
                <p className="text-sm text-slate-600">You are the expert on your body. Update your score at any time to see the recommendations change instantly.</p>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard 
          title="📂 Clinician Summary: Technical Evidence Base" 
          icon={<Stethoscope className="w-6 h-6 text-blue-600" />}
        >
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6 italic">A technical overview for Oncologists, Haematologists, and Allied Health professionals.</p>
            
            <h3 className="text-lg font-bold text-slate-900 mb-3">Clinical Framework:</h3>
            <p className="text-slate-600 mb-6">The 'Fit For Cancer' Assistant is built on the COSA Position Statement on Exercise in Cancer Care and ESSA Consensus Guidelines. It utilises a Visual Analogue Scale (VAS) for fatigue to dynamically triage patients into three intensity tiers.</p>
            
            <div className="space-y-6">
              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">1</span>
                  Exercise Triage:
                </h4>
                <ul className="list-disc pl-10 text-slate-600 space-y-2">
                  <li><strong>Red Zone (Severe Fatigue):</strong> Prioritises restorative movement to prevent deconditioning while minimising orthostatic strain (e.g., supine ankle pumps, diaphragmatic breathing).</li>
                  <li><strong>Yellow/Green Zones:</strong> Scales intensity from low-load mobility to resistance-based strength training, aligning with APA Oncology Physiotherapy standards.</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">2</span>
                  Nutritional Intervention:
                </h4>
                <ul className="list-disc pl-10 text-slate-600 space-y-2">
                  <li>Recommendations focus on High Protein High Energy (HPHE) snacks and meal frequency to combat treatment-induced sarcopenia and malnutrition.</li>
                  <li>Specific logic is included for Steroid Rebound (e.g., Dexamethasone), prioritising hydration and low-glycaemic fuel to manage the post-steroid "crash".</li>
                </ul>
              </section>

              <section>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">3</span>
                  TGA & Safety Guardrails:
                </h4>
                <ul className="list-disc pl-10 text-slate-600 space-y-2">
                  <li>The system includes active contraindication alerts for bone pain and localised discomfort, particularly relevant for patients with metastatic disease or Multiple Myeloma.</li>
                  <li>All guidance is designed as a supportive adjunct to clinical care and includes mandatory medical consultation disclaimers.</li>
                </ul>
              </section>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard 
          title="📚 Helpful Articles & Guides" 
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">Managing Cancer-Related Fatigue</h4>
              <p className="text-sm text-slate-600 mb-4">Learn about the "3 P's" (Pacing, Prioritising, Positioning) and how to manage your energy battery during treatment.</p>
              <a 
                href="https://www.cancer.org.au/support-and-services/after-treatment/fatigue" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-neon-blue uppercase tracking-widest flex items-center gap-1 hover:underline"
                aria-label="Read Guide: Managing Cancer-Related Fatigue (opens in new tab)"
              >
                Read Guide <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">Exercise Safety for Myeloma</h4>
              <p className="text-sm text-slate-600 mb-4">Specific considerations for bone health and safe movement for Multiple Myeloma patients.</p>
              <a 
                href="https://myeloma.org.au/resources/exercise-and-myeloma/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-neon-blue uppercase tracking-widest flex items-center gap-1 hover:underline"
                aria-label="Read Article: Exercise Safety for Myeloma (opens in new tab)"
              >
                Read Article <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">Nutrition During Chemotherapy</h4>
              <p className="text-sm text-slate-600 mb-4">Tips for managing nausea, taste changes, and maintaining your weight during active treatment cycles.</p>
              <a 
                href="https://www.cancervic.org.au/get-support/nutrition-and-cancer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-neon-blue uppercase tracking-widest flex items-center gap-1 hover:underline"
                aria-label="View Resources: Nutrition During Chemotherapy (opens in new tab)"
              >
                View Resources <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">Mental Health & Cancer</h4>
              <p className="text-sm text-slate-600 mb-4">Understanding the emotional impact of a diagnosis and where to find psychological support in Australia.</p>
              <a 
                href="https://www.beyondblue.org.au/the-facts/cancer-and-mental-health" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-neon-blue uppercase tracking-widest flex items-center gap-1 hover:underline"
                aria-label="Access Support: Mental Health & Cancer (opens in new tab)"
              >
                Access Support <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Privacy & Sensitive Data Handling"
          icon={<Globe className="w-6 h-6 text-[color:var(--color-tertiary)]" />}
        >
          <div className="space-y-6 text-sm leading-7 text-slate-600">
            <section className="space-y-2">
              <p><strong className="text-slate-900">1. Your Data Stays With You (No Accounts)</strong></p>
              <p>Currently, Fit For Cancer operates entirely without user accounts. Your triage information (such as your energy levels and Quick Notes) is stored locally on your own device using your browser&apos;s temporary memory. We do not store your personal health profile in a central database. When you close your browser or clear your cache, your local session resets.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">2. The AI Health Assistant</strong></p>
              <p>When you interact with the Health Assistant, your messages and local triage context are transmitted securely via an encrypted connection to generate your personalised advice. This data is completely anonymous—it is not linked to your name, email, or identity. Furthermore, our secure backend ensures your private conversations are never used to train public AI models.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">3. Voice Dictation is Strictly Local</strong></p>
              <p>If you use the microphone feature for Quick Notes, your voice is processed entirely by your device&apos;s native browser (such as Apple&apos;s or Google&apos;s built-in accessibility features). Fit For Cancer does not record, save, or transmit your audio files to any external servers. The translation to text happens right on your phone or computer.</p>
            </section>

            <section className="space-y-2">
              <p><strong className="text-slate-900">4. Australian Privacy Principles (APPs)</strong></p>
              <p>We are guided by the Australian Privacy Act 1988, specifically focusing on &apos;Data Minimisation.&apos; We only ask for the minimum amount of context required to provide safe, evidence-based support for your current session. Because we do not collect Identifiable Electronic Health Records (EHR), you remain in complete, anonymous control of your digital footprint.</p>
            </section>
          </div>
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {citations.map((section, idx) => (
          <section key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
              {section.icon}
              <h2 className="font-bold text-slate-900 uppercase tracking-wider text-sm">{section.category}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {section.sources.map((source, sIdx) => (
                <div key={sIdx} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 group-hover:text-neon-blue transition-colors">{source.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{source.description}</p>
                    </div>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-neon-blue/10 hover:text-neon-blue transition-all"
                      aria-label={`Visit ${source.title} resource (opens in new tab)`}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100 shadow-sm">
        <h3 className="font-bold text-rose-900 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          TGA Compliance & Clinical Safety
        </h3>
        <div className="space-y-4 text-rose-800 text-sm leading-relaxed">
          <p>
            <strong>Mandatory Medical Disclaimer:</strong> This application is designed to <strong>complement</strong>, rather than replace, professional medical advice. The information provided is for educational purposes and is aligned with Australian oncology standards (COSA & ESSA).
          </p>
          <p>
            It does not replace the personalised guidance of your <strong>medical oncologist, haematologist, or specialised physiotherapist</strong>. All clinical advice is traceable to the recognised Australian authorities listed above. If you are experiencing any new or worsening symptoms, please contact your medical team immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

const ShieldAlert: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default Resources;
