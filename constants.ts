
import { Recipe, Movement } from './types';
import bicepCurlsImage from './media/exercises/bicep curls.jpg';
import briskWalkingImage from './media/exercises/brisk walking.jpg';
import chairSquatsImage from './media/exercises/chair squats.jpg';
import fitForCancer02Image from './media/exercises/fit-for-cancer-02.jpg';
import fitForCancer03Image from './media/exercises/fit-for-cancer-03.jpg';
import fitForCancer04Image from './media/exercises/fit-for-cancer-04.jpg';
import fitForCancer05Image from './media/exercises/fit-for-cancer-05.jpg';
import fitForCancer06Image from './media/exercises/fit-for-cancer-06.jpg';
import fitForCancer07Image from './media/exercises/fit-for-cancer-07.jpg';
import fitForCancer08Image from './media/exercises/fit-for-cancer-08.jpg';
import fitForCancer12Image from './media/exercises/fit-for-cancer-12.jpg';
import fitForCancer13Image from './media/exercises/fit-for-cancer-13.jpg';
import fitForCancer14Image from './media/exercises/fit-for-cancer-14.jpg';
import fitForCancer15Image from './media/exercises/fit-for-cancer-15.jpg';
import mindfulBreathingStretchImage from './media/exercises/mindful breathing & stretch.jpg';
import classicSpaghettiWithButterImage from './media/nutrition/classic_spaghetti_with_butter.jpg';
import energyBlitzGreekYoghurtImage from './media/nutrition/energy_blitz_greek_yoghurt.jpg';
import gingerTurmericBrothImage from './media/nutrition/ginger__turmeric_broth.jpg';
import highProteinOvernightOatsImage from './media/nutrition/high_protein_overnight_oats.jpg';
import hydratingWatermelonMintCoolerImage from './media/nutrition/hydrating_watermelon__mint_cooler.jpg';
import lowFlavourChickenAndRiceSoupImage from './media/nutrition/low_flavour_chicken_and_rice_soup.jpg';
import poachedChickenAndSteamedGreensImage from './media/nutrition/poached_chicken_and_steamed_greens.jpg';
import pelvicTiltImage from './media/exercises/pelvic-tilt.jpg';
import proteinPackedBerrySmoothieImage from './media/nutrition/protein_packed_berry_smoothie.jpg';
import redLentilSpinachDahlImage from './media/nutrition/red_lentil__spinach_dahl.jpg';
import sardineEmergencyToastImage from './media/nutrition/sardine_emergency_toast.jpg';
import seatedLegRaiseImage from './media/exercises/seated leg raise.jpg';
import softRoastedRootVegetablesImage from './media/nutrition/soft_roasted_root_vegetables.jpg';
import theCrashShakeImage from './media/nutrition/the_crash_shake.jpg';
import wallPushUpsImage from './media/exercises/wall push ups.jpg';
import wallSlidesImage from './media/exercises/wall slides.jpg';
import zucchiniFetaMuffinsImage from './media/nutrition/zucchini__feta_muffins.jpg';

export const RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Protein-Packed Berry Smoothie',
    category: 'High Protein',
    ingredients: ['1 cup (125g) frozen mixed berries', '1 scoop (30g) vanilla protein powder', '150g Greek yogurt', '250ml unsweetened almond milk', '1 tsp (5ml) honey or maple syrup'],
    instructions: [
      'Place the frozen berries, protein powder, and Greek yogurt into a blender.',
      'Pour in the almond milk and add the honey.',
      'Blend on high speed for 45-60 seconds until completely smooth.',
      'Pour into a chilled glass and serve immediately.'
    ],
    imageUrl: proteinPackedBerrySmoothieImage,
    prepTime: '5 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'High protein and antioxidants to support muscle maintenance and recovery.',
    citation: '(Cancer Council AU)'
  },
  {
    id: '2',
    title: 'Ginger & Turmeric Broth',
    category: 'Anti-Nausea',
    ingredients: ['500ml vegetable or chicken stock', '2cm piece fresh ginger, thinly sliced', '1/2 tsp ground turmeric', 'Juice of 1/2 lemon', 'Pinch of sea salt'],
    instructions: [
      'In a small saucepan, combine the stock, sliced ginger, and turmeric.',
      'Bring to a gentle simmer over medium heat for 10 minutes to infuse the flavours.',
      'Remove from heat and strain the broth through a fine-mesh sieve into a mug.',
      'Stir in the lemon juice and salt before sipping slowly.'
    ],
    imageUrl: gingerTurmericBrothImage,
    prepTime: '5 mins',
    cookTime: '10 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'Anti-inflammatory and soothing for the digestive system, helping to manage nausea.',
    citation: '(Cancer Council AU)'
  },
  {
    id: '3',
    title: 'Zucchini & Feta Muffins',
    category: 'Easy to Digest',
    ingredients: ['2 cups (approx. 300g) grated zucchini, excess water squeezed out', '100g feta cheese, crumbled', '2 large eggs, lightly beaten', '150g self-raising flour', '60ml (1/4 cup) olive oil'],
    instructions: [
      'Preheat your oven to 180°C and grease a 6-hole muffin tin.',
      'In a large bowl, combine the grated zucchini, crumbled feta, and beaten eggs.',
      'Fold in the flour and olive oil until just combined (do not over-mix).',
      'Divide the mixture evenly between the muffin holes.',
      'Bake for 20-25 minutes until golden brown and firm to the touch.'
    ],
    imageUrl: zucchiniFetaMuffinsImage,
    prepTime: '15 mins',
    cookTime: '25 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Provides gentle fibre and protein in an easy-to-eat format.',
    citation: '(Cancer Council AU)'
  },
  {
    id: '4',
    title: 'Soft Roasted Root Vegetables',
    category: 'Easy to Digest',
    ingredients: ['200g pumpkin, peeled and cubed', '1 medium sweet potato (approx. 250g), peeled and cubed', '2 carrots, peeled and sliced into rounds', '40ml (2 tbsp) olive oil', '1 tsp dried rosemary or thyme', 'Pinch of salt'],
    instructions: [
      'Preheat oven to 200°C and line a baking tray with baking paper.',
      'Place all prepared vegetables in a large bowl and toss with olive oil, herbs, and salt.',
      'Spread the vegetables in a single layer on the prepared tray.',
      'Roast for 35-40 minutes, turning halfway, until the vegetables are very soft and slightly caramelised.',
      'For extra ease of swallowing, mash the vegetables with a fork before serving.'
    ],
    imageUrl: softRoastedRootVegetablesImage,
    prepTime: '10 mins',
    cookTime: '40 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Rich in beta-carotene and complex carbohydrates for sustained energy release.',
    citation: '(Cancer Council AU)'
  },
  {
    id: '5',
    title: 'Poached Chicken & Steamed Greens',
    category: 'High Protein',
    ingredients: ['1 chicken breast (approx. 200g)', '500ml low-sodium chicken stock', '1 cup broccoli florets', '1 bunch bok choy, trimmed', '1 lemon wedge for serving'],
    instructions: [
      'In a medium saucepan, bring the chicken stock to a very gentle simmer.',
      'Carefully place the chicken breast into the stock; it should be fully submerged.',
      'Poach for 12-15 minutes (depending on thickness) until the chicken is cooked through and opaque.',
      'While the chicken finishes, place a steamer basket over the pot and steam the broccoli and bok choy for 3-4 minutes until tender-crisp.',
      'Remove the chicken, slice thinly, and serve alongside the greens with a squeeze of lemon.'
    ],
    imageUrl: poachedChickenAndSteamedGreensImage,
    prepTime: '10 mins',
    cookTime: '15 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Lean protein for tissue repair and essential vitamins from dark leafy greens.',
    citation: '(COSA 2020)'
  },
  {
    id: '6',
    title: 'Classic Spaghetti with Butter',
    category: 'Easy to Digest',
    ingredients: ['100g dried spaghetti or fettuccine', '40g unsalted butter, cubed', '60ml (1/4 cup) reserved pasta water', '1 tbsp finely grated mild parmesan (optional)'],
    instructions: [
      'Cook the pasta in a large pot of boiling salted water until it is very soft (slightly past al dente for easier digestion).',
      'Before draining, carefully scoop out 1/4 cup of the starchy pasta water.',
      'Drain the pasta and return it to the warm pot.',
      'Add the butter and the reserved pasta water, tossing gently until the butter is melted and the pasta is coated in a glossy sauce.',
      'Serve immediately, topped with parmesan if desired.'
    ],
    imageUrl: classicSpaghettiWithButterImage,
    prepTime: '5 mins',
    cookTime: '12 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Simple carbohydrates that are easy on the stomach when appetite is low.',
    citation: '(Cancer Council AU)'
  },
  {
    id: '7',
    title: 'Low-Flavour Chicken & Rice Soup',
    category: 'Anti-Nausea',
    ingredients: ['2 chicken drumsticks, skin and visible fat removed', '1.5L cold water', '100g (1/2 cup) white long-grain rice', '1 stalk celery, very finely diced', '1 small carrot, very finely diced'],
    instructions: [
      'Place the chicken drumsticks and water in a large pot. Bring to a boil, then reduce heat to low.',
      'Simmer gently for 1 hour, occasionally skimming any foam or fat from the surface with a spoon.',
      'Remove the chicken drumsticks. Once cool enough to handle, shred the meat and discard the bones.',
      'Add the rice, celery, and carrot to the broth. Simmer for another 20 minutes until the rice is very soft.',
      'Return the shredded chicken to the pot, heat through, and season with a small pinch of salt.'
    ],
    imageUrl: lowFlavourChickenAndRiceSoupImage,
    prepTime: '10 mins',
    cookTime: '1 hour 20 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Hydrating and nourishing with minimal aroma to avoid triggering nausea.',
    citation: '(Peter Mac)'
  },
  {
    id: '8',
    title: 'High-Protein Overnight Oats',
    category: 'High Protein',
    ingredients: ['45g (1/2 cup) rolled oats', '1 scoop (30g) vanilla protein powder', '1 tbsp (15g) LSA mix (Linseed, Sunflower, Almond)', '125ml (1/2 cup) milk of your choice', '40g (1/4 cup) frozen or fresh berries', '1 tsp honey'],
    instructions: [
      'In a clean glass jar or container, combine the oats, protein powder, and LSA mix.',
      'Pour in the milk and stir thoroughly until the protein powder is fully dissolved.',
      'Gently fold in the berries and drizzle with honey.',
      'Seal the container and place in the refrigerator for at least 4 hours, or ideally overnight.',
      'Stir again before eating; add a splash more milk if the consistency is too thick.'
    ],
    imageUrl: highProteinOvernightOatsImage,
    prepTime: '10 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'Slow-release energy from oats combined with high protein for satiety.',
    citation: '(ESPEN)'
  },
  {
    id: '9',
    title: 'Red Lentil & Spinach Dhal',
    category: 'High Protein',
    ingredients: ['200g (1 cup) red lentils, rinsed well', '750ml (3 cups) vegetable stock', '1 tsp ground turmeric', '1 tsp ground cumin', '60g (2 cups) fresh baby spinach', '125g (1/2 cup) Greek yogurt'],
    instructions: [
      'Place the rinsed lentils, vegetable stock, turmeric, and cumin in a medium saucepan.',
      'Bring to a boil, then reduce heat and simmer for 20-25 minutes until the lentils have broken down and the mixture is thick and creamy.',
      'Stir in the baby spinach and cook for 1-2 minutes until just wilted.',
      'Divide into bowls and top with a generous dollop of Greek yogurt for extra protein and creaminess.'
    ],
    imageUrl: redLentilSpinachDahlImage,
    prepTime: '5 mins',
    cookTime: '25 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Plant-based protein and iron, essential for red blood cell production.',
    citation: '(COSA 2020)'
  },
  {
    id: '10',
    title: 'Hydrating Watermelon & Mint Cooler',
    category: 'Hydrating',
    ingredients: ['500g (approx. 3 cups) seedless watermelon, cubed', '5-6 fresh mint leaves', 'Juice of 1/2 lime', '125ml (1/2 cup) coconut water'],
    instructions: [
      'Place the watermelon cubes, mint leaves, lime juice, and coconut water into a blender.',
      'Pulse several times, then blend on high until completely liquid.',
      'If you have mouth sores, you may wish to strain the mixture through a sieve to remove any pulp.',
      'Serve chilled or over ice for a refreshing, hydrating drink.'
    ],
    imageUrl: hydratingWatermelonMintCoolerImage,
    prepTime: '10 mins',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'Excellent for hydration and soothing mouth sores with natural electrolytes.',
    citation: '(Peter Mac)'
  },
  {
    id: '11',
    title: 'The "Crash" Shake',
    category: 'Zero-Prep',
    ingredients: ['1 cup full-cream milk', '1 scoop protein powder', '1 tbsp peanut butter', '1 small banana'],
    instructions: [
      'Blend until smooth (or stir vigorously if a blender is too much work).'
    ],
    imageUrl: theCrashShakeImage,
    prepTime: '2 mins',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'High protein and healthy fats to stabilize energy during steroid rebound.',
    citation: '(Peter Mac)'
  },
  {
    id: '12',
    title: 'Energy Blitz Greek Yogurt',
    category: 'Quick Assembly',
    ingredients: ['1 individual tub Greek yogurt', '1 tbsp honey', '1 tbsp hemp hearts or chia seeds'],
    instructions: [
      'Stir honey and seeds directly into the tub.'
    ],
    imageUrl: energyBlitzGreekYoghurtImage,
    prepTime: '2 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'High calcium and protein; seeds provide anti-inflammatory omega-3s.',
    citation: '(Cancer Council AU)'
  },
  {
    id: '13',
    title: 'Sardine "Emergency" Toast',
    category: 'Quick Assembly',
    ingredients: ['1 tin sardines in oil', '1 slice whole-grain toast (optional)', 'squeeze of lemon'],
    instructions: [
      'Mash sardines directly in the tin and eat with a fork or on toast.'
    ],
    imageUrl: sardineEmergencyToastImage,
    prepTime: '3 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'Lean protein and iron to help combat anemia-related fatigue.',
    citation: '(COSA 2020)'
  },
  {
    id: '14',
    title: 'Fortified Milky Drink',
    category: 'Zero-Prep',
    ingredients: ['1 cup warm milk', '1 tbsp milk powder (Sustagen or similar)', '1 tsp Milo/Horlicks'],
    instructions: [
      'Whisk powder into warm milk for an easy-to-sip calorie boost.'
    ],
    imageUrl: 'https://picsum.photos/seed/milky-drink/600/400',
    prepTime: '2 mins',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'Liquid calories are easier to consume when too tired for solid meals.',
    citation: '(Peter Mac)'
  }
];

export const MOVEMENTS: Movement[] = [
  {
    id: '1',
    title: 'Seated Leg Extensions',
    intensity: 'Green',
    duration: '5-10 mins',
    benefit: 'Maintains quad strength',
    mentalWellbeingBenefit: 'Reduces anxiety through rhythmic movement.',
    strengthBenefit: 'Builds foundational lower body stability.',
    description: 'While sitting in a sturdy chair, slowly straighten one leg out in front of you, hold for 2 seconds, and lower. Alternate legs.',
    safetyNote: 'Do not lock your knee. Stop if you feel sharp pain. Ensure your back is supported.',
    imageUrl: seatedLegRaiseImage,
    citation: '(ESSA)'
  },
  {
    id: '2',
    title: 'Gentle Wall Push-ups',
    intensity: 'Yellow',
    duration: '5-10 mins',
    benefit: 'Upper body endurance',
    mentalWellbeingBenefit: 'Boosts confidence by achieving physical milestones.',
    strengthBenefit: 'Strengthens chest, shoulders, and triceps.',
    description: 'Stand arms length from a wall. Place palms flat at shoulder height. Lean in slowly by bending elbows, then push back to start.',
    safetyNote: 'Maintain a straight back. ⚠️ If you have had chest or breast surgery, please ensure you have clearance from your surgeon or physiotherapist before performing movements that involve significant chest or shoulder engagement.',
    imageUrl: wallPushUpsImage,
    citation: '(COSA 2020)'
  },
  {
    id: '3',
    title: 'Brisk Walking',
    intensity: 'Green',
    duration: '15-30 mins',
    benefit: 'Cardiovascular health',
    mentalWellbeingBenefit: 'Improves mood through increased blood flow and fresh air.',
    strengthBenefit: 'Enhances overall stamina and leg endurance.',
    description: 'A steady walk at a pace where you can still talk but might feel slightly puffed. Can be done indoors or outdoors.',
    safetyNote: 'Ensure you have comfortable, supportive shoes and stay hydrated. Avoid extreme heat.',
    imageUrl: briskWalkingImage,
    citation: '(Cancer Council AU)'
  },
  {
    id: '4',
    title: 'Bicep Curls (Household Weights)',
    intensity: 'Yellow',
    duration: '5-10 mins',
    benefit: 'Upper limb strength',
    mentalWellbeingBenefit: 'Creates a sense of routine and control.',
    strengthBenefit: 'Tones biceps and improves grip strength.',
    description: 'Hold a can of soup or a water bottle in each hand. Keep elbows tucked to your sides and slowly curl the weights towards your shoulders.',
    safetyNote: 'Control the movement on the way down. Start with light items (approx 400g) and progress slowly.',
    imageUrl: bicepCurlsImage,
    citation: '(ESSA)'
  },
  {
    id: '5',
    title: 'Sit-to-Stand (Chair Squats)',
    intensity: 'Yellow',
    duration: '5-10 mins',
    benefit: 'Functional lower body strength',
    mentalWellbeingBenefit: 'Empowers daily independence and mobility.',
    strengthBenefit: 'Targets glutes, quads, and core stability.',
    description: 'Stand in front of a sturdy chair. Slowly lower your hips towards the seat as if to sit, then stand back up before touching the chair.',
    safetyNote: 'Keep your weight in your heels. Use the chair arms for support if needed. Ensure the chair won\'t slide.',
    imageUrl: chairSquatsImage,
    citation: '(ESSA)'
  },
  {
    id: '6',
    title: 'Wall Slides (Shoulder Mobility)',
    intensity: 'Yellow',
    duration: '5 mins',
    benefit: 'Flexibility & Posture',
    mentalWellbeingBenefit: 'Relieves tension in the neck and shoulders.',
    strengthBenefit: 'Improves shoulder blade stability and posture.',
    description: 'Stand with your back against a wall. Raise arms to the side with elbows bent at 90 degrees. Slowly slide arms up the wall and back down.',
    safetyNote: 'Only go as high as comfortable. ⚠️ If you have had chest or breast surgery, please ensure you have clearance from your surgeon or physiotherapist before performing movements that involve raising your arms above shoulder height.',
    imageUrl: wallSlidesImage,
    citation: '(APA)'
  },
  {
    id: '7',
    title: 'Diaphragmatic "Belly" Breathing',
    intensity: 'Red',
    duration: '5-10 mins',
    benefit: 'Parasympathetic Activation',
    mentalWellbeingBenefit: 'Helps reduce anxiety and manages shortness of breath.',
    strengthBenefit: 'Maintains core awareness and internal pressure regulation.',
    description: 'Lie on your back with knees bent. Place one hand on your belly. Breathe in slowly through the nose, feeling the belly rise, then exhale slowly.',
    safetyNote: 'Cancer Council AU: Helps reduce anxiety and manages the shortness of breath often associated with severe fatigue.',
    imageUrl: mindfulBreathingStretchImage,
    citation: '(Cancer Council AU)'
  },
  {
    id: '8',
    title: 'Ankle Pumps (Circulation)',
    intensity: 'Red',
    duration: '2-5 mins',
    benefit: 'DVT Prevention',
    mentalWellbeingBenefit: 'Provides a sense of active recovery and safety.',
    strengthBenefit: 'Maintains lower limb circulation without high energy cost.',
    description: 'While lying or sitting with legs straight, point your toes away from you, then pull them back toward your shins. Repeat 10 times.',
    safetyNote: 'APA (Australian Physiotherapy Assoc): Essential for maintaining circulation and preventing blood clots during periods of high sedentary behaviour.',
    imageUrl: fitForCancer02Image,
    citation: '(APA)'
  },
  {
    id: '9',
    title: 'Seated Shoulder Shrugs',
    intensity: 'Red',
    duration: '2-3 mins',
    benefit: 'Tension Release',
    mentalWellbeingBenefit: 'Releases physical manifestations of stress in the neck.',
    strengthBenefit: 'Reduces "auxiliary" muscle tension in the neck and shoulders.',
    description: 'Sit supported. Gently lift your shoulders toward your ears on an inhale, and let them drop completely on an exhale.',
    safetyNote: 'ESSA: Reduces "auxiliary" muscle tension in the neck/shoulders, which can worsen the perception of fatigue.',
    imageUrl: fitForCancer03Image,
    citation: '(ESSA)'
  },
  {
    id: '10',
    title: 'Gentle Bed Rotations',
    intensity: 'Red',
    duration: '3-5 mins',
    benefit: 'Spinal Mobility',
    mentalWellbeingBenefit: 'Prevents the feeling of being "stuck" or stiff from bed rest.',
    strengthBenefit: 'Maintains gentle spinal rotation and hip mobility.',
    description: 'Lying on your back with knees bent, slowly let your knees fall to one side, then the other. Only move within a pain-free range.',
    safetyNote: 'COSA Guidelines: Gentle mobility helps prevent the joint stiffness and back pain that occurs with prolonged resting. CONTRAINDICATION: Avoid if experiencing bone pain.',
    imageUrl: fitForCancer04Image,
    citation: '(COSA 2020)'
  },
  {
    id: '11',
    title: 'Pelvic Tilts (Supine)',
    intensity: 'Red',
    duration: '3-5 mins',
    benefit: 'Core Engagement',
    mentalWellbeingBenefit: 'Builds connection with the body\'s centre.',
    strengthBenefit: 'A safe way to maintain core awareness without requiring standing balance.',
    description: 'Lying down, gently flatten the small of your back against the bed by tilting your pelvis, then relax.',
    safetyNote: 'Oncology Physiotherapy: A safe way to maintain core awareness without requiring any standing balance.',
    imageUrl: pelvicTiltImage,
    citation: '(APA)'
  },
  {
    id: '12',
    title: 'Wall Squat Holds',
    intensity: 'Green',
    duration: '10-20 secs',
    benefit: 'Isometric Strength',
    mentalWellbeingBenefit: 'Builds focus and physical resilience.',
    strengthBenefit: 'Builds quad strength with less joint impact than traditional squats, protecting bone health.',
    description: 'Lean your back against a wall and slide down into a partial squat. Hold for 10-20 seconds, then slide back up.',
    safetyNote: 'ESSA: Protects bone health by using isometric tension. Ensure your feet are far enough from the wall to keep knees behind toes.',
    imageUrl: fitForCancer12Image,
    citation: '(ESSA)'
  },
  {
    id: '13',
    title: 'Lateral Side Steps',
    intensity: 'Green',
    duration: '5-10 mins',
    benefit: 'Balance & Hip Stability',
    mentalWellbeingBenefit: 'Improves spatial awareness and coordination.',
    strengthBenefit: 'Improves lateral stability to reduce fall risks, which is vital during myeloma treatment.',
    description: 'Place a resistance band around your ankles (optional). Take 10 steps to the right, then 10 steps to the left.',
    safetyNote: 'Oncology Physiotherapy: Vital for reducing fall risks. Keep a slight bend in your knees and maintain an upright posture.',
    imageUrl: fitForCancer13Image,
    citation: '(APA)'
  },
  {
    id: '14',
    title: 'Standing Row (Resistance Band)',
    intensity: 'Green',
    duration: '5-10 mins',
    benefit: 'Postural Strength',
    mentalWellbeingBenefit: 'Opens the chest and improves breathing confidence.',
    strengthBenefit: 'Counteracts the "slumped" posture often caused by fatigue and improves respiratory capacity.',
    description: 'Anchor a band to a door handle. Pull the band toward your hips, squeezing your shoulder blades together.',
    safetyNote: 'COSA: Improves respiratory capacity. ⚠️ If you have had chest or breast surgery, please ensure you have clearance before performing movements that involve significant shoulder retraction or elevation.',
    imageUrl: fitForCancer15Image,
    citation: '(COSA 2020)'
  },
  {
    id: '15',
    title: 'Bird-Dog (Quadruped)',
    intensity: 'Green',
    duration: '5-10 mins',
    benefit: 'Core & Back Stability',
    mentalWellbeingBenefit: 'Enhances mind-body connection and balance.',
    strengthBenefit: 'Enhances core stability and protects the spine, which is a priority in myeloma care.',
    description: 'On hands and knees, extend the opposite arm and leg simultaneously. Maintain a flat back.',
    safetyNote: 'Cancer Council AU: Protects the spine. Keep your neck neutral (look at the floor) and do not arch your back.',
    imageUrl: fitForCancer14Image,
    citation: '(Cancer Council AU)'
  },
  {
    id: '16',
    title: 'Heel Raises (Supported)',
    intensity: 'Yellow',
    duration: '5 mins',
    benefit: 'Calf Pump / DVT Prevention',
    mentalWellbeingBenefit: 'Provides a sense of steady progress and stability.',
    strengthBenefit: 'Stimulates the "second heart" (calf muscles) to improve venous return and reduce leg heaviness.',
    description: 'Stand behind a sturdy chair for balance. Slowly rise onto your toes, hold for 1 second, and lower back down.',
    safetyNote: 'ESSA: Improves venous return. Do not rush; focus on a controlled descent.',
    imageUrl: fitForCancer05Image,
    citation: '(ESSA)'
  },
  {
    id: '17',
    title: 'Seated Torso Twists',
    intensity: 'Yellow',
    duration: '3-5 mins',
    benefit: 'Spinal Mobility',
    mentalWellbeingBenefit: 'Relieves stiffness and improves upper body freedom.',
    strengthBenefit: 'Gentle rotation helps alleviate the "stiff-man" feeling common during steroid rebound cycles.',
    description: 'Sit upright, feet flat. Cross your arms over your chest and slowly rotate your upper body to the right, then left.',
    safetyNote: 'APA: Helps with steroid rebound stiffness. Move slowly and only within a comfortable range. ⚠️ Avoid if you have known spinal metastases or localized back pain.',
    imageUrl: fitForCancer06Image,
    citation: '(APA)'
  },
  {
    id: '18',
    title: 'Modified Step-Ups',
    intensity: 'Yellow',
    duration: '5 mins',
    benefit: 'Functional Strength',
    mentalWellbeingBenefit: 'Builds confidence for navigating daily environments.',
    strengthBenefit: 'Maintains the leg strength required for daily tasks like getting into a car or climbing stairs.',
    description: 'Use the bottom step of a staircase. Step up with one foot, then the other, then step back down. Use the railing for safety.',
    safetyNote: 'Cancer Council AU: Maintains functional mobility. Always use a railing or wall for support.',
    imageUrl: fitForCancer07Image,
    citation: '(Cancer Council AU)'
  },
  {
    id: '19',
    title: 'The 10-Minute Walk Rule',
    intensity: 'Yellow',
    duration: '10 mins',
    benefit: 'Cardiovascular Health',
    mentalWellbeingBenefit: 'Provides a manageable goal and fresh perspective.',
    strengthBenefit: 'Encourages movement without "crashing" the user\'s energy battery.',
    description: 'A slow-paced walk around the home. If fatigue increases, stop. If you feel okay, continue for a maximum of 10 minutes.',
    safetyNote: 'COSA Guidelines: Prevents energy crashes. Stop immediately if you feel dizzy or excessively tired.',
    imageUrl: fitForCancer08Image,
    citation: '(COSA 2020)'
  }
];
