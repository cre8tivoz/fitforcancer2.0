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
