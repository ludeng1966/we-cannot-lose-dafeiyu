(()=>{
 'use strict';
 const previous={...(window.FullRevisions||{})};
 const old=(id,ctx,t,A)=>previous[id]?.(ctx,t,A)||false;
 window.FullRevisions={
  ...previous,
  intro1:(ctx,t,A)=>window.OpeningImpact?.draw(ctx,t,A)||old('intro1',ctx,t,A),
  p1c3:(ctx,t,A)=>window.LearningScenes?.draw(ctx,'p1c3',t,A)||old('p1c3',ctx,t,A),
  p2c1:(ctx,t,A)=>window.LearningScenes?.draw(ctx,'p2c1',t,A)||window.SecondPartSymbols?.draw(ctx,'p2c1',t,A)||old('p2c1',ctx,t,A),
  p2c2:(ctx,t,A)=>window.LearningScenes?.draw(ctx,'p2c2',t,A)||window.SecondPartSymbols?.draw(ctx,'p2c2',t,A)||old('p2c2',ctx,t,A)
 };
})();
