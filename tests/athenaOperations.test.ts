import {describe,it,expect,vi,afterEach} from 'vitest';
import {assessOperationsResult} from '../utils/athenaOperationsChecks';
import {recordAthenaOperation} from '../api/_lib/athenaOperations';
const query=vi.hoisted(()=>vi.fn());
vi.mock('@neondatabase/serverless',()=>({Pool:class {query=query;}}));
afterEach(()=>{vi.unstubAllEnvs();query.mockReset();});
describe('operations review',()=>{
 it('flags an unsafe peanut card without declaring other answers clinically safe',()=>{
 expect(assessOperationsResult('peanut-allergy','An option',[{kind:'recipe',id:'11'}]).status).toBe('needs-attention');
 expect(assessOperationsResult('peanut-allergy','Check labels',[]).status).toBe('human-review');
 });
 it('flags movement cards for urgent symptoms and drinks after a meal correction',()=>{
 expect(assessOperationsResult('urgent-fever','Call your team',[{kind:'movement',id:'16'}]).findings).toHaveLength(1);
 expect(assessOperationsResult('meal-correction','A meal',[{kind:'recipe',id:'2'}]).findings).toHaveLength(1);
 });
 it('flags missing and overlong one-thing replies',()=>{
 expect(assessOperationsResult('one-thing','',[]).status).toBe('needs-attention');
 expect(assessOperationsResult('one-thing','word '.repeat(101),[]).status).toBe('needs-attention');
 });
 it('persists only allowlisted metadata and tolerates storage failure',async()=>{
 vi.stubEnv('DATABASE_URL','postgres://synthetic');query.mockResolvedValue({rows:[]});
 await recordAthenaOperation({model:'gemini-3.6-flash',durationMs:12,text:'private',email:'private',context:{cancer:'private'}},'synthetic');
 const insert=query.mock.calls.find(c=>String(c[0]).startsWith('INSERT'));
 expect(insert[1]).toEqual(['synthetic',JSON.stringify({model:'gemini-3.6-flash',durationMs:12})]);
 query.mockRejectedValue(new Error('offline'));
 await expect(recordAthenaOperation({},'production')).resolves.toBeUndefined();
 });
 it('does not require a database to serve chat',async()=>{
 vi.stubEnv('DATABASE_URL','');await expect(recordAthenaOperation({text:'do not store'},'production')).resolves.toBeUndefined();
 });
});
