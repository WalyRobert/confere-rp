import {it,expect,vi} from 'vitest';
import {validateImageFile} from '../utils/images';
it('rejeita formato/tamanho inválido e libera bitmap grande',async()=>{
 await expect(validateImageFile(new File(['x'],'bad.gif',{type:'image/gif'}))).rejects.toThrow('PNG');
 await expect(validateImageFile(new File([new Uint8Array(5*1024*1024+1)],'large.png',{type:'image/png'}))).rejects.toThrow('5 MB');
 const close=vi.fn();vi.stubGlobal('createImageBitmap',vi.fn(async()=>({width:5000,height:5000,close})));
 await expect(validateImageFile(new File(['x'],'x.png',{type:'image/png'}))).rejects.toThrow('pixels');expect(close).toHaveBeenCalled();vi.unstubAllGlobals();
});
