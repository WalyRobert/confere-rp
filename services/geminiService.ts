export async function extractCodesFromImage(dataUrl:string):Promise<string[]>{
 const match=dataUrl.match(/^data:([^;]+);base64,(.+)$/s);if(!match)throw new Error('Imagem inválida.');
 const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mimeType:match[1],data:match[2]}),signal:AbortSignal.timeout(30000)});
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha na leitura dos códigos.');
 if(!Array.isArray(data.result)||data.result.some((x:unknown)=>typeof x!=='string'))throw new Error('Resposta de códigos inválida.');return data.result;
}
