import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp,validateImage,parseResult} from './index.mjs';
const image={mimeType:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='};
test('valida formato e rejeita bytes que não correspondem ao MIME',()=>{assert.equal(validateImage(image).mimeType,'image/png');assert.throws(()=>validateImage({...image,mimeType:'image/jpeg'}));assert.throws(()=>validateImage({...image,data:'not base64'}));});
test('servidor usa chave somente no header e trata falhas do provedor',async()=>{
 let captured;const codes='codes'==='codes';let invalid=false;
 const app=createApp({key:'server-test-secret',model:'test-model',request:async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:invalid?'':codes?'[" rp-001 ","RP-001"]':'POSICIONAMENTO DA CÂMERA: plano geral.'}]}}]})};}});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{
 const base=`http://127.0.0.1:${app.address().port}`;
 const call=(body,origin)=>fetch(base+'/api/analyze',{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{})},body:JSON.stringify(body)});
 const r=await call(image);assert.equal(r.status,200);const data=await r.json();assert.ok(codes?data.result[0]==='RP-001':data.result.includes('CÂMERA'));
 assert.equal(captured.options.headers['x-goog-api-key'],'server-test-secret');assert.ok(!captured.url.includes('server-test-secret'));
 assert.equal((await call(image,'https://foreign.invalid')).status,403);assert.equal((await call({...image,data:'bad'})).status,400);
 invalid=true;assert.equal((await call(image)).status,502);
 }finally{await new Promise(resolve=>app.close(resolve));}
});
test('sem chave retorna configuração pendente, nunca resultado simulado',async()=>{
 const app=createApp({key:''});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 try{const base=`http://127.0.0.1:${app.address().port}`;assert.equal((await fetch(base+'/api/health').then(r=>r.json())).configured,false);const r=await fetch(base+'/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(image)});assert.equal(r.status,503);}finally{await new Promise(resolve=>app.close(resolve));}
});
