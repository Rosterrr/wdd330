import './styles.css';
import {MARKET_URL, normalizeMarket, selectCoins} from './market.mjs';
import {CODES, RATE_URL, META_URL, normalizeRates, normalizeNames, conversion} from './exchange.mjs';
import {loadFeed, read, write, MINUTE} from './data.mjs';

const $ = id => document.getElementById(id);
const make = (tag, value, cls) => {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (cls) node.className = cls;
  return node;
};
const sourceRoot = import.meta.env.BASE_URL + 'data/';
const marketSpec = {key:'market', url:MARKET_URL, snapshot:sourceRoot+'market.json', ttl:MINUTE, normalize:normalizeMarket};
const rateSpec = {key:'rates', url:RATE_URL, snapshot:sourceRoot+'rates.json', ttl:30*MINUTE, normalize:normalizeRates};
const nameSpec = {key:'names', url:META_URL, snapshot:sourceRoot+'currencies.json', ttl:1440*MINUTE, normalize:normalizeNames};
let market, rates, names, coins = [], focused = null, detailOpen = false;
const oldSaved = read('saved');
const saved = new Set(Array.isArray(oldSaved) ? oldSaved.filter(x => typeof x === 'string') : []);
let currency = read('currency');
if (!CODES.includes(currency)) currency = 'USD';
let busy = false, nextTry = 0, timer, returnFocus, lastAmount = null;
let fxFailure = '', marketFailure = '';
const currentRate = () => currency === 'USD' ? 1 : rates?.value[currency]?.rate;
const when = value => value ? new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}) : 'unavailable';
function money(usd, compact = false) {
  if (!Number.isFinite(usd) || !Number.isFinite(currentRate())) return '—';
  const value = usd * currentRate();
  return formatValue(value, compact);
}
function formatValue(value, compact = false) {
  const opts = {style:'currency', currency, currencyDisplay:'narrowSymbol'};
  if (compact) Object.assign(opts,{notation:'compact',maximumFractionDigits:2});
  else if (value > 0 && value < 1) Object.assign(opts,{maximumSignificantDigits:4});
  else Object.assign(opts,{maximumFractionDigits:2,minimumFractionDigits:2});
  return new Intl.NumberFormat('en-US',opts).format(value);
}
const change = v => v === null ? '—' : (v > 0 ? '+' : '') + v.toFixed(2) + '%';
const trend = v => v > 0 ? 'up' : v < 0 ? 'down' : '';
function coinButton(c, surface = 'market') {
  const b = make('button',undefined,'asset'); b.type = 'button'; b.dataset.open = c.id; b.dataset.surface = surface;
  b.setAttribute('aria-label','View ' + c.name + ' details');
  const icon = make('span',c.symbol.slice(0,2),'coin-icon'); icon.setAttribute('aria-hidden','true');
  if (c.image) {
    const img = make('img'); img.alt=''; img.loading='lazy'; img.addEventListener('error',()=>icon.replaceChildren(c.symbol.slice(0,2)),{once:true});
    img.src=c.image; icon.replaceChildren(img);
  }
  const caption=make('span',undefined,'asset-text');
  caption.append(make('span',c.name,'asset-name'),make('span',(c.rank===null?'':'#'+c.rank+' · ')+c.symbol,'symbol'));
  b.append(icon,caption);return b;
}
function star(id,label,surface) {
  const on=saved.has(id);const b=make('button',on?'★':'☆','star');b.type='button';b.dataset.star=id;b.dataset.surface=surface;
  b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',(on?'Remove ':'Save ')+label+(on?' from':' to')+' watchlist');return b;
}
function renderList() {
  const list=selectCoins(coins,$('search').value,$('sort').value,$('order').value);
  const f=document.createDocumentFragment();
  for (const c of list) {
    const tr=make('tr'), first=make('td'), last=make('td');
    first.append(coinButton(c));last.append(star(c.id,c.name,'market'));
    tr.append(first,make('td',money(c.price)),make('td',change(c.change),trend(c.change)),make('td',money(c.cap,true)),last);f.append(tr);
  }
  $('rows').replaceChildren(f);
  $('count').textContent=list.length+(list.length === 1?' coin':' coins');
  $('empty').hidden=list.length>0 || (busy && !coins.length);
  $('empty-text').textContent=coins.length?'No coins match your search.':'No market prices are available.';
  $('clear').hidden=!$('search').value;
}
function renderSaved() {
  const f=document.createDocumentFragment();
  for (const id of saved) {
    const c=coins.find(c=>c.id===id), li=make('li',undefined,'saved-line');
    li.append(c?coinButton(c,'saved'):make('span',id),make('span',c?money(c.price):'Unavailable','quote'),star(id,c?.name??id,'saved'));f.append(li);
  }
  $('saved').replaceChildren(f);$('watch-empty').hidden=saved.size>0;
}
function renderFocus() {
  const c=coins.find(c=>c.id===focused) ?? coins[0];if (!c) {if (!busy) $('focus-title').textContent='Market unavailable';return;}
  focused=c.id;$('focus-title').textContent=c.name+' · '+c.symbol;$('focus-price').textContent=money(c.price)+' '+currency;
  $('focus-change').textContent=c.change===null?'24h change unavailable':change(c.change)+' over 24h';$('focus-change').className=trend(c.change);
  let d='';if(c.spark.length>1){
    const min=Math.min(...c.spark), max=Math.max(...c.spark);
    d=c.spark.map((p,i)=>(i?'L':'M')+(i*398/(c.spark.length-1)+1).toFixed(1)+' '+(max===min?45:85-80*(p-min)/(max-min)).toFixed(1)).join(' ');
  }
  $('spark-line').setAttribute('d',d);$('spark').setAttribute('aria-label',d?c.name+' seven-day price history in US dollars':'Price history unavailable');
  $('focus-note').textContent=d?'First to last observation, priced in USD.':'Seven-day price history unavailable.';
  $('detail').hidden=!detailOpen;if(!detailOpen)return;
  $('detail-title').textContent=c.name+' · '+c.symbol;const f=document.createDocumentFragment();
  for (const [key,val] of [['Market rank',c.rank===null?'—':'#'+c.rank],['Market cap',money(c.cap,true)],['24h volume',money(c.volume,true)],['24h high',money(c.high)],['24h low',money(c.low)],['Price timestamp',when(c.updated)]]) {
    const item=make('div');item.append(make('dt',key),make('dd',val));f.append(item);
  }
  $('detail-stats').replaceChildren(f);
}
const tag = source => ({live:'Live response',cache:'Recent cache',stale:'Stale cache',snapshot:'Published snapshot'})[source];
const aged = f => f?.source==='stale' || f?.source==='snapshot';
function renderStatus() {
  const m=$('market-status'), fx=$('fx-status');
  if(market){
    const dates=coins.map(c=>c.updated).filter(Boolean).sort();
    m.textContent='CoinGecko · '+tag(market.source)+' · Latest quote: '+when(dates.at(-1))+
      (aged(market)?'. '+market.reason+'. Retry with Refresh data.':'.');
  } else if(marketFailure) m.textContent='Market unavailable. '+marketFailure+'. Retry with Refresh data.';
  m.dataset.warning=String(Boolean(marketFailure)||aged(market));
  if(rates){
    const ref=currency==='USD'?'EUR':currency;
    fx.textContent='Frankfurter · '+tag(rates.source)+' · '+ref+' reference rate: '+rates.value[ref].date+
      (aged(rates)?'. '+rates.reason+'.':'.')+
      (names && aged(names)?' Currency labels: '+tag(names.source)+'.':'');
  } else if(fxFailure) fx.textContent='Currency rates unavailable. USD still works. '+fxFailure+'.';
  fx.dataset.warning=String(Boolean(fxFailure)||aged(rates));
}
function renderForm() {
  const selected=$('coin').value;const f=document.createDocumentFragment();
  for(const c of coins){const o=make('option',c.name+' ('+c.symbol+')');o.value=c.id;f.append(o);}
  $('coin').replaceChildren(f);if(coins.some(c=>c.id===selected))$('coin').value=selected;
  const opts=CODES.map(code=>{const o=make('option',code);o.value=code;o.title=names?.value[code]??code;return o;});
  $('currency').replaceChildren(...opts);$('currency').value=currency;$('unit').textContent=currency;
}
function result(){
  if(lastAmount===null)return;
  const c=coins.find(c=>c.id===$('coin').value);
  const val=conversion(c?.price,$('amount').value,currentRate());
  $('converted').textContent=val===null?'A valid amount, coin price, and exchange rate are needed.':
    $('amount').value+' '+c.symbol+' = '+formatValue(val)+' '+currency;
}
function draw(){renderForm();renderList();renderSaved();renderFocus();renderStatus();result();}
function refreshButton(){
  const wait=Math.max(0,Math.ceil((nextTry-Date.now())/1000));
  $('refresh').disabled=busy || wait>0;
  $('refresh-text').textContent=busy?'Refreshing…':wait?'Refresh in '+wait+'s':'Refresh data';
  if(!wait && !busy)clearInterval(timer);
}
async function load(){
  if(busy || Date.now()<nextTry)return;busy=true;nextTry=Date.now()+MINUTE;clearInterval(timer);timer=setInterval(refreshButton,1000);refreshButton();
  $('market').setAttribute('aria-busy','true');
  const [m,r,n]=await Promise.allSettled([loadFeed(marketSpec),loadFeed(rateSpec),loadFeed(nameSpec)]);
  marketFailure='';fxFailure='';
  if(m.status==='fulfilled'){market=m.value;coins=market.value;}else{marketFailure='Market service and fallback unavailable';if(market)market={...market,source:'stale',reason:marketFailure};}
  if(r.status==='fulfilled')rates=r.value;else{fxFailure='FX service and fallback unavailable';if(rates)rates={...rates,source:'stale',reason:fxFailure};}
  if(n.status==='fulfilled')names=n.value;
  busy=false;$('market').setAttribute('aria-busy','false');refreshButton();draw();
}
$('refresh').addEventListener('click',load);
for(const id of ['search','sort','order']) $(id).addEventListener(id==='search'?'input':'change',renderList);
$('clear').addEventListener('click',()=>{$('search').value='';renderList();$('search').focus();});
$('currency').addEventListener('change',e=>{currency=e.target.value;write('currency',currency);draw();});
$('convert-form').addEventListener('submit',e=>{e.preventDefault();lastAmount=$('amount').value;result();});
for(const id of ['coin','amount'])$(id).addEventListener(id==='amount'?'input':'change',()=>{lastAmount=null;$('converted').textContent='Select Convert to update the result.';});
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-star]'),b=e.target.closest('[data-open]');
  if(s){
    const id=s.dataset.star,surface=s.dataset.surface,label=coins.find(c=>c.id===id)?.name??id;
    if(saved.has(id))saved.delete(id);else saved.add(id);
    write('saved',[...saved]);renderList();renderSaved();
    $('watch-status').textContent=label+(saved.has(id)?' saved.':' removed.');
    const back=[...document.querySelectorAll('[data-star]')].find(el=>el.dataset.star===id&&el.dataset.surface===surface);
    (back??$('saved').querySelector('button')??$('search')).focus({preventScroll:true});
  }else if(b){
    focused=b.dataset.open;returnFocus={id:focused,surface:b.dataset.surface};detailOpen=true;renderFocus();$('detail').focus();
  }
});
$('close-detail').addEventListener('click',()=>{
  detailOpen=false;$('detail').hidden=true;
  ([...document.querySelectorAll('[data-open]')].find(el=>el.dataset.open===returnFocus?.id&&el.dataset.surface===returnFocus?.surface)??$('search')).focus();
});
load();
