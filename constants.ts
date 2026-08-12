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
import energyBlitzGreekYoghurtImage from './media/nutrition/energy_blitz_greek_yoghurt.webp';
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
import theCrashShakeImage from './media/nutrition/the_crash_shake.webp';
import wallPushUpsImage from './media/exercises/wall push ups.jpg';
import wallSlidesImage from './media/exercises/wall slides.jpg';
import zucchiniFetaMuffinsImage from './media/nutrition/zucchini__feta_muffins.jpg';
import fortifiedMilkyDrinkImage from './media/nutrition/fortified_milky_drink.webp';
import custardTinnedPearImage from './media/nutrition/custard_tinned_pear.webp';
import creamedRiceCupImage from './media/nutrition/creamed_rice_cup.webp';
import microwaveBeansCheeseImage from './media/nutrition/microwave_beans_cheese.webp';

const CANCER_COUNCIL_RECIPES_URL = 'https://www.cancervic.org.au/get-support/guides/managing-daily-life/nutrition/recipes-and-snacks';
const CANCER_COUNCIL_SIDE_EFFECTS_URL = 'https://www.cancervic.org.au/get-support/guides/managing-daily-life/nutrition/treatment-side-effects-and-nutrition';
const CANCER_COUNCIL_NUTRITION_URL = 'https://connect.cancer.org.au/cancer-information/living-and-coping/nutrition-for-people-with-cancer';

export const RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Protein-Packed Berry Smoothie',
    category: 'High Protein',
    ingredients: ['1 cup (125g) frozen mixed berries', '150g Greek yoghurt', '250ml full-cream milk', '2 tbsp full-cream milk powder', '1 tsp honey or maple syrup (optional)'],
    instructions: [
      'Place the berries, yoghurt, milk and milk powder into a blender.',
      'Blend until completely smooth.',
      'Taste and add a little honey or maple syrup if wanted.',
      'Serve immediately.'
    ],
    imageUrl: proteinPackedBerrySmoothieImage,
    prepTime: '5 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'A smooth, protein- and energy-containing drink that can be easier to manage than a full meal when appetite is low.',
    safetyNote: 'If berries sting because of mouth sores, swap them for banana or another soft, non-acidic fruit you tolerate.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '2',
    title: 'Ginger & Turmeric Broth',
    category: 'Anti-Nausea',
    ingredients: ['500ml vegetable or chicken stock', '2cm piece fresh ginger, thinly sliced', '1/2 tsp ground turmeric (optional, for flavour)', 'Squeeze of lemon (optional)', 'Pinch of salt'],
    instructions: [
      'Combine the stock, ginger and optional turmeric in a small saucepan.',
      'Bring to a gentle simmer for 10 minutes.',
      'Strain into a mug.',
      'Add lemon only if it is comfortable for your mouth and stomach.'
    ],
    imageUrl: gingerTurmericBrothImage,
    prepTime: '5 mins',
    cookTime: '10 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'A light source of fluid; Cancer Council suggests trying ginger-containing foods or drinks when nausea is a problem.',
    safetyNote: 'This is not an anti-inflammatory treatment. Omit lemon if you have mouth sores or reflux, and use a cooler temperature if hot drinks are uncomfortable.',
    citation: 'Cancer Council Victoria — Treatment Side Effects & Nutrition (Jul 2025)',
    sourceUrl: CANCER_COUNCIL_SIDE_EFFECTS_URL
  },
  {
    id: '3',
    title: 'Zucchini & Feta Muffins',
    category: 'Easy to Digest',
    ingredients: ['2 cups (approx. 300g) grated zucchini, excess water squeezed out', '100g feta cheese, crumbled', '2 large eggs, lightly beaten', '150g self-raising flour', '60ml (1/4 cup) olive oil'],
    instructions: [
      'Preheat your oven to 180°C and grease a 6-hole muffin tin.',
      'Combine the zucchini, feta and eggs.',
      'Fold in the flour and olive oil until just combined.',
      'Divide between the muffin holes.',
      'Bake for 20–25 minutes until cooked through.'
    ],
    imageUrl: zucchiniFetaMuffinsImage,
    prepTime: '15 mins',
    cookTime: '25 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Eggs, feta and oil add protein and energy to a soft savoury snack that can be batch-cooked for later.',
    safetyNote: 'If dry mouth or swallowing difficulty makes muffins hard to manage, moisten with yoghurt or a sauce, or choose a softer recipe.',
    citation: 'Cancer Council Australia — Nutrition for People with Cancer',
    sourceUrl: CANCER_COUNCIL_NUTRITION_URL
  },
  {
    id: '4',
    title: 'Soft Roasted Root Vegetables',
    category: 'Easy to Digest',
    ingredients: ['200g pumpkin, peeled and cubed', '1 medium sweet potato (approx. 250g), peeled and cubed', '2 carrots, peeled and sliced', '40ml (2 tbsp) olive oil', '1 tsp dried rosemary or thyme', 'Pinch of salt'],
    instructions: [
      'Preheat oven to 200°C and line a baking tray.',
      'Toss the vegetables with olive oil, herbs and salt.',
      'Roast for 35–40 minutes, turning halfway, until very soft.',
      'Mash with a fork if a softer texture is easier to eat.'
    ],
    imageUrl: softRoastedRootVegetablesImage,
    prepTime: '10 mins',
    cookTime: '40 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Soft vegetables with added oil provide carbohydrate and extra energy, with the texture easy to modify when chewing is tiring.',
    citation: 'Cancer Council Australia — Nutrition for People with Cancer',
    sourceUrl: CANCER_COUNCIL_NUTRITION_URL
  },
  {
    id: '5',
    title: 'Poached Chicken & Steamed Greens',
    category: 'High Protein',
    ingredients: ['1 chicken breast (approx. 200g)', '500ml low-sodium chicken stock', '1 cup broccoli florets', '1 bunch bok choy, trimmed', '1 lemon wedge (optional)'],
    instructions: [
      'Bring the chicken stock to a gentle simmer.',
      'Poach the chicken for 12–15 minutes, or until fully cooked through.',
      'Steam the broccoli and bok choy until tender.',
      'Slice the chicken and serve with the vegetables.',
      'Add lemon only if comfortable.'
    ],
    imageUrl: poachedChickenAndSteamedGreensImage,
    prepTime: '10 mins',
    cookTime: '15 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'A protein-rich meal that can help meet protein needs and support muscle maintenance during treatment.',
    safetyNote: 'If your immunity is lowered, cook chicken thoroughly and follow the food-safety advice from your treatment team. Omit lemon if acidic foods irritate mouth sores.',
    citation: 'Cancer Council Australia — Nutrition for People with Cancer',
    sourceUrl: CANCER_COUNCIL_NUTRITION_URL
  },
  {
    id: '6',
    title: 'Classic Spaghetti with Butter',
    category: 'Easy to Digest',
    ingredients: ['100g dried spaghetti or fettuccine', '40g unsalted butter, cubed', '60ml (1/4 cup) reserved pasta water', '1 tbsp finely grated mild parmesan (optional)'],
    instructions: [
      'Cook the pasta until soft.',
      'Reserve 1/4 cup of pasta water, then drain.',
      'Return the pasta to the warm pot and add butter and enough reserved water to keep it moist.',
      'Top with parmesan if wanted.'
    ],
    imageUrl: classicSpaghettiWithButterImage,
    prepTime: '5 mins',
    cookTime: '12 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Soft pasta with butter and optional cheese provides energy in a mild meal when appetite is limited.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '7',
    title: 'Low-Flavour Chicken & Rice Soup',
    category: 'Anti-Nausea',
    ingredients: ['2 chicken drumsticks, skin and visible fat removed', '1.5L cold water', '100g (1/2 cup) white long-grain rice', '1 stalk celery, very finely diced', '1 small carrot, very finely diced'],
    instructions: [
      'Place the chicken and water in a large pot. Bring to a boil, then reduce to a gentle simmer.',
      'Cook for 1 hour, skimming excess fat if needed.',
      'Remove the chicken, shred the meat and discard the bones.',
      'Add rice, celery and carrot and simmer until very soft.',
      'Return the chicken and heat through. Serve warm, cool or at room temperature depending on what smells easiest to tolerate.'
    ],
    imageUrl: lowFlavourChickenAndRiceSoupImage,
    prepTime: '10 mins',
    cookTime: '1 hour 20 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'A soft meal providing fluid, carbohydrate and protein; cooler serving temperatures can reduce aroma when smells trigger nausea.',
    safetyNote: 'If your immunity is lowered, cook chicken thoroughly, refrigerate leftovers promptly and follow your treatment team’s food-safety advice.',
    citation: 'Cancer Council Victoria — Treatment Side Effects & Nutrition (Jul 2025)',
    sourceUrl: CANCER_COUNCIL_SIDE_EFFECTS_URL
  },
  {
    id: '8',
    title: 'High-Protein Overnight Oats',
    category: 'High Protein',
    ingredients: ['45g (1/2 cup) rolled oats', '150g Greek yoghurt', '125ml (1/2 cup) full-cream milk', '2 tbsp full-cream milk powder', '40g soft berries or mashed banana', '1 tsp honey (optional)'],
    instructions: [
      'Combine the oats, yoghurt, milk and milk powder in a container.',
      'Fold through the fruit.',
      'Cover and refrigerate for at least 4 hours or overnight.',
      'Add a splash of milk before eating if you prefer a softer texture.'
    ],
    imageUrl: highProteinOvernightOatsImage,
    prepTime: '8 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'A make-ahead soft meal with added dairy protein and energy, useful when mornings are more tiring.',
    safetyNote: 'If diarrhoea is active, individual fibre tolerance can change. If mouth sores are present, use a soft non-acidic fruit such as banana.',
    citation: 'Cancer Council Victoria — Treatment Side Effects & Nutrition (Jul 2025)',
    sourceUrl: CANCER_COUNCIL_SIDE_EFFECTS_URL
  },
  {
    id: '9',
    title: 'Red Lentil & Spinach Dhal',
    category: 'High Protein',
    ingredients: ['200g (1 cup) red lentils, rinsed well', '750ml (3 cups) vegetable stock', '1 tsp ground turmeric', '1 tsp ground cumin', '60g (2 cups) baby spinach', '125g (1/2 cup) Greek yoghurt'],
    instructions: [
      'Place lentils, stock, turmeric and cumin in a saucepan.',
      'Bring to a boil, then simmer for 20–25 minutes until very soft.',
      'Stir in the spinach until wilted.',
      'Serve with Greek yoghurt.'
    ],
    imageUrl: redLentilSpinachDahlImage,
    prepTime: '5 mins',
    cookTime: '25 mins',
    fatigueZone: '🟢 Green',
    nutritionalBenefit: 'Lentils and yoghurt provide plant-based protein in a soft meal; Cancer Council includes lentil dhal among its treatment-time meal ideas.',
    safetyNote: 'If diarrhoea, bowel irritation or excess wind is a problem, legumes may not be comfortable. Choose a lower-fibre option and ask your team if symptoms persist.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '10',
    title: 'Hydrating Watermelon & Mint Cooler',
    category: 'Hydrating',
    ingredients: ['2 cups pre-cut seedless watermelon', '125ml (1/2 cup) chilled water or coconut water', '5–6 mint leaves (optional)', 'Small squeeze of lime only if tolerated'],
    instructions: [
      'Place the watermelon, liquid and optional mint into a blender.',
      'Blend until smooth.',
      'Add lime only if you do not have mouth sores or reflux and acidic drinks feel comfortable.',
      'Sip slowly.'
    ],
    imageUrl: hydratingWatermelonMintCoolerImage,
    prepTime: '3 mins',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'A cold fluid option that can help with hydration when plain water is unappealing or difficult to drink.',
    safetyNote: 'Acidic drinks can sting with mouth sores, so omit lime in that situation. If very cold drinks hurt, let it warm slightly before drinking.',
    citation: 'Cancer Council Victoria — Treatment Side Effects & Nutrition (Jul 2025)',
    sourceUrl: CANCER_COUNCIL_SIDE_EFFECTS_URL
  },
  {
    id: '11',
    title: 'The "Crash" Shake',
    category: 'Zero-Prep',
    ingredients: ['1 cup full-cream milk', '2 tbsp full-cream milk powder', '1 tbsp smooth peanut butter', '1 small banana'],
    instructions: [
      'Blend until smooth.',
      'Sip slowly and refrigerate any unused portion promptly.'
    ],
    imageUrl: theCrashShakeImage,
    prepTime: '2 mins',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'A protein- and energy-dense drink for times when fatigue or low appetite makes a full meal hard to manage.',
    safetyNote: 'If nausea is active, fatty foods such as peanut butter may be harder to tolerate. Leave it out and use a simpler milk-and-banana shake if that sits better.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '12',
    title: 'Energy Blitz Greek Yoghurt',
    category: 'Zero-Prep',
    ingredients: ['1 individual tub full-fat Greek yoghurt', '1 tsp honey (optional)', '1 tbsp chia or hemp seeds (optional)'],
    instructions: [
      'Eat the yoghurt straight from the tub or stir in honey if wanted.',
      'Add seeds only if their texture is comfortable for you.'
    ],
    imageUrl: energyBlitzGreekYoghurtImage,
    prepTime: '1 min',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'A ready-to-eat protein-containing snack requiring almost no preparation, useful when energy for cooking is very low.',
    safetyNote: 'Skip the seeds if you have mouth sores, dry mouth, swallowing difficulty or treatment-related diarrhoea and the texture is uncomfortable.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '13',
    title: 'Sardine "Emergency" Toast',
    category: 'Quick Assembly',
    ingredients: ['1 tin sardines in oil, drained if preferred', '1 slice soft buttered toast or bread (optional)', 'Squeeze of lemon only if tolerated'],
    instructions: [
      'Mash the sardines directly in the tin.',
      'Eat with a fork or on soft buttered toast.',
      'Add lemon only if acidic foods are comfortable.'
    ],
    imageUrl: sardineEmergencyToastImage,
    prepTime: '3 mins',
    cookTime: '0 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'A fast savoury protein option that requires little preparation.',
    safetyNote: 'Strong food smells can worsen nausea. Dry toast can also be difficult with dry mouth or mouth sores; use soft bread, add moisture, or choose another option if needed.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '14',
    title: 'Fortified Milky Drink',
    category: 'Zero-Prep',
    ingredients: ['1 cup full-cream milk', '1–2 tbsp full-cream milk powder', '1 tsp Milo or Horlicks (optional)'],
    instructions: [
      'Whisk the milk powder into warm or cold milk.',
      'Add Milo or Horlicks if wanted and sip slowly.'
    ],
    imageUrl: fortifiedMilkyDrinkImage,
    prepTime: '2 mins',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'An enriched drink that adds protein and energy when fatigue or low appetite makes solid food difficult.',
    safetyNote: 'If you have diabetes, kidney disease, persistent diarrhoea or another condition affecting what you can drink, check the best fortification option with your dietitian or treatment team.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '15',
    title: 'Custard & Pear Cup',
    category: 'Zero-Prep',
    ingredients: ['1 individual tub ready-to-eat custard', '1/2 cup tinned pear in juice, drained and chopped or mashed'],
    instructions: [
      'Spoon the custard into a bowl or eat from the tub.',
      'Top with the soft tinned pear, chopping or mashing it as needed.'
    ],
    imageUrl: custardTinnedPearImage,
    prepTime: '1 min',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'A soft, ready-to-eat snack with no cooking; Cancer Council specifically recommends tinned fruit and milk-based puddings as easy treatment-time options.',
    safetyNote: 'If chewing or swallowing is difficult, mash the pear very well or use smooth pureed fruit. Avoid acidic fruits if mouth sores are active.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '16',
    title: 'Creamed Rice Cup',
    category: 'Zero-Prep',
    ingredients: ['1 individual tub ready-made creamed rice or rice pudding', 'Splash of full-cream milk or cream if a softer texture is wanted', 'Pinch of cinnamon (optional)'],
    instructions: [
      'Eat chilled or warm gently according to preference.',
      'Stir in a little milk or cream if you want it softer or more energy-dense.'
    ],
    imageUrl: creamedRiceCupImage,
    prepTime: '1 min',
    cookTime: '0 mins',
    fatigueZone: '🔴 Red',
    nutritionalBenefit: 'A soft, ready-to-eat milk pudding providing energy and some protein with almost no preparation.',
    safetyNote: 'If treatment-related diarrhoea has made lactose harder to tolerate, use a lactose-free version or another option recommended by your dietitian.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
  },
  {
    id: '17',
    title: 'Microwave Beans & Cheese',
    category: 'Quick Assembly',
    ingredients: ['1/2 can baked beans', '30g grated cheese', '1 slice soft buttered bread or toast (optional)'],
    instructions: [
      'Place the baked beans in a microwave-safe bowl and heat until steaming.',
      'Stir through or top with grated cheese until melted.',
      'Eat on its own or with soft buttered bread.'
    ],
    imageUrl: microwaveBeansCheeseImage,
    prepTime: '2 mins',
    cookTime: '2 mins',
    fatigueZone: '🟡 Yellow',
    nutritionalBenefit: 'A quick warm meal combining beans and cheese for protein and energy with minimal preparation.',
    safetyNote: 'Beans may worsen wind or bowel irritation for some people. If diarrhoea, colitis or significant bloating is active, choose another option and follow your treatment team’s advice.',
    citation: 'Cancer Council Victoria — Recipes & Snacks (Jun 2026)',
    sourceUrl: CANCER_COUNCIL_RECIPES_URL
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