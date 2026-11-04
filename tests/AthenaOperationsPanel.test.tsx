import React from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import Panel from '../components/AthenaOperationsPanel';
afterEach(cleanup);
it('runs each fixed scenario once, retains failures and compares the preceding run',async()=>{
 const run=vi.fn(async(id:string)=>{if(id==='urgent-fever')throw Error('upstream');return {text:`Answer ${id}`,model:'test',review:{status:'human-review',findings:[]}};});
 render(<Panel model="test" operations={null} version="1" runPreview={run}/>);
 fireEvent.click(screen.getByRole('button',{name:'Run seven synthetic checks'}));
 await waitFor(()=>expect(run).toHaveBeenCalledTimes(7));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Run seven synthetic checks'})).not.toBeDisabled());
 expect(screen.getByText('Generation failed. Retry this scenario using the individual preview.')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Run seven synthetic checks'}));
 await waitFor(()=>expect(run).toHaveBeenCalledTimes(14));
 expect(screen.getAllByText('Previous response').length).toBeGreaterThan(0);
});

it('does not schedule more paid requests after unmount',async()=>{
 let finish:(v:any)=>void;const run=vi.fn(()=>new Promise<any>(r=>{finish=r;}));
 const view=render(<Panel model="test" operations={null} version="1" runPreview={run}/>);
 fireEvent.click(screen.getByRole('button',{name:'Run seven synthetic checks'}));
 expect(run).toHaveBeenCalledTimes(1);view.unmount();finish!({text:'done'});
 await new Promise(r=>setTimeout(r,0));expect(run).toHaveBeenCalledTimes(1);
});
