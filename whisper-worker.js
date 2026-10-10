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
// Messages: {id, type:'load'} warms the model up; {id, type:'run', audio: Float32Array at 16 kHz} transcribes.
self.onmessage=async e=>{
  const {id,type,audio,model}=e.data;
  try{
    const run=await load(model);
    if(type==='load'){self.postMessage({id,type:'ready'});return;}
    self.postMessage({id,type:'transcribing'});
    const out=await run(audio,{chunk_length_s:30,stride_length_s:5});
    self.postMessage({id,type:'done',text:(out.text||'').trim()});
  }catch(err){asr=null;self.postMessage({id,type:'error',message:String(err?.message||err)});}
};
