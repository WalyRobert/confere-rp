import {it,expect} from 'vitest';
import ExcelJS from 'exceljs';
import {exportWorkbook} from '../services/workbookService';
it('gera um XLSX válido com status e códigos como texto',async()=>{const blob=await exportWorkbook([{codigo:'00123',CONFERE_RP_STATUS:'CONSTA'}]);const bytes:Uint8Array=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(new Uint8Array(reader.result as ArrayBuffer));reader.onerror=reject;reader.readAsArrayBuffer(blob);});const book=new ExcelJS.Workbook();await book.xlsx.load(bytes as any);expect(book.worksheets[0].getCell('A2').text).toBe('00123');expect(book.worksheets[0].getCell('B2').text).toBe('CONSTA');});
