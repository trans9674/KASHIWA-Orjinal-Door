
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
  return (
    <div className="fixed inset-0 z-[600] bg-gray-900/90 backdrop-blur-md overflow-y-auto p-4 md:p-8 no-print">
      <div className="max-w-[1400px] mx-auto relative">
        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center no-print">
          <label className="flex items-center gap-3 cursor-pointer group bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full border border-white/20 text-white">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={showPrices} 
                onChange={(e) => setShowPrices(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/40 transition-all checked:bg-blue-500 checked:border-blue-500"
              />
              <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-[3px] pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span className="text-sm font-bold">金額を表示する</span>
          </label>

          <button 
            onClick={onClose}
            className="text-white flex items-center gap-2 hover:text-gray-300 transition-colors font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            閉じる
          </button>
        </div>

        {/* A3 Presentation Sheet (Landscape) */}
        <div className="bg-white shadow-2xl mx-auto print:shadow-none print:m-0 overflow-hidden rounded-sm flex flex-col print-area" 
             style={{ width: '100%', maxWidth: '420mm', minHeight: '297mm', margin: '0 auto' }}>
          
          {/* Header Area */}
          <div className="bg-slate-800 text-white p-8 mb-4 flex justify-between items-end shrink-0">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2">PRESENTATION BOARD</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Custom Door & Storage Solution</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{order.customerInfo.siteName} 様邸 新築工事</p>
              <p className="text-sm opacity-60 font-['Inter']">{new Date().toLocaleDateString('ja-JP')} 発行</p>
            </div>
          </div>

          {/* Color Palette Summary */}
          <div className="px-10 mb-8 shrink-0">
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-300 pr-4 mr-2">Color Palette</div>
                   <div className="flex flex-wrap gap-6">
                      {Array.from(new Set([
                        ...order.doors.map(d => d.doorColor),
                        ...order.doors.map(d => d.frameColor),
                        order.storage.type !== 'NONE' ? order.storage.color : null,
                        ...order.baseboards.filter(b => b.quantity > 0).map(b => b.color)
                      ])).filter(Boolean).map((color, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: COLOR_MAP[color!] || '#eee' }}></div>
                           <span className="text-[10px] font-bold text-slate-700">{color}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="px-10 pb-12 overflow-y-auto flex-1">
            {/* Main Content Grid */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
              
              {/* Doors Section */}
              <div className="col-span-2">
                <h2 className="text-2xl font-black border-l-8 border-slate-800 pl-4 mb-6 flex items-center gap-3">
                  <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded">01</span>
                  内部建具・仕様
                </h2>
                
                <div className="grid grid-cols-2 gap-6">
                  {order.doors.map((door, idx) => {
                    const master = priceList.find(p => p.type === door.type && p.design === door.design);
                    return (
                      <div key={door.id} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex h-52">
                        {/* Image Area */}
                        <div className="w-1/3 bg-white p-2 relative flex items-center justify-center overflow-hidden border-r border-slate-200">
                          {master?.pbImageUrl ? (
                            <img src={master.pbImageUrl} alt={door.design} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          ) : master?.imageUrl ? (
                            <img src={master.imageUrl} alt={door.design} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="text-[10px] text-gray-300 text-center font-bold px-2">
                              {door.design}<br/>IMAGE
                            </div>
                          )}
                          {/* Color Badge */}
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm text-[8px] font-black border border-slate-200">
                            WD-{idx+1}
                          </div>
                        </div>

                        {/* Details Area */}
                        <div className="w-2/3 p-4 flex flex-col justify-between">
                          <div>
                            <div className="text-blue-700 font-black text-[10px] mb-1 uppercase bg-blue-50 px-2 py-0.5 rounded-full inline-block">{door.roomName}</div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight mb-2">{door.type} / {door.design}</h3>
                            
                            <div className="grid grid-cols-2 gap-y-1 text-[10px] text-slate-600">
                              <div className="font-bold text-slate-400">サイズ</div>
                              <div className="font-['Inter']">{door.width} × {door.height}</div>
                              <div className="font-bold text-slate-400">カラー（建具）</div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: COLOR_MAP[door.doorColor] || '#ccc' }}></div>
                                {door.doorColor}
                              </div>
                              <div className="font-bold text-slate-400">カラー（枠）</div>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: COLOR_MAP[door.frameColor] || '#ccc' }}></div>
                                {door.frameColor}
                              </div>
                              <div className="font-bold text-slate-400">ハンドル</div>
                              <div className="truncate">{door.handleColor}</div>
                            </div>
                          </div>

                          {showPrices && (
                            <div className="pt-2 border-t border-slate-200 flex justify-end items-center">
                              <span className="font-black text-slate-800 font-['Inter'] text-sm italic">¥{door.price.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Entrance Storage Section */}
              {order.storage.type !== 'NONE' && (
                <div className="col-span-2 mt-8">
                  <h2 className="text-2xl font-black border-l-8 border-slate-800 pl-4 mb-6 flex items-center gap-3">
                    <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded">02</span>
                    玄関収納
                  </h2>
                  <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 p-6 flex gap-8">
                    <div className="w-1/4 bg-white rounded-lg p-4 flex items-center justify-center border border-slate-200 relative aspect-square overflow-hidden">
                      {(() => {
                        const storageMaster = storageTypes.find(s => s.id === order.storage.type);
                        const imgUrl = storageMaster?.pbImageUrl || storageMaster?.imageUrl;
                        if (imgUrl) {
                          return (
                            <img 
                              src={imgUrl} 
                              className="max-h-full max-w-full object-contain" 
                              referrerPolicy="no-referrer" 
                              alt={order.storage.type}
                            />
                          );
                        }
                        return (
                          <div className="text-center">
                            <div className="text-slate-300 text-[10px] font-bold mb-2">STORAGE IMAGE</div>
                            <div className="w-8 h-8 rounded-full border-2 border-slate-300 mx-auto" style={{ backgroundColor: COLOR_MAP[order.storage.color] || '#eee' }}></div>
                            <div className="text-[10px] text-slate-400 mt-2">{order.storage.color}</div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="w-3/4">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-2xl font-black text-slate-800">{order.storage.type}</h3>
                            <p className="text-slate-500 font-bold">Category: {order.storage.size} / Filler: {order.storage.filler}</p>
                         </div>
                         {showPrices && (
                           <div className="text-right">
                             <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Base Price</div>
                             <div className="text-2xl font-black text-slate-800">¥{order.storage.basePrice.toLocaleString()}</div>
                           </div>
                         )}
                       </div>
                       <div className="grid grid-cols-3 gap-4 text-xs">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-slate-400 font-bold mb-1">台輪</div>
                             <div className="font-black">{order.storage.baseRing || 'なし'}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-slate-400 font-bold mb-1">ミラー</div>
                             <div className="font-black">{order.storage.mirror || 'なし'}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                             <div className="text-slate-400 font-bold mb-1">フィラー数</div>
                             <div className="font-black">{order.storage.fillerCount} 枚</div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Baseboard Section */}
              <div className="col-span-2 mt-8">
                <h2 className="text-2xl font-black border-l-8 border-slate-800 pl-4 mb-6 flex items-center gap-3">
                  <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded">03</span>
                  巾木・造作部材
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {order.baseboards.map((item, idx) => (
                    item.quantity > 0 && (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                         <div>
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: COLOR_MAP[item.color] || '#ccc' }}></div>
                               <div className="font-black text-slate-800">{item.product}</div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold">
                              カラー: {item.color}
                            </div>
                         </div>
                         <div className="mt-4 flex justify-between items-end border-t border-slate-200 pt-2">
                            <div className="text-xs font-black text-blue-600 tracking-tighter">Qty: {item.quantity} {item.unit}</div>
                            {showPrices && (
                              <div className="text-sm font-black text-slate-800">¥{(item.unitPrice * item.quantity).toLocaleString()}</div>
                            )}
                         </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Area */}
            <div className={`mt-20 pt-12 border-t-2 border-slate-800 flex justify-between items-start`}>
              <div className="flex gap-8">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contractor</p>
                   <p className="font-black text-slate-800">{order.customerInfo.company}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Representative</p>
                   <p className="font-black text-slate-800">{order.customerInfo.contactName}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {showPrices && (
                  <div className="mb-6 text-right">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estimated Amount</p>
                     <p className="text-4xl font-black text-slate-800 font-['Inter'] tracking-tighter italic">¥{(
                       order.doors.reduce((sum, d) => sum + d.price, 0) + 
                       (order.storage.type !== 'NONE' ? order.storage.basePrice : 0) + 
                       order.baseboards.reduce((sum, b) => sum + (b.unitPrice * b.quantity), 0)
                     ).toLocaleString()}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xl font-black tracking-tighter italic">KASHIWA MOKKO CO.,LTD.</p>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                     Head Office: Takayama, Gifu / Representative: Takashita<br/>
                     TEL: 0577-32-3050 / URL: www.kashiwa.gr.jp
                  </div>
                </div>
              </div>
            </div>
          </div>
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
