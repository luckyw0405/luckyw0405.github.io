/* A brief ink wash and a small physical press, without changing button behavior. */
(()=>{
'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function wash(button,x,y){
 if(!button||button.disabled||button.id==='paper-enter'||reduced.matches)return;
 const rect=button.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*2;
 const ink=document.createElement('span');ink.className='paper-ripple';ink.setAttribute('aria-hidden','true');
 ink.style.width=ink.style.height=size+'px';ink.style.left=(x-rect.left-size/2)+'px';ink.style.top=(y-rect.top-size/2)+'px';
 button.classList.add('has-paper-ink');button.append(ink);
 ink.addEventListener('animationend',()=>ink.remove(),{once:true});setTimeout(()=>ink.remove(),750);
}
document.addEventListener('pointerdown',event=>{const button=event.target.closest('button,a.button');wash(button,event.clientX,event.clientY);},{passive:true});
document.addEventListener('keydown',event=>{if(event.repeat||!['Enter',' '].includes(event.key))return;const button=event.target.closest('button,a.button');if(!button)return;const rect=button.getBoundingClientRect();wash(button,rect.left+rect.width/2,rect.top+rect.height/2);});
})();
