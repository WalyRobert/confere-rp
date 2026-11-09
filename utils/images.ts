export const MAX_IMAGE_BYTES=5*1024*1024;
export async function validateImageFile(file:File){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Use imagens PNG, JPEG ou WebP.');
 if(!file.size||file.size>MAX_IMAGE_BYTES)throw new Error('Use imagens de até 5 MB.');
 const image=await createImageBitmap(file);
 try{if(image.width*image.height>16000000)throw new Error('Imagem maior que 16 milhões de pixels.');}finally{image.close();}
}
