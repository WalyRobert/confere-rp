import ExcelJS from 'exceljs';
import type {ExcelRow} from '../types';
export async function readWorkbook(file:File):Promise<ExcelRow[]>{
 if(!file.name.toLowerCase().endsWith('.xlsx')||file.size>5*1024*1024)throw new Error('Use um arquivo .xlsx de até 5 MB.');
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await file.arrayBuffer());
 const sheet=workbook.worksheets[0];if(!sheet||sheet.rowCount<2)throw new Error('Planilha sem linhas de dados.');
 if(sheet.rowCount>10001||sheet.columnCount>100)throw new Error('Limite: 10000 linhas e 100 colunas.');
 const headers:string[]=[];sheet.getRow(1).eachCell({includeEmpty:true},(cell,index)=>{headers[index-1]=cell.text.trim()||`Coluna ${index}`;});
 if(new Set(headers).size!==headers.length)throw new Error('Os títulos das colunas precisam ser únicos.');
 const rows:ExcelRow[]=[];
 for(let i=2;i<=sheet.rowCount;i++){const row:ExcelRow={};headers.forEach((header,index)=>{row[header]=sheet.getRow(i).getCell(index+1).text;});rows.push(row);}
 return rows;
}
export async function exportWorkbook(rows:ExcelRow[]){
 if(!rows.length)throw new Error('Sem dados para exportar.');
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Conferência');
 const headers=Object.keys(rows[0]);sheet.addRow(headers);for(const row of rows)sheet.addRow(headers.map(h=>String(row[h]??'')));
 return new Blob([await workbook.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
