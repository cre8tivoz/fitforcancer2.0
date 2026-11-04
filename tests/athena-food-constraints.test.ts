import { afterEach, describe, expect, it, vi } from 'vitest';
import { RECIPES } from '../constants';
import { ATHENA_RECIPE_INGREDIENTS } from '../utils/athenaRecipeIngredients';
import { deriveRecipeConstraints, executeAthenaRecommendationTool, recommendRecipes } from '../utils/athenaRecommendations';
import handler from '../api/gemini';

const history = (content: string) => [{role:'user',content}];
afterEach(()=>{vi.unstubAllGlobals();delete process.env.GEMINI_API_KEY;delete process.env.ATHENA_TRANSPORT;});

describe('recipe restrictions from the current conversation',()=>{
 it('keeps all server ingredient lists identical to the canonical recipes',()=>{
  expect(Object.keys(ATHENA_RECIPE_INGREDIENTS).sort()).toEqual(RECIPES.map(r=>r.id).sort());
  for(const recipe of RECIPES)expect(ATHENA_RECIPE_INGREDIENTS[recipe.id]).toEqual(recipe.ingredients);
 });
 it('retains a severe peanut restriction after a topic change and excludes the shake card',()=>{
  const constraints=deriveRecipeConstraints([...history('I have a severe peanut allergy.'),{role:'model',content:'Noted.'},{role:'user',content:'Recommend one zero-prep recipe.'}]);
  const result=executeAthenaRecommendationTool('recommend_recipe',{preference:'zero_prep',count:3},'🔴 Red',[],constraints);
  expect(result.refs).not.toContainEqual({kind:'recipe',id:'11'});
  expect(result.refs).toContainEqual({kind:'recipe',id:'12'});
  expect(result.response).toHaveProperty('safetyNote',expect.stringContaining('cross-contact'));
 });
 it('does not confuse no energy or a negated allergy with a food restriction',()=>{
  expect(deriveRecipeConstraints(history('I have no energy. Can I have peanut butter?'))).not.toHaveProperty('excludedAllergens');
  expect(deriveRecipeConstraints(history('I have no peanut allergy.'))).not.toHaveProperty('excludedAllergens');
 });
 it.each(['I have coeliac disease.', 'I am celiac.'])('excludes wheat for a declared condition: %s',message=>{
  const constraints=deriveRecipeConstraints(history(`${message} Recommend one easy-to-digest recipe.`));
  expect(constraints.excludedAllergens).toEqual(['wheat']);
  expect(recommendRecipes('🟢 Green','easy_to_digest',1,[],constraints).items.map(i=>i.id)).toEqual(['4']);
 });
 it('does not turn a negated coeliac declaration into a restriction',()=>{
  expect(deriveRecipeConstraints(history('I do not have coeliac disease.'))).not.toHaveProperty('excludedAllergens');
 });
 it('treats a general nut allergy conservatively, including peanuts',()=>{
  const result=recommendRecipes('🔴 Red','zero_prep',3,[],deriveRecipeConstraints(history('I am allergic to nuts.')));
  expect(result.items.map(i=>i.id)).not.toContain('11');
 });
 it('can return a solid snack when food rather than a complete meal is requested',()=>{
  const result=recommendRecipes('🔴 Red','any',1,[],deriveRecipeConstraints(history('I need something to eat, not a drink.')));
  expect(result.items.map(i=>i.id)).toEqual(['12']);
 });
 it('binds an allergy to its ingredient rather than a contrasting permission',()=>{
  const constraints=deriveRecipeConstraints(history('I have a peanut allergy, but milk is fine. Recommend one zero-prep recipe.'));
  expect(constraints.excludedAllergens).toEqual(['peanut']);
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items.map(i=>i.id)).toEqual(['12']);
 });
 it('honours a later shake request while retaining a separate peanut restriction',()=>{
  const constraints=deriveRecipeConstraints([...history('I need a meal.'),{role:'user',content:'I would like a shake, no peanuts.'}]);
  expect(constraints).toMatchObject({mealOnly:false,drinkOnly:true,excludedAllergens:['peanut']});
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items.map(i=>i.id)).toEqual(['14']);
 });
 it('does not interpret a negated shake request as permission to return drinks',()=>{
  expect(deriveRecipeConstraints(history('I need a meal. I do not want a shake.'))).toMatchObject({mealOnly:true,drinkOnly:false});
 });
 it.each(['No eggs or peanuts.', 'Without eggs, milk and peanuts.'])('filters every ingredient in a coordinated exclusion: %s',message=>{
  const constraints=deriveRecipeConstraints(history(message));
  expect(constraints.excludedAllergens).toEqual(expect.arrayContaining(['egg','peanut']));
  const result=recommendRecipes('🔴 Red','zero_prep',3,[],constraints);
  expect(result.items.map(i=>i.id)).not.toContain('11');
  expect(result.items.map(i=>i.id)).not.toContain('15');
 });
 it('does not classify a mug of strained broth as solid food',()=>{
  const result=recommendRecipes('🟡 Yellow','any',1,[],deriveRecipeConstraints(history('I need something to eat, not a drink.')));
  expect(result.items.map(i=>i.id)).toEqual(['8']);
  expect(result.items[0]).toHaveProperty('format','meal');
 });
 it.each(['I need a meal instead of a shake.', 'I need a meal rather than a shake.'])('rejects the drink alternative: %s',message=>{
  const constraints=deriveRecipeConstraints([...history('I need a meal.'),{role:'user',content:message}]);
  expect(constraints).toMatchObject({mealOnly:true,drinkOnly:false});
  expect(recommendRecipes('🟡 Yellow','any',1,[],constraints).items.map(i=>i.id)).toEqual(['8']);
 });
 it('allows a shake when it is requested instead of a meal',()=>{
  expect(deriveRecipeConstraints(history('I need a shake instead of a meal.'))).toMatchObject({mealOnly:false,drinkOnly:true});
 });
 it.each(['I need meals, not drinks.', 'Recommend lunches instead of shakes.'])('retains plural meal requests: %s',message=>{
  const constraints=deriveRecipeConstraints(history(message));
  expect(constraints).toMatchObject({mealOnly:true,drinkOnly:false});
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items).toEqual([]);
 });
 it.each(['I only want snacks.', 'I just need snacks.'])('allows a later plural snack request: %s',message=>{
  const constraints=deriveRecipeConstraints([...history('I need meals.'),{role:'user',content:message}]);
  expect(constraints).toMatchObject({mealOnly:false,solidOnly:true,drinkOnly:false});
 });
 it('honours plural drink requests and rejected meals',()=>{
  const constraints=deriveRecipeConstraints(history('I need shakes instead of meals.'));
  expect(constraints).toMatchObject({mealOnly:false,drinkOnly:true});
 });
 it.each(['I need a shake, but I want a meal instead.', 'I want a shake. I need a meal instead.'])('applies corrections in clause order: %s',message=>{
  const constraints=deriveRecipeConstraints(history(message));
  expect(constraints).toMatchObject({mealOnly:true,drinkOnly:false});
  expect(recommendRecipes('🟡 Yellow','any',1,[],constraints).items.map(i=>i.id)).toEqual(['8']);
 });
 it.each(['not shakes', 'not a shake', 'no smoothies', 'I do not want a shake', "I don't want shakes", 'I do not need drinks'])('filters standalone exclusions: %s',exclusion=>{
  const constraints=deriveRecipeConstraints(history(`Recommend one zero-prep recipe, ${exclusion}.`));
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items.map(i=>i.id)).toEqual(['12']);
 });
 it('allows a later explicit shake request to replace a prior format exclusion',()=>{
  const constraints=deriveRecipeConstraints([...history('No shakes.'),{role:'user',content:'I want a shake instead.'}]);
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items.map(i=>i.id)).toEqual(['11']);
 });
 it.each(['I do not want milk.', "I don't want milk.", "I don't want milk and eggs."])('filters rejected ingredients: %s',message=>{
  const constraints=deriveRecipeConstraints(history(`${message} Recommend one zero-prep recipe.`));
  expect(constraints.excludedAllergens).toContain('milk');
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items.map(i=>i.id)).toEqual(['10']);
 });
 it('does not substitute a yellow-band meal for an exclusive snack request',()=>{
  const constraints=deriveRecipeConstraints(history('I only want snacks. Recommend one recipe.'));
  expect(constraints.snackOnly).toBe(true);
  expect(recommendRecipes('🟡 Yellow','any',1,[],constraints).items).toEqual([]);
 });
 it('clears snack-only when a later meal is requested',()=>{
  const constraints=deriveRecipeConstraints([...history('I only want snacks.'),{role:'user',content:'I need a meal instead.'}]);
  expect(constraints).toMatchObject({mealOnly:true,snackOnly:false});
  expect(recommendRecipes('🟡 Yellow','any',1,[],constraints).items.map(i=>i.id)).toEqual(['8']);
 });
 it('does not require a meal when the user explicitly wants a snack instead',()=>{
  const constraints=deriveRecipeConstraints(history('I do not want a meal, just a snack. Recommend one zero-prep recipe.'));
  expect(constraints).toMatchObject({mealOnly:false,solidOnly:true,drinkOnly:false});
  expect(recommendRecipes('🔴 Red','zero_prep',1,[],constraints).items.map(i=>i.id)).toEqual(['12']);
 });
 it('allows a later request for just a snack to replace the prior meal restriction',()=>{
  const constraints=deriveRecipeConstraints([...history('I need a meal.'),{role:'user',content:'Just a snack instead, please.'}]);
  expect(constraints).toMatchObject({mealOnly:false,solidOnly:true});
 });
 it('does not turn a past meal mention into a new meal-only request',()=>{
  expect(deriveRecipeConstraints(history('I had lunch earlier. Recommend one zero-prep recipe.'))).not.toHaveProperty('mealOnly');
 });
 it('does not use model claims to invent or erase user restrictions',()=>{
  expect(deriveRecipeConstraints([{role:'model',content:'You are vegan and allergic to milk.'}])).toEqual({});
  expect(deriveRecipeConstraints([...history('I am vegan.'),{role:'model',content:'You are not vegan anymore.'}])).toMatchObject({vegan:true});
 });
 it('filters dairy and eggs from a vegan recipe request',()=>{
  const result=recommendRecipes('🔴 Red','zero_prep',3,[],deriveRecipeConstraints(history('I am vegan. No dairy, eggs or meat.')));
  expect(result.items.map(i=>i.id)).toEqual(['10']);
  expect(result.preferenceMatched).toBe(false);
 });
 it('does not return a dairy-filled shake or yoghurt for a milk allergy',()=>{
  const result=recommendRecipes('🔴 Red','zero_prep',3,[],deriveRecipeConstraints(history('I have a milk allergy.')));
  expect(result.items.map(i=>i.id)).toEqual(['10']);
 });
 it('does not substitute drinks or snacks when no actual meal matches the fatigue band',()=>{
  const result=executeAthenaRecommendationTool('recommend_recipe',{count:1},'🔴 Red',[],deriveRecipeConstraints(history('I need an actual meal, not a drink or shake.')));
  expect(result.response).toMatchObject({status:'no_suitable_results',items:[]});
  expect(result.refs).toEqual([]);
 });
 it('preserves the meal correction on a later request for another option',()=>{
  expect(deriveRecipeConstraints([...history('I need a meal, not a drink.'),{role:'user',content:'Another option please.'}])).toMatchObject({mealOnly:true});
 });
 it('allows an explicit later request for a drink',()=>{
  expect(deriveRecipeConstraints([...history('I need a meal.'),{role:'user',content:'I would like a shake instead.'}])).toMatchObject({mealOnly:false});
 });
 it('finds protein-containing red-band foods instead of defaulting to a cooler',()=>{
  const result=recommendRecipes('🔴 Red','high_protein',1,[],deriveRecipeConstraints(history('I have a peanut allergy.')));
  expect(result.items.map(i=>i.id)).toEqual(['12']);
  expect(result.preferenceMatched).toBe(true);
 });
 it('retains fatigue and prior-option exclusions while filtering food restrictions',()=>{
  const result=executeAthenaRecommendationTool('recommend_recipe',{preference:'high_protein',count:3,avoid_previous:true},'🔴 Red',[{kind:'recipe',id:'12'}],deriveRecipeConstraints(history('I have a severe peanut allergy.')));
  expect(result.refs).toEqual([{kind:'recipe',id:'14'}]);
 });
});

describe.each(['legacy','sdk'])('food restrictions through %s transport',transport=>{
 it.each([false,true])('filters the actual tool response and returned card IDs (stream=%s)',async streaming=>{
  process.env.GEMINI_API_KEY='synthetic-test-key';process.env.ATHENA_TRANSPORT=transport;
  const bodies:any[]=[];
  vi.stubGlobal('fetch',vi.fn(async(_url:any,init:any)=>{
   const body=JSON.parse(init.body);bodies.push(body);
   const parts=bodies.length===1?[{thoughtSignature:'synthetic-signature',functionCall:{id:'food-1',name:'recommend_recipe',args:{preference:'zero_prep',count:1}}}]:[{text:'Here is a food option. Check ingredient labels for your allergy.'}];
   const payload={candidates:[{content:{role:'model',parts},finishReason:'STOP'}]};
   return new Response(streaming?`data: ${JSON.stringify(payload)}\n\n`:JSON.stringify(payload),{headers:{'Content-Type':streaming?'text/event-stream':'application/json'}});
  }));
  let status=0;let body:any;const chunks:string[]=[];
  await handler({method:'POST',headers:{'x-forwarded-for':`food-${transport}-${streaming}`,...(streaming?{accept:'text/event-stream'}:{})},body:{history:[...history('I have a severe peanut allergy.'),{role:'model',content:'Noted.'},{role:'user',content:'Recommend one zero-prep recipe.'}],context:{fatigueScore:8}}} as any,{status(code:number){status=code;return{json(value:any){body=value}}},setHeader(){},flushHeaders(){},end(){},write(chunk:string){chunks.push(chunk)}} as any);
  expect(bodies).toHaveLength(2);
  const response=bodies[1].contents.at(-1).parts[0].functionResponse.response;
  expect((response.content || response).items[0].id).toBe('12');
  const output=streaming?chunks.join(''):JSON.stringify(body);
  expect(output).toContain('"id":"12"');expect(output).not.toContain('"id":"11"');
  if(streaming)expect(output).toContain('event: done');else expect(status).toBe(200);
 });
});
