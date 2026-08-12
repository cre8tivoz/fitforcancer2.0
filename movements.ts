import { Movement } from './types';

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
import pelvicTiltImage from './media/exercises/pelvic-tilt.jpg';
import seatedLegRaiseImage from './media/exercises/seated leg raise.jpg';
import wallPushUpsImage from './media/exercises/wall push ups.jpg';
import wallSlidesImage from './media/exercises/wall slides.jpg';

const CANCER_COUNCIL_EXERCISE_URL = 'https://connect.cancer.org.au/cancer-information/living-and-coping/exercise-for-people-with-cancer';
const CANCER_COUNCIL_STRENGTH_URL = 'https://www.cancervic.org.au/get-support/guides/managing-daily-life/exercise/strength-training-exercises';
const CANCER_COUNCIL_BALANCE_URL = 'https://www.cancervic.org.au/get-support/guides/managing-daily-life/exercise/aerobic-exercise';
const CANCER_COUNCIL_FLEXIBILITY_URL = 'https://www.cancervic.org.au/get-support/guides/managing-daily-life/exercise/flexibility-exercises';
const BONE_METASTASES_CONSENSUS_URL = 'https://pubmed.ncbi.nlm.nih.gov/34990293/';

export const MOVEMENTS: Movement[] = [
  {
    id: '1',
    title: 'Brisk Walking',
    intensity: 'Green',
    duration: '15–30 mins',
    benefit: 'Aerobic fitness',
    mentalWellbeingBenefit: 'A change of scene and rhythmic movement can support mood and wellbeing.',
    strengthBenefit: 'Builds walking endurance and helps maintain everyday physical function.',
    description: 'Walk at a steady pace that feels purposeful but manageable. A simple guide is the talk test: you should still be able to speak, although conversation may be a little slower.',
    safetyNote: 'Start with less time if needed. Stop and seek advice if you develop chest pain, faintness, unusual shortness of breath or another symptom that feels concerning. Choose a cooler indoor option in extreme weather.',
    imageUrl: briskWalkingImage,
    citation: 'Cancer Council Australia — Exercise for People with Cancer',
    sourceUrl: CANCER_COUNCIL_EXERCISE_URL
  },
  {
    id: '2',
    title: 'Seated Leg Extensions',
    intensity: 'Green',
    duration: '5–10 mins',
    benefit: 'Thigh strength',
    mentalWellbeingBenefit: 'A simple, repeatable movement can provide a manageable sense of progress.',
    strengthBenefit: 'Works the front-of-thigh muscles used for standing, stairs and everyday mobility.',
    description: 'Sit tall in a sturdy chair. Slowly straighten one knee until the leg is comfortably extended, pause briefly, then lower with control. Alternate sides.',
    safetyNote: 'Use a stable chair and keep the movement comfortable. Stop if you develop sharp or new pain, and avoid adding ankle weights unless they are appropriate for you.',
    imageUrl: seatedLegRaiseImage,
    citation: 'Cancer Council Australia — Exercise for People with Cancer',
    sourceUrl: CANCER_COUNCIL_EXERCISE_URL
  },
  {
    id: '3',
    title: 'Wall Squat Holds',
    intensity: 'Green',
    duration: '10–30 secs',
    benefit: 'Lower-body strength',
    mentalWellbeingBenefit: 'Short holds can make strength work feel achievable and easy to pace.',
    strengthBenefit: 'Works the thighs and buttocks using body weight against the wall.',
    description: 'Stand about 30–40 cm from a wall, lean your back against it and slide down only until your legs are working comfortably. Hold briefly, then slide back up.',
    safetyNote: 'Use a shallow position at first and stop if it causes knee, hip or back pain. If you have known bone metastases or myeloma bone disease, exercise choice and loading should be tailored to the location and stability of affected bones.',
    imageUrl: fitForCancer12Image,
    citation: 'Cancer Council strength guidance; bone-metastases safety follows international exercise-oncology consensus.',
    sourceUrl: BONE_METASTASES_CONSENSUS_URL
  },
  {
    id: '4',
    title: 'Lateral Side Steps',
    intensity: 'Green',
    duration: '5–10 mins',
    benefit: 'Hip strength & control',
    mentalWellbeingBenefit: 'Adds variety and coordination to a simple strength session.',
    strengthBenefit: 'Works the hip muscles that contribute to side-to-side stability.',
    description: 'Stand tall near a bench or wall. Take several controlled steps to one side, then return. A resistance band is optional and should only be added if the unresisted version feels steady.',
    safetyNote: 'Keep support within reach. If peripheral neuropathy, dizziness or balance problems make you unsteady, use the supported balance option instead or ask an exercise professional for an individual plan.',
    imageUrl: fitForCancer13Image,
    citation: 'Cancer Council Australia — Exercise for People with Cancer',
    sourceUrl: CANCER_COUNCIL_BALANCE_URL
  },
  {
    id: '5',
    title: 'Standing Row (Resistance Band)',
    intensity: 'Green',
    duration: '5–10 mins',
    benefit: 'Upper-back strength',
    mentalWellbeingBenefit: 'A controlled pulling movement can break up long periods of sitting and screen time.',
    strengthBenefit: 'Works the shoulders, upper back and back of the arms.',
    description: 'Secure a resistance band to a fixed point at about waist height. Pull the band towards you with elbows close to your sides, then return slowly.',
    safetyNote: 'Make sure the band and anchor are secure. Keep the movement pain-free. After chest, breast or shoulder surgery, use the range and resistance recommended by your treating physiotherapist or exercise professional.',
    imageUrl: fitForCancer15Image,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '6',
    title: 'Bird-Dog (Quadruped)',
    intensity: 'Green',
    duration: '5–10 mins',
    benefit: 'Core control',
    mentalWellbeingBenefit: 'The slow coordination challenge can encourage focus on the movement rather than the day around it.',
    strengthBenefit: 'Challenges trunk control and balance while moving opposite limbs.',
    description: 'Start on hands and knees with your back comfortable and steady. Extend one leg; if that feels stable, add the opposite arm. Pause briefly, return and change sides.',
    safetyNote: 'Skip this if kneeling is uncomfortable or if you have new back pain. Known spinal or pelvic bone disease needs individual exercise advice rather than a generic core progression.',
    imageUrl: fitForCancer14Image,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '7',
    title: 'Gentle Wall Push-ups',
    intensity: 'Yellow',
    duration: '5–10 mins',
    benefit: 'Upper-body strength',
    mentalWellbeingBenefit: 'A small set can offer a concrete, achievable bit of movement on a middling-energy day.',
    strengthBenefit: 'Works the chest, shoulders and arms with less load than a floor push-up.',
    description: 'Stand facing a wall with hands at shoulder height. Bend your elbows to bring your body gently towards the wall, then push away with control.',
    safetyNote: 'Keep the range comfortable. After chest, breast or shoulder surgery, follow the range and loading advice from your surgeon, physiotherapist or exercise professional rather than forcing the movement.',
    imageUrl: wallPushUpsImage,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '8',
    title: 'Bicep Curls (Household Weights)',
    intensity: 'Yellow',
    duration: '5–10 mins',
    benefit: 'Arm strength',
    mentalWellbeingBenefit: 'Using familiar household objects can make a strength session feel less like a formal workout.',
    strengthBenefit: 'Works the front of the upper arms and supports lifting and carrying tasks.',
    description: 'Hold two light, similar-weight household items with palms facing forward. Keep elbows close to your sides, curl towards your shoulders, then lower slowly.',
    safetyNote: 'Start lighter than you think you need and increase gradually. Avoid loading an area affected by unstable bone disease, acute injury or pain until you have individual advice.',
    imageUrl: bicepCurlsImage,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '9',
    title: 'Sit-to-Stand (Chair Rise)',
    intensity: 'Yellow',
    duration: '5–10 mins',
    benefit: 'Everyday leg strength',
    mentalWellbeingBenefit: 'Practising an everyday task can build confidence in day-to-day mobility.',
    strengthBenefit: 'Works the thighs and buttocks used for getting out of chairs and moving around the home.',
    description: 'Sit towards the front of a sturdy chair. Stand up in one controlled movement, using your hands on your knees or chair arms if needed, then sit down slowly.',
    safetyNote: 'Make sure the chair cannot slide. If you feel off balance, have a wall, bench or another person nearby and use your arms for assistance.',
    imageUrl: chairSquatsImage,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '10',
    title: 'Wall Slides (Shoulder Mobility)',
    intensity: 'Yellow',
    duration: '3–5 mins',
    benefit: 'Shoulder mobility',
    mentalWellbeingBenefit: 'Gentle range-of-motion work can be a quiet way to break up stiffness.',
    strengthBenefit: 'Moves the shoulders and shoulder blades through a controlled range.',
    description: 'Stand with your back against a wall and elbows bent. Slowly slide your arms upward only as far as feels comfortable, then return.',
    safetyNote: 'Do not push through pain or a pulling sensation around a healing surgical area. After chest, breast or shoulder surgery, use the range advised by your physiotherapist or treating team.',
    imageUrl: wallSlidesImage,
    citation: 'Cancer Council Australia — flexibility and range-of-motion guidance',
    sourceUrl: CANCER_COUNCIL_FLEXIBILITY_URL
  },
  {
    id: '11',
    title: 'Supported Heel Raises',
    intensity: 'Yellow',
    duration: '3–5 mins',
    benefit: 'Calf strength',
    mentalWellbeingBenefit: 'A short standing set can provide a sense of steady progress without needing much space.',
    strengthBenefit: 'Works the calf muscles used in walking and standing balance.',
    description: 'Stand behind a sturdy chair or at a bench. Rise onto your toes, pause briefly, then lower slowly.',
    safetyNote: 'Keep support within reach. Cancer Council advises avoiding this exercise if balance problems, dizziness or light-headedness make standing unsafe.',
    imageUrl: fitForCancer05Image,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '12',
    title: 'Seated Torso Turn',
    intensity: 'Yellow',
    duration: '2–4 mins',
    benefit: 'Gentle trunk mobility',
    mentalWellbeingBenefit: 'Slow comfortable movement can help a stiff day feel less static.',
    strengthBenefit: 'Moves the upper trunk through a comfortable rotational range.',
    description: 'Sit tall with feet supported. Cross your arms loosely over your chest and turn your upper body a small amount to one side, return to centre, then change sides.',
    safetyNote: 'Keep this small and pain-free. Do not use generic spinal rotation if you have new/localised back pain or known spinal bone disease unless an exercise professional has advised that it is appropriate for you.',
    imageUrl: fitForCancer06Image,
    citation: 'General Cancer Council flexibility guidance; spinal bone disease requires individual exercise advice.',
    sourceUrl: BONE_METASTASES_CONSENSUS_URL
  },
  {
    id: '13',
    title: 'Modified Step-Ups',
    intensity: 'Yellow',
    duration: '3–5 mins',
    benefit: 'Functional leg strength',
    mentalWellbeingBenefit: 'Practising a familiar daily movement can support confidence with stairs and getting around.',
    strengthBenefit: 'Challenges the legs in a movement similar to stairs and kerbs.',
    description: 'Use a low step with a secure railing. Step up with one foot, bring the other foot up, then step down carefully. Alternate your leading leg.',
    safetyNote: 'Use a railing every time. Choose a different movement if neuropathy, dizziness or weakness makes the step feel uncertain.',
    imageUrl: fitForCancer07Image,
    citation: 'Cancer Council Australia — Exercise for People with Cancer',
    sourceUrl: CANCER_COUNCIL_EXERCISE_URL
  },
  {
    id: '14',
    title: 'Short Easy Walk',
    intensity: 'Yellow',
    duration: '5–10 mins',
    benefit: 'Gentle aerobic activity',
    mentalWellbeingBenefit: 'A short walk can provide a change of scene without turning the day into a workout.',
    strengthBenefit: 'Keeps everyday walking activity in the day at a pace that can be adjusted moment to moment.',
    description: 'Walk slowly around the house, hallway or outside for a few minutes. Turn back whenever you want; five minutes counts, and there is no requirement to reach ten.',
    safetyNote: 'Start small and stop if you become more fatigued than feels manageable, dizzy, faint or unusually short of breath. The aim is movement that fits today, not pushing through.',
    imageUrl: fitForCancer08Image,
    citation: 'Cancer Council recommends starting with small amounts and increasing gradually as able.',
    sourceUrl: CANCER_COUNCIL_BALANCE_URL
  },
  {
    id: '15',
    title: 'Supported Balance Practice',
    intensity: 'Yellow',
    duration: '2–5 mins',
    benefit: 'Balance & stability',
    mentalWellbeingBenefit: 'Short supported practice can build confidence in steadiness without needing a full workout.',
    strengthBenefit: 'Challenges balance and postural control used during standing and walking.',
    description: 'Stand beside a sturdy chair or bench with feet close together. Keep one or both hands on support as needed. If steady, shift your weight gently side to side or place one foot slightly ahead of the other.',
    safetyNote: 'Do this with support within easy reach. If peripheral neuropathy, significant weakness or balance problems are present, have someone nearby or ask a physiotherapist/exercise physiologist for an individual balance program.',
    citation: 'Cancer Council specifically recommends balance work for people with peripheral neuropathy or reduced stability.',
    sourceUrl: CANCER_COUNCIL_BALANCE_URL
  },
  {
    id: '16',
    title: 'Diaphragmatic Breathing',
    intensity: 'Red',
    duration: '2–5 mins',
    benefit: 'Slow breathing & relaxation',
    mentalWellbeingBenefit: 'Slow breathing can provide a simple focus when the day feels physically or mentally overloaded.',
    strengthBenefit: 'Encourages relaxed breathing while resting in a supported position.',
    description: 'Sit supported or lie comfortably. Place a hand on your abdomen and take slow, easy breaths, letting the belly move naturally rather than forcing a deep breath.',
    safetyNote: 'This is a relaxation movement, not treatment for unexplained breathlessness. New, severe or worsening shortness of breath needs medical assessment rather than breathing exercises alone.',
    imageUrl: mindfulBreathingStretchImage,
    citation: 'Cancer Council Australia — Exercise for People with Cancer',
    sourceUrl: CANCER_COUNCIL_EXERCISE_URL
  },
  {
    id: '17',
    title: 'Ankle Flex & Point',
    intensity: 'Red',
    duration: '1–3 mins',
    benefit: 'Ankle mobility',
    mentalWellbeingBenefit: 'A tiny bit of movement can feel achievable when getting up is not appealing.',
    strengthBenefit: 'Moves the ankle through a comfortable range while sitting or lying down.',
    description: 'While sitting or lying comfortably, point your toes away and then draw them gently back towards you. Repeat slowly on both sides.',
    safetyNote: 'This is not a substitute for blood-clot prevention or treatment. New one-sided calf swelling, warmth, redness or pain needs prompt medical advice rather than extra ankle exercises.',
    imageUrl: fitForCancer02Image,
    citation: 'Cancer Council encourages gentle activity as ability allows; this card makes no DVT-prevention claim.',
    sourceUrl: CANCER_COUNCIL_EXERCISE_URL
  },
  {
    id: '18',
    title: 'Seated Shoulder Shrugs',
    intensity: 'Red',
    duration: '1–3 mins',
    benefit: 'Shoulder mobility',
    mentalWellbeingBenefit: 'A slow shoulder release can provide a brief reset during a tense or tiring day.',
    strengthBenefit: 'Moves the shoulders gently without requiring standing or equipment.',
    description: 'Sit supported. Slowly lift your shoulders towards your ears, pause briefly, then let them relax down. Keep breathing normally.',
    safetyNote: 'Keep the movement small and comfortable. Do not push through new shoulder, neck or surgical-area pain.',
    imageUrl: fitForCancer03Image,
    citation: 'Cancer Council Australia — flexibility and range-of-motion guidance',
    sourceUrl: CANCER_COUNCIL_FLEXIBILITY_URL
  },
  {
    id: '19',
    title: 'Gentle Bed Rotations',
    intensity: 'Red',
    duration: '2–4 mins',
    benefit: 'Gentle trunk mobility',
    mentalWellbeingBenefit: 'Small comfortable movement can make prolonged resting feel less physically static.',
    strengthBenefit: 'Moves the hips and lower trunk through a small comfortable range.',
    description: 'Lie on your back with knees bent and feet supported. Let both knees move a small amount to one side, return to centre, then change sides.',
    safetyNote: 'Skip this with new/localised back or bone pain. If you have myeloma bone disease, bone metastases or known spinal involvement, spinal movements should be chosen around the location and stability of affected bones.',
    imageUrl: fitForCancer04Image,
    citation: 'Bone-metastases exercise consensus supports individualised movement based on lesion location and skeletal risk.',
    sourceUrl: BONE_METASTASES_CONSENSUS_URL
  },
  {
    id: '20',
    title: 'Pelvic Tilts (Supine)',
    intensity: 'Red',
    duration: '2–4 mins',
    benefit: 'Gentle core control',
    mentalWellbeingBenefit: 'A small controlled movement can reconnect attention with the body without needing to get up.',
    strengthBenefit: 'Gently engages abdominal and buttock muscles while lying down.',
    description: 'Lie on your back with knees bent and feet supported. Gently tighten your abdomen and buttocks to flatten your lower back slightly, then relax.',
    safetyNote: 'Keep the movement pain-free and easy. New or localised back pain, especially with known bone disease, should be assessed rather than worked through.',
    imageUrl: pelvicTiltImage,
    citation: 'Cancer Council Victoria — Strength and resistance training',
    sourceUrl: CANCER_COUNCIL_STRENGTH_URL
  },
  {
    id: '21',
    title: 'Seated Hamstring Stretch',
    intensity: 'Red',
    duration: '2–4 mins',
    benefit: 'Gentle leg flexibility',
    mentalWellbeingBenefit: 'A slow seated stretch gives you something restorative to do without needing much energy.',
    strengthBenefit: 'Maintains comfortable flexibility through the back of the thigh.',
    description: 'Sit near the front of a sturdy chair. Keep one foot flat and extend the other leg with the heel down and toes up. Keeping your back long, lean forward slightly from the hips until you feel a gentle stretch.',
    safetyNote: 'Stretch only to mild tension, never pain, and do not bounce. Stop if you feel dizzy or if the position aggravates back, hip or nerve pain.',
    citation: 'Cancer Council Victoria — Flexibility exercises',
    sourceUrl: CANCER_COUNCIL_FLEXIBILITY_URL
  }
];
