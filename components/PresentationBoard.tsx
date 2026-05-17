
import React from 'react';
import { DoorItem, OrderState, PriceRecord, StorageTypeRecord } from '../types';
import { COLORS } from '../constants';

interface PresentationBoardProps {
  order: OrderState;
  priceList: PriceRecord[];
  storageTypes: StorageTypeRecord[];
  showPrices: boolean;
  setShowPrices: (show: boolean) => void;
  onClose: () => void;
}

const COLOR_MAP: Record<string, string> = {
  "ピュアホワイト(WW)": "#f8f9fa",
  "ライトグレー(LG)": "#d1d5db",
  "ダークグレー(DG)": "#4b5563",
  "コンフォートオーク(CO)": "#e5ba8c",
  "グレージュアッシュ(GA)": "#bba28f",
  "プレシャスウォールナット(PW)": "#523a2d",
};

export const PresentationBoard: React.FC<PresentationBoardProps> = ({ order, priceList, storageTypes, showPrices, setShowPrices, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[600] bg-gray-900/95 backdrop-blur-md overflow-y-auto p-4 md:p-12 no-print">
      <div className="max-w-[1400px] mx-auto relative pb-24">
        {/* A3 Presentation Sheet (Landscape) */}
        <div className="bg-white shadow-2xl mx-auto print:shadow-none print:m-0 overflow-hidden rounded-sm flex flex-col print-area" 
             style={{ width: '100%', maxWidth: '420mm', minHeight: '297mm', margin: '0 auto' }}>
          
          {/* Header Area */}
          <div className="bg-black text-white p-8 mb-4 flex justify-between items-end shrink-0">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2">PRESENTATION BOARD</h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Custom Door & Storage Solution</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{order.customerInfo.siteName} 様邸 新築工事</p>
              <p className="text-sm opacity-60 font-['Inter']">{new Date().toLocaleDateString('ja-JP')} 発行</p>
            </div>
          </div>

          {/* Color Palette Summary */}
          <div className="px-10 mb-8 shrink-0">
             <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="text-[10px] font-black text-black uppercase tracking-widest border-r border-gray-300 pr-4 mr-2">Color Palette</div>
                   <div className="flex flex-wrap gap-6">
                      {Array.from(new Set([
                        ...order.doors.map(d => d.doorColor),
                        ...order.doors.map(d => d.frameColor),
                        order.storage.type !== 'NONE' ? order.storage.color : null,
                        ...order.baseboards.filter(b => b.quantity > 0).map(b => b.color)
                      ])).filter(Boolean).map((color, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded border border-gray-300 shadow-sm" style={{ backgroundColor: COLOR_MAP[color!] || '#eee' }}></div>
                           <span className="text-[10px] font-black text-black">{color}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="px-8 pb-8 flex-1">
            {/* 6x4 Grid Layout */}
            <div className="grid grid-cols-6 grid-rows-4 gap-3 h-full">
              {[
                ...order.doors.map((door, idx) => ({ type: 'door' as const, data: door, index: idx })),
                ...(order.storage.type !== 'NONE' ? [{ type: 'storage' as const, data: order.storage }] : []),
                ...order.baseboards.filter(b => b.quantity > 0).map(b => ({ type: 'baseboard' as const, data: b }))
              ].slice(0, 24).map((item, idx) => {
                if (item.type === 'door') {
                  const door = item.data as DoorItem;
                  const master = priceList.find(p => p.type === door.type && p.design === door.design);
                  return (
                    <div key={`door-${door.id}`} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex flex-col h-full min-h-[140px]">
                      {/* Image Area */}
                      <div className="h-24 bg-white p-1 relative flex items-center justify-center overflow-hidden border-b border-gray-200">
                        {master?.pbImageUrl ? (
                          <img src={master.pbImageUrl} alt={door.design} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        ) : master?.imageUrl ? (
                          <img src={master.imageUrl} alt={door.design} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="text-[8px] text-gray-300 text-center font-bold px-1">
                            {door.design}<br/>IMAGE
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded shadow-sm text-[7px] font-black border border-gray-200 text-black">
                          WD-{item.index! + 1}
                        </div>
                      </div>
                      {/* Details */}
                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div>
                          <div className="text-blue-700 font-black text-[7px] leading-none mb-1 truncate">{door.roomName}</div>
                          <h3 className="font-black text-black text-[9px] leading-tight mb-0.5 truncate">{door.type}</h3>
                          <p className="font-extrabold text-black text-[8px] leading-tight mb-1 truncate">{door.design}</p>
                          <div className="grid grid-cols-2 gap-y-0.5 text-[7px] font-bold text-black">
                            <div className="truncate opacity-50">サイズ</div>
                            <div className="text-right truncate">{door.width}×{door.height}</div>
                            <div className="truncate opacity-50">Color</div>
                            <div className="flex items-center justify-end gap-1">
                              <div className="w-2.5 h-2.5 rounded border border-gray-300 shadow-sm" style={{ backgroundColor: COLOR_MAP[door.doorColor] || '#ccc' }}></div>
                            </div>
                          </div>
                        </div>
                        {showPrices && (
                          <div className="pt-1 mt-1 border-t border-gray-200 text-right">
                            <span className="font-black text-black font-['Inter'] text-[9px]">¥{door.price.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else if (item.type === 'storage') {
                  const storage = item.data as OrderState['storage'];
                  const storageMaster = storageTypes.find(s => s.id === storage.type);
                  const imgUrl = storageMaster?.pbImageUrl || storageMaster?.imageUrl;
                  return (
                    <div key="storage-item" className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex flex-col h-full min-h-[140px]">
                      <div className="h-24 bg-white p-1 relative flex items-center justify-center border-b border-gray-200">
                        {imgUrl ? (
                          <img src={imgUrl} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" alt={storage.type} />
                        ) : (
                          <div className="text-[8px] text-gray-300 font-bold">STORAGE</div>
                        )}
                        <div className="absolute top-1 left-1 bg-black text-white px-1.5 py-0.5 rounded shadow-sm text-[7px] font-black">
                          ST-1
                        </div>
                      </div>
                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div>
                          <div className="text-emerald-700 font-black text-[7px] leading-none mb-1 uppercase bg-emerald-50 px-1 py-0.5 rounded-full inline-block">玄関収納</div>
                          <h3 className="font-black text-black text-[9px] leading-tight truncate">{storage.type}</h3>
                          <div className="text-[7px] font-bold text-black opacity-60 mt-0.5 truncate">{storage.size} / {storage.filler}</div>
                        </div>
                        {showPrices && (
                          <div className="pt-1 mt-1 border-t border-gray-200 text-right">
                            <span className="font-black text-black font-['Inter'] text-[9px]">¥{storage.basePrice.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  const baseboard = item.data as any;
                  return (
                    <div key={`baseboard-${idx}`} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 flex flex-col h-full min-h-[140px]">
                      <div className="h-24 bg-white p-1 relative flex items-center justify-center border-b border-gray-200">
                        <div className="w-12 h-12 rounded border border-gray-200 shadow-inner" style={{ backgroundColor: COLOR_MAP[baseboard.color] || '#eee' }}></div>
                        <div className="absolute top-1 left-1 bg-amber-600 text-white px-1.5 py-0.5 rounded shadow-sm text-[7px] font-black">
                          BB-{idx}
                        </div>
                      </div>
                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div>
                          <div className="text-amber-700 font-black text-[7px] leading-none mb-1 uppercase bg-amber-50 px-1 py-0.5 rounded-full inline-block">巾木・造作</div>
                          <h3 className="font-black text-black text-[9px] leading-tight truncate">{baseboard.product}</h3>
                          <div className="text-[7px] font-bold text-black opacity-60 mt-0.5 truncate">{baseboard.color}</div>
                        </div>
                        <div className="mt-1 flex justify-between items-end">
                           <div className="text-[7px] font-black text-blue-600">Qty: {baseboard.quantity}</div>
                           {showPrices && (
                             <span className="font-black text-black font-['Inter'] text-[9px]">¥{(baseboard.unitPrice * baseboard.quantity).toLocaleString()}</span>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
              {/* Fill remaining slots if necessary */}
              {Array.from({ length: Math.max(0, 24 - (order.doors.length + (order.storage.type !== 'NONE' ? 1 : 0) + order.baseboards.filter(b => b.quantity > 0).length)) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50/30 rounded-lg border border-dashed border-gray-200 min-h-[140px]"></div>
              ))}
            </div>

            {/* Footer Area */}
            <div className={`mt-12 pt-8 border-t-2 border-black flex justify-between items-start`}>
              <div className="flex gap-12">
                <div>
                   <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Contractor</p>
                   <p className="font-black text-black text-lg">{order.customerInfo.company}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Representative</p>
                   <p className="font-black text-black text-lg">{order.customerInfo.contactName}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {showPrices && (
                  <div className="mb-6 text-right">
                     <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Total Estimated Amount</p>
                     <p className="text-4xl font-black text-black font-['Inter'] tracking-tighter italic">¥{(
                       order.doors.reduce((sum, d) => sum + d.price, 0) + 
                       (order.storage.type !== 'NONE' ? order.storage.basePrice : 0) + 
                       order.baseboards.reduce((sum, b) => sum + (b.unitPrice * b.quantity), 0)
                     ).toLocaleString()}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xl font-black tracking-tighter italic text-black">KASHIWA MOKKO CO.,LTD.</p>
                  <div className="text-[10px] font-black text-black opacity-60 mt-1">
                     Head Office: Takayama, Gifu / Representative: Takashita<br/>
                     TEL: 0577-32-3050 / URL: www.kashiwa.gr.jp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls at the bottom */}
        <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-6 no-print">
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/20 shadow-2xl">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  checked={showPrices} 
                  onChange={(e) => setShowPrices(e.target.checked)}
                  className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-white/40 transition-all checked:bg-blue-600 checked:border-blue-600"
                />
                <svg className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 left-1 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="text-white font-bold text-lg select-none">プレゼンボードに金額を表示する</span>
            </label>

            <div className="w-px h-8 bg-white/20 mx-2" />

            <button 
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg active:scale-95 text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              印刷 / PDF保存
            </button>
          </div>

          <button 
            onClick={onClose}
            className="text-white flex items-center gap-3 hover:text-red-400 transition-colors font-black bg-white/5 hover:bg-white/10 px-10 py-4 rounded-3xl border border-white/10 text-xl"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            閉じる
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .no-print { display: none !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 420mm !important; 
            height: 297mm !important; 
            border: none !important;
          }
          @page { size: A3 landscape; margin: 0; }
        }
      `}} />
    </div>
  );
};
