// High-accuracy transcription with Whisper, running on the user's own device (no server).
// The model (~77 MB) downloads once from Hugging Face and is cached by the browser afterwards.
import {pipeline} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';

const MODEL='Xenova/whisper-base.en';
let asr=null;
function load(){
  asr??=pipeline('automatic-speech-recognition',MODEL,{dtype:'q8',device:'wasm',
    progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'progress',file:p.file,loaded:p.loaded,total:p.total});}});
  return asr;
}
// Messages: {id, type:'load'} warms the model up; {id, type:'run', audio: Float32Array at 16 kHz} transcribes.
self.onmessage=async e=>{
  const {id,type,audio}=e.data;
  try{
    const run=await load();
    if(type==='load'){self.postMessage({id,type:'ready'});return;}
    self.postMessage({id,type:'transcribing'});
    const out=await run(audio,{chunk_length_s:30,stride_length_s:5});
    self.postMessage({id,type:'done',text:(out.text||'').trim()});
  }catch(err){asr=null;self.postMessage({id,type:'error',message:String(err?.message||err)});}
};
