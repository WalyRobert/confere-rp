export const normalizeCode=(value:unknown)=>String(value??'').normalize('NFKC').trim().toUpperCase();
export function rowHasCode(row:Record<string,unknown>,column:string,code:unknown){return normalizeCode(row[column])===normalizeCode(code);}
