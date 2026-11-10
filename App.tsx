import {findProvider} from './utils/aiProviders.mjs';
import AISettingsPanel from './components/AISettingsPanel';
import {analyzeText,type AISettings} from './services/aiClient';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Trash2, 
  AlertCircle,
  Loader2,
  ScanText,
  PlusCircle,
  ImagePlus,
  FileText,
  Images as ImagesIcon
} from 'lucide-react';
import {readWorkbook,exportWorkbook} from './services/workbookService';
import {normalizeCode,rowHasCode} from './utils/comparison';
import {validateImageFile} from './utils/images';
import { extractCodesFromImage } from './services/geminiService';
import { DetectedCode, ExcelRow } from './types';

export default function App() {
 const [ai,setAI]=useState<AISettings|null>(null), generation=useRef(0), request=useRef<AbortController|null>(null);useEffect(()=>()=>request.current?.abort(),[]);
  const [images, setImages] = useState<{ id: string; url: string; base64: string }[]>([]);
  const [codes, setCodes] = useState<DetectedCode[]>([]);
  const [excelData, setExcelData] = useState<ExcelRow[] | null>(null);
  const [codeColumn,setCodeColumn]=useState('');
  const [error,setError]=useState('');
  const [manualCodes,setManualCodes]=useState('');
  const imageUrls=useRef(new Set<string>());
  useEffect(()=>()=>{imageUrls.current.forEach(url=>URL.revokeObjectURL(url));imageUrls.current.clear();},[]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files=Array.from(e.target.files||[]);e.target.value='';
    if(files.length+images.length>10){setError('Use até 10 imagens por processo.');return;}
    for(const file of files){
      try{await validateImageFile(file);const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Falha ao ler imagem.'));reader.readAsDataURL(file);});
      const url=URL.createObjectURL(file);imageUrls.current.add(url);setImages(prev=>[...prev,{id:crypto.randomUUID(),url,base64}]);setError('');}catch(e){setError(e instanceof Error?e.message:'Imagem inválida.');}
    }
  };

  const removeImage = (id: string) => {
    const image=images.find(img=>img.id===id);if(image){URL.revokeObjectURL(image.url);imageUrls.current.delete(image.url);}
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const processImages = async () => {
    if (images.length === 0||!ai) return;const id=++generation.current,ctrl=new AbortController();request.current=ctrl;
    setIsProcessing(true);
    const allDetected: DetectedCode[] = [];

    try {
      for (const img of images) {
        const foundStrings = await extractCodesFromImage(img.base64,ai,ctrl.signal);
        foundStrings.forEach(s => {
          if (!allDetected.some(existente => existente.code === s.toUpperCase())) {
            allDetected.push({
              id: Math.random().toString(36).substr(2, 9),
              code: normalizeCode(s),
              sourceImage: img.url,
              status: 'pending',
              timestamp: Date.now()
            });
          }
        });
      }
      if(id!==generation.current)return;setCodes(allDetected);
      setStep(2);
    } catch (error) {
      if(id===generation.current)setError(error instanceof Error?error.message:'Erro ao processar imagens.');
    } finally {
      if(id===generation.current)setIsProcessing(false);
    }
  };

  const handleExcelUpload = async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    try{const data=await readWorkbook(file);setExcelData(data);setFileName(file.name);setCodeColumn(Object.keys(data[0])[0]);setError('');}
    catch(e){setExcelData(null);setFileName('');setError(e instanceof Error?e.message:'Planilha inválida.');}
  };

  const runComparison = () => {
    if (!excelData || !codeColumn || codes.length === 0) return;

    const updatedExcel = excelData.map(row => {
      const isFound = codes.some(c => rowHasCode(row,codeColumn,c.code));
      return {
        ...row,
        'CONFERE_RP_STATUS': isFound ? 'CONSTA' : 'NÃO CONSTA',
        'CONFERE_RP_DATA': new Date().toLocaleString()
      };
    });

    const updatedCodes = codes.map(c => {
      const foundInExcel = excelData.some(row => 
        rowHasCode(row,codeColumn,c.code)
      );
      return { ...c, status: foundInExcel ? 'found' as const : 'not_found' as const };
    });

    setExcelData(updatedExcel);
    setCodes(updatedCodes);
    setStep(3);
  };

  const downloadUpdatedExcel=async()=>{
    if(!excelData)return;
    try{const blob=await exportWorkbook(excelData);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='Resultado_Conferencia.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError('Não foi possível exportar a planilha.');}
  };
  const applyManual=()=>{const entries=[...new Set(manualCodes.split(/\r?\n/).map(normalizeCode).filter(Boolean))];if(!entries.length){setError('Digite um código por linha.');return;}setCodes(entries.map(code=>({id:crypto.randomUUID(),code,sourceImage:'',status:'pending',timestamp:Date.now()})));setStep(2);setError('');};

  const downloadTxt = () => {
    if (codes.length === 0) return;
    const content = codes.map(c => c.code).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dados_Extraidos_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Inputs ocultos */}
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        accept="image/png,image/jpeg,image/webp" 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        accept="image/png,image/jpeg,image/webp" 
        capture="environment" 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-lg">
              <ScanText className="text-indigo-600 w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Confere RP</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botão Câmera (Foco em mobile) */}
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="bg-indigo-500 text-white p-2.5 rounded-xl shadow-md hover:bg-indigo-400 transition-colors border border-indigo-400"
              title="Tirar Foto"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Botão Galeria */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-indigo-600 px-3 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md hover:bg-indigo-50 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              <span className="hidden xs:block">Fotos</span>
              {images.length > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {images.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8"><details className="border rounded p-4 mb-6"><summary>Configurar IA para imagens</summary><AISettingsPanel capability="vision" value={ai} disabled={isProcessing} onChange={s=>{generation.current++;request.current?.abort();setIsProcessing(false);setError('');setAI(s);}}/></details><p className="text-sm my-3">IA para imagens: {ai?findProvider(ai.provider).name:'não configurada'}.</p>
        <p className="mb-4 text-sm text-slate-600">Revise os códigos antes de comparar. Ao usar OCR, as imagens são enviadas ao provedor selecionado pelo servidor.</p>
        {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
        {step===1 && <details className="mb-6 bg-white p-4 rounded-xl border"><summary>Conferir sem IA: informar códigos manualmente</summary><label className="block mt-3" htmlFor="manual-codes">Um código por linha</label><textarea id="manual-codes" maxLength={10000} value={manualCodes} onChange={e=>setManualCodes(e.target.value)} className="w-full border rounded p-2"/><button onClick={applyManual} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded">Usar códigos informados</button></details>}

        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 text-slate-500'}`}>1</div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 text-slate-500'}`}>2</div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 3 ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 text-slate-500'}`}>3</div>
          </div>
        </div>

        {/* STEP 1: View/Process Images */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {images.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
                <div className="bg-indigo-50 p-6 rounded-full mb-6">
                  <ImagesIcon className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800">Extrair Dados</h2>
                <p className="text-slate-500 mb-8 max-w-sm">Use a câmera do seu celular ou a galeria para adicionar fotos de códigos para conferência.</p>
                <div className="flex flex-col w-full max-w-xs gap-3">
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <Camera className="w-6 h-6" />
                    <span>Abrir Câmera</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white text-indigo-600 border-2 border-indigo-100 px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-indigo-50 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Galeria de Fotos</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ImagesIcon className="w-5 h-5 text-indigo-500" />
                    Fotos Selecionadas ({images.length})
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map(img => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white aspect-square">
                      <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => removeImage(img.id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all aspect-square bg-slate-50"
                  >
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Câmera</span>
                  </button>
                </div>

                <div className="flex justify-center mt-12">
                  <button 
                    onClick={processImages}
                    disabled={isProcessing||!ai}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Lendo códigos...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Memorizar Dados das Fotos</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: Upload Excel */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">Dados Extraídos</h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={downloadTxt}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase hover:bg-slate-200 flex items-center gap-1"
                        title="Baixar lista em TXT"
                      >
                        <FileText className="w-3 h-3" />
                        TXT
                      </button>
                      <button 
                        onClick={() => setStep(1)}
                        className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold uppercase hover:bg-indigo-100 flex items-center gap-1"
                      >
                        Fotos
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {codes.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs font-mono border border-slate-100">
                        <input aria-label="Revisar código" value={c.code} maxLength={100} onChange={e=>setCodes(prev=>prev.map(item=>item.id===c.id?{...item,code:normalizeCode(e.target.value)}:item))} className="font-bold text-indigo-600 bg-transparent w-full"/>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    ))}
                    {codes.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Nenhum dado extraído.<br/>Tente adicionar mais fotos.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                  <FileSpreadsheet className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Conferir com Planilha</h2>
                  <p className="text-slate-500 mb-8">Agora carregue o arquivo Excel para cruzar com os dados memorizados.</p>
                  
                  <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={() => excelInputRef.current?.click()}
                      className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors px-6 py-4 rounded-xl font-semibold border-2 border-emerald-200 border-dashed w-full max-w-sm justify-center"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="truncate">{fileName || "Selecionar Excel (.xlsx)"}</span>
                    </button>
                    <input 
                      type="file" 
                      ref={excelInputRef} 
                      accept=".xlsx" 
                      onChange={handleExcelUpload} 
                      className="hidden" 
                    />

                    {excelData && <label className="block">Coluna dos códigos<select aria-label="Coluna dos códigos" value={codeColumn} onChange={e=>setCodeColumn(e.target.value)} className="ml-2 border rounded p-2">{Object.keys(excelData[0]).filter(key=>!key.startsWith('CONFERE_RP_')).map(key=><option key={key}>{key}</option>)}</select></label>}
                    {excelData && (
                      <button 
                        onClick={runComparison}
                        className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
                      >
                        <Search className="w-5 h-5" />
                        <span>Cruzar Dados</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Results */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Relatório Final</h2>
                  <p className="text-slate-500">Conferência finalizada.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button 
                    onClick={() => { imageUrls.current.forEach(url=>URL.revokeObjectURL(url));imageUrls.current.clear();setStep(1);setImages([]);setCodes([]);setExcelData(null);setFileName('');setCodeColumn('');setManualCodes(''); }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                  >
                    Novo Processo
                  </button>
                  <button 
                    onClick={downloadTxt}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center space-x-2 shadow-lg shadow-slate-200 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Baixar TXT</span>
                  </button>
                  <button 
                    onClick={downloadUpdatedExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2 shadow-lg shadow-emerald-100 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    <span>Baixar Planilha</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="text-indigo-600 text-xs font-bold uppercase mb-1">Fotos Processadas</div>
                  <div className="text-3xl font-bold text-indigo-900">{images.length}</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-emerald-600 text-xs font-bold uppercase mb-1">Status: Consta</div>
                  <div className="text-3xl font-bold text-emerald-900">{codes.filter(c => c.status === 'found').length}</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="text-amber-600 text-xs font-bold uppercase mb-1">Status: Não Consta</div>
                  <div className="text-3xl font-bold text-amber-900">{codes.filter(c => c.status === 'not_found').length}</div>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-4">Código Extraído</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Referência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {codes.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">{c.code}</td>
                        <td className="px-6 py-4">
                          {c.status === 'found' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Consta
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" /> Não Consta
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <img src={c.sourceImage} className="w-8 h-8 rounded object-cover border border-slate-200" alt="Ref" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 flex items-center space-x-3 text-sm transition-all transform hover:scale-105 cursor-default">
          <div className="bg-indigo-100 p-2 rounded-full">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-700 leading-none">Status</p>
            <p className="text-slate-400 text-xs">{isProcessing ? "IA Lendo Fotos..." : images.length > 0 ? `${images.length} fotos prontas` : "Aguardando Fotos"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
