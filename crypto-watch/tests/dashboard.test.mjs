import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMarket,selectCoins} from '../src/market.mjs';
import {normalizeRates,normalizeNames,conversion} from '../src/exchange.mjs';
import {loadFeed} from '../src/data.mjs';
const coin=(id,cap,price,change)=>({id,name:id,symbol:id.slice(0,2),market_cap:cap,current_price:price,price_change_percentage_24h:change});
const rows=normalizeMarket([coin('Alpha',5,2,-1),coin('Beta',null,0,0),coin('Gamma',8,4,9)]);
test('empty and malformed feed cannot silently clear good data',()=>{for(const v of [null,{},[],[{}]])assert.throws(()=>normalizeMarket(v));});
test('missing, negative and zero fields retain their distinct meanings',()=>{assert.equal(rows[1].price,0);assert.equal(rows[1].cap,null);assert.equal(rows[0].change,-1);});
test('name and symbol search are case insensitive, blank restores all, no match is empty',()=>{
  assert.equal(selectCoins(rows,' PHa ')[0].id,'Alpha');assert.equal(selectCoins(rows,'BE')[0].id,'Beta');
  assert.equal(selectCoins(rows,'').length,3);assert.deepEqual(selectCoins(rows,'xyz'),[]);
});
test('all three numeric sorts preserve the input and place missing values last in both directions',()=>{
  for(const [key,asc,desc] of [['cap',['Alpha','Gamma','Beta'],['Gamma','Alpha','Beta']],['price',['Beta','Alpha','Gamma'],['Gamma','Alpha','Beta']],['change',['Alpha','Beta','Gamma'],['Gamma','Beta','Alpha']]]){
    assert.deepEqual(selectCoins(rows,'',key,'asc').map(c=>c.id),asc);assert.deepEqual(selectCoins(rows,'',key,'desc').map(c=>c.id),desc);}
  assert.deepEqual(rows.map(c=>c.id),['Alpha','Beta','Gamma']);
});
test('FX metadata, base, rate date and amount validation',()=>{
  const codes=['EUR','GBP','CAD'], data=codes.map(quote=>({date:'2026-11-24',base:'USD',quote,rate:.8}));assert.equal(normalizeRates(data).USD.rate,1);
  assert.throws(()=>normalizeRates(data.slice(0,1)));assert.throws(()=>normalizeRates(data.map(r=>({...r,base:'EUR'}))));
  assert.equal(normalizeNames([...codes,'USD'].map(iso_code=>({iso_code,name:iso_code}))).GBP,'GBP');
  assert.equal(conversion(10,'2.5',.8),20);assert.equal(conversion(10,'0',.8),0);
  for(const [p,q,r] of [[null,1,1],[10,'',1],[10,-1,1],[10,1,null]])assert.equal(conversion(p,q,r),null);
});
const spec={key:'x',url:'live',snapshot:'snapshot',ttl:60000,normalize:normalizeMarket};
const now=()=>Date.parse('2026-11-25T12:00:00Z');
const data=[coin('Alpha',5,2,-1)];
test('successful requests are cached; a fresh cache needs zero requests',async()=>{
  let cache=null,calls=0;
  const deps={now,get:()=>cache,put:(_,v)=>cache=v,fetchJson:async()=>{calls++;return data;}};
  assert.equal((await loadFeed(spec,deps)).source,'live');assert.equal((await loadFeed(spec,deps)).source,'cache');assert.equal(calls,1);
});
test('an upstream rate limit uses the old timestamp and marks the cache stale',async()=>{
  const saved={capturedAt:'2026-11-24T00:00:00Z',data};
  const result=await loadFeed(spec,{now,get:()=>saved,put:()=>assert.fail(),fetchJson:async()=>{throw Error('Rate limit reached');}});
  assert.equal(result.source,'stale');assert.equal(result.capturedAt,saved.capturedAt);assert.match(result.reason,/Rate limit/);
});
test('first visit during an outage uses a dated snapshot and never calls it live',async()=>{
  const snapshot={capturedAt:'2026-11-23T00:00:00Z',data};
  const result=await loadFeed(spec,{now,get:()=>({bad:true}),put:()=>assert.fail(),fetchJson:async(url)=>{if(url==='live')return {};return snapshot;}});
  assert.equal(result.source,'snapshot');assert.equal(result.capturedAt,snapshot.capturedAt);
});
