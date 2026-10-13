// High-accuracy transcription with Whisper, running on the user's own device (no server).
// The model downloads once from Hugging Face and is cached by the browser afterwards.
import {pipeline} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';

// The page picks the model: tiny.en on phones (~40 MB, faster), base.en on laptops (~79 MB, more accurate).
let asr=null,loaded='';
function load(model='Xenova/whisper-base.en'){
  if(loaded!==model){asr=null;loaded=model;}
  asr??=pipeline('automatic-speech-recognition',model,{dtype:'q8',device:'wasm',
    progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',file:p.file,loaded:p.loaded,total:p.total});}});
  return asr;
}
// Split long audio into ~15 s pieces, cutting at the quietest moment near each boundary so words aren't
// chopped. Transcribing piece by piece keeps memory low (phones close pages that use too much) and gives
// real progress.
const RATE=16000;
function pieces(audio,target=15,search=3){
  const out=[];let start=0;
  while(audio.length-start>(target+search)*RATE){
    const lo=start+(target-search)*RATE,hi=start+(target+search)*RATE,win=RATE/10;let best=lo,bestE=Infinity;
    for(let i=lo;i+win<=hi;i+=win/2){let e=0;for(let j=i;j<i+win;j+=4)e+=audio[j]*audio[j];if(e<bestE){bestE=e;best=i;}}
    out.push(audio.subarray(start,best+win/2));start=best+win/2;
  }
  out.push(audio.subarray(start));return out;
}
// Messages: {id, type:'load'} warms the model up; {id, type:'run', audio: Float32Array at 16 kHz} transcribes.
self.onmessage=async e=>{
  const {id,type,audio,model}=e.data;
  try{
    const run=await load(model);
    if(type==='load'){self.postMessage({id,type:'ready'});return;}
    self.postMessage({id,type:'transcribing'});
    const parts=pieces(audio),texts=[];
    for(let k=0;k<parts.length;k++){
      // Drop Whisper's sound tags such as [BLANK_AUDIO] or (music).
      const out=await run(parts[k]);texts.push((out.text||'').replace(/\[[^\]]*\]|\([^)]*\)/g,' ').trim());
      self.postMessage({id,type:'segment',done:k+1,total:parts.length});
    }
    self.postMessage({id,type:'done',text:texts.filter(Boolean).join(' ').replace(/\s+/g,' ').trim()});
  }catch(err){asr=null;self.postMessage({id,type:'error',message:String(err?.message||err)});}
};
