
import React from 'react';
import { DoorItem, OrderState, PriceRecord, StorageTypeRecord, HandleRecord, BaseboardItem } from '../types';
import { COLORS } from '../constants';

interface PresentationBoardProps {
  order: OrderState;
  priceList: PriceRecord[];
  storageTypes: StorageTypeRecord[];
  handleMaster: HandleRecord[];
  baseboardMaster: BaseboardItem[];
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

const COLOR_IMAGES: Record<string, string> = {
  "ピュアホワイト(WW)": "http://25663cc9bda9549d.main.jp/aistudio/door/WW.jpg",
  "ライトグレー(LG)": "http://25663cc9bda9549d.main.jp/aistudio/door/LG.jpg",
  "ダークグレー(DG)": "http://25663cc9bda9549d.main.jp/aistudio/door/DG.jpg",
  "コンフォートオーク(CO)": "http://25663cc9bda9549d.main.jp/aistudio/door/CO.jpg",
  "グレージュアッシュ(GA)": "http://25663cc9bda9549d.main.jp/aistudio/door/GA.jpg",
  "プレシャスウォールナット(PW)": "http://25663cc9bda9549d.main.jp/aistudio/door/PW.jpg",
};

export const PresentationBoard: React.FC<PresentationBoardProps> = ({ 
  order, priceList, storageTypes, handleMaster, baseboardMaster, showPrices, setShowPrices, onClose 
}) => {
  const handlePrint = () => {
    window.print();
  };

  const resolveHandleNameLocal = (simpleName: string, doorType: string) => {
    if (doorType.includes("折戸") || doorType.includes("物入")) return "J型取手";
    const isSliding = doorType.includes("引") || doorType.includes("引き");
    const SLIDING = [
      "セラミックホワイト(PC-422-001)",
      "マットブラック(PC-422-003)",
      "サテンニッケル(PC-422-XN)"
    ];
    const HINGED = [
      "セラミックホワイト(丁番サテンニッケル色)",
      "マットブラック(丁番ブラック色)",
      "サテンニッケル(丁番サテンニッケル色)"
    ];
    const list = isSliding ? SLIDING : HINGED;
    return list.find(h => h.startsWith(simpleName)) || list[0];
  };

  const usedHandles = React.useMemo(() => {
    const handles = order.doors.map(d => resolveHandleNameLocal(d.handleColor, d.type));
    return Array.from(new Set(handles));
  }, [order.doors]);

  return (
    <div className="fixed inset-0 z-[600] bg-gray-900/95 backdrop-blur-md overflow-y-auto p-4 md:p-12 print:static print:p-0 print:bg-white print:overflow-visible">
      <style>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 6mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white !important;
          }
        }
      `}</style>
      <div className="pb-print-wrapper max-w-[1400px] mx-auto relative pb-24 print:pb-0 bg-white p-8 rounded-3xl shadow-2xl print:bg-transparent print:p-0 print:shadow-none print:rounded-none">
        {/* A3 Presentation Sheet (Landscape) */}
          
          {/* Header Area */}
          <div className="bg-black text-white p-2 mb-1 print:mb-4 flex justify-between items-center shrink-0">
            <div>
              <h1 className="text-xl font-black tracking-tighter">KASHIWA PRESENTATION BOARD</h1>
              <p className="text-white font-black uppercase tracking-widest text-[8px]">Custom Door & Storage Solution</p>
            </div>
            <div className="text-right">
              <p className="text-md font-black">{order.customerInfo.siteName} 様邸 新築工事</p>
              <p className="text-[10px] font-black font-['Inter']">{new Date().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          {/* Color Palette Summary */}
          <div className="px-8 mb-1 print:mb-5 shrink-0">
             <div className="bg-gray-50 border border-black rounded-lg p-1.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="text-[9px] print:text-[10.5px] font-black text-black uppercase tracking-widest border-r border-black pr-3 mr-1">Color Palette</div>
                    <div className="flex flex-wrap gap-2 print:gap-x-3 print:gap-y-1.5">
                       {Object.entries(COLOR_MAP).map(([color, hex], cIdx) => (
                         <div key={cIdx} className="flex items-center gap-1 print:gap-1.5">
                            <div className="w-5 h-5 print:w-[26px] print:h-[26px] rounded border border-black shadow-sm overflow-hidden flex items-center justify-center bg-white">
                                {COLOR_IMAGES[color] ? (
                                  <img src={COLOR_IMAGES[color]} alt={color} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full" style={{ backgroundColor: hex }}></div>
                                )}
                            </div>
                            <span className="text-[9px] print:text-[10.5px] font-black text-black">{color}</span>
                         </div>
                       ))}
                    </div>
                </div>
             </div>
          </div>

          <div className="px-5 pb-2 flex-1">
            {/* 6x4 Grid Layout */}
            <div className="grid grid-cols-6 grid-rows-4 gap-1 print:gap-2 h-full print:h-auto">
              {(() => {
                const items = [
                  ...order.doors.map((door, idx) => ({ type: 'door' as const, data: door, index: idx })),
                  ...(order.storage.type !== 'NONE' ? [{ type: 'storage' as const, data: order.storage }] : []),
                  ...order.baseboards.filter(b => b.quantity > 0).map(b => ({ type: 'baseboard' as const, data: b })),
                  ...usedHandles.map(h => ({ type: 'handle' as const, data: h }))
                ].slice(0, 24);

                return (
                  <>
                    {items.map((item, idx) => {
                      if (item.type === 'door') {
                        const door = item.data as DoorItem;
                        
                        const getEffectiveHeight = (d: DoorItem) => {
                          if (d.height !== '特寸') return d.height;
                          if (!d.customHeight) return 'H2400';
                          const isStorageItem = d.type.includes('物入');
                          if (isStorageItem) {
                            if (d.customHeight <= 900) return "H900";
                            if (d.customHeight <= 1200) return "H1200";
                            if (d.customHeight <= 2000) return "H2000";
                            if (d.customHeight <= 2200) return "H2200";
                            return "H2400";
                          } else {
                            if (d.customHeight <= 2000) return "H2000";
                            if (d.customHeight <= 2200) return "H2200";
                            return "H2400";
                          }
                        };
                        
                        const effHeight = getEffectiveHeight(door);
                        
                        let searchDesign = door.design;
                        if (door.isUndercut) {
                          searchDesign = "アンダーカット";
                        } else if (door.isFrameExtended) {
                          if (door.domaExtensionType === 'none') searchDesign = "土間納まり（伸長なし）";
                          else if (door.domaExtensionType === 'frame') searchDesign = "土間納まり（枠伸長）";
                          else if (door.domaExtensionType === 'door') searchDesign = "土間納まり（建具伸長）";
                        }

                        // Try finding by searchDesign (special design or explicit design)
                        let master = priceList.find(p => p.type === door.type && p.design === searchDesign && p.height === effHeight);
                        
                        // Fallback: If special searchDesign didn't match anything, look for notes in standard design
                        if (!master && searchDesign !== door.design) {
                          const standardMasters = priceList.filter(p => p.type === door.type && p.design === door.design && p.height === effHeight);
                          if (door.isUndercut) {
                            master = standardMasters.find(m => m.notes?.includes('アンダーカット'));
                          } else if (door.isFrameExtended) {
                            master = standardMasters.find(m => m.notes?.includes('枠伸長') || m.notes?.includes('建具伸長') || m.notes?.includes('土間'));
                          }
                        }

                        // Final Fallback: just use the standard design record if still not found
                        if (!master) {
                          master = priceList.find(p => p.type === door.type && p.design === door.design && p.height === effHeight);
                        }

                        const isLeft = door.hangingSide?.includes('左') || door.hangingSide?.includes('(L)');
                        const isRight = door.hangingSide?.includes('右') || door.hangingSide?.includes('(R)');
                        let pbUrl = master?.pbImageUrl;
                        if (isLeft && master?.pbImageUrlL) pbUrl = master.pbImageUrlL;
                        else if (isRight && master?.pbImageUrlR) pbUrl = master.pbImageUrlR;

                        return (
                          <div key={`door-${door.id}`} className="bg-gray-50 rounded-lg overflow-hidden border border-black flex flex-col h-full min-h-[110px] print:min-h-[118px]">
                            {/* Image Area */}
                            <div className="h-16 bg-white p-0.5 relative flex items-center justify-center overflow-hidden border-b border-black print:h-[64px]">
                              {pbUrl ? (
                                <img src={pbUrl} alt={door.design} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              ) : master?.imageUrl ? (
                                <img src={master.imageUrl} alt={door.design} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="text-[7px] print:text-[10px] text-black text-center font-black px-1">
                                  {door.design}<br/>IMAGE
                                </div>
                              )}
                              
                              {/* Option Labels */}
                              <div className="absolute bottom-0.5 right-1 flex flex-col items-end pointer-events-none">
                                {door.isUndercut && (
                                  <span className="text-red-500 font-black text-[7px] print:text-[10px] leading-tight drop-shadow-sm tracking-tight text-right">
                                    アンダーカット {door.undercutHeight || 0}㎜
                                  </span>
                                )}
                                {door.isFrameExtended && (
                                  <span className="text-red-500 font-black text-[7px] print:text-[10px] leading-tight drop-shadow-sm tracking-tight text-right">
                                    {door.domaExtensionType === 'frame' ? `土間（枠伸長） ${door.frameExtensionHeight || 0}㎜` : 
                                     door.domaExtensionType === 'door' ? `土間（建具伸長） ${door.frameExtensionHeight || 0}㎜` :
                                     door.domaExtensionType === 'none' ? '土間納まり' : `枠伸長 ${door.frameExtensionHeight || 0}㎜`}
                                  </span>
                                )}
                              </div>

                              <div className="absolute top-0.5 left-0.5 bg-white/90 backdrop-blur px-1 py-0 rounded shadow-sm text-[7px] print:text-[10px] font-black border border-black text-black">
                                WD-{item.index! + 1}
                              </div>
                            </div>
                            {/* Details */}
                            <div className="p-1 flex flex-col justify-between flex-1">
                              <div>
                                <div className="text-blue-700 font-black text-[7px] print:text-[10px] leading-none mb-0.5 tracking-wider">{door.roomName}</div>
                                <div className="flex items-baseline justify-between gap-0.5 mb-0.5 overflow-hidden">
                                  <h3 className={`font-black text-black text-[8px] print:text-[11px] tracking-tight leading-tight whitespace-nowrap`}>
                                    {door.type}
                                  </h3>
                                  {door.hangingSide && door.hangingSide !== 'なし' && (
                                    <span className={`font-black text-black text-[7px] print:text-[10px] tracking-tight leading-tight whitespace-nowrap ml-1`}>
                                      {door.hangingSide}
                                    </span>
                                  )}
                                </div>
                                <p className="font-black text-black text-[8px] print:text-[11px] leading-tight mb-0.5 tracking-wide">{door.design}</p>
                                <div className="grid grid-cols-[38px_1fr] gap-y-0 text-[7px] print:text-[10px] font-black text-black tracking-wide">
                                  <div className="whitespace-nowrap">サイズ</div>
                                  <div className="text-right">
                                    {door.width === '特寸' ? (
                                      <span className="text-red-500 font-black">特寸 {door.customWidth}</span>
                                    ) : (
                                      door.width
                                    )}
                                    ×
                                    {door.height === '特寸' ? (
                                      <span className="text-red-500 font-black">特寸 {door.customHeight}</span>
                                    ) : (
                                      door.height
                                    )}
                                  </div>
                                  
                                  <div className="whitespace-nowrap">扉カラー</div>
                                  <div className="flex items-center justify-end gap-1 overflow-hidden">
                                    <span className="text-[6px] print:text-[9px] font-black text-black leading-tight truncate">{door.doorColor}</span>
                                    <div className="w-2 h-2 print:w-3.5 print:h-3.5 rounded border border-black shadow-sm shrink-0 overflow-hidden flex items-center justify-center bg-white">
                                      {COLOR_IMAGES[door.doorColor] ? (
                                        <img src={COLOR_IMAGES[door.doorColor]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full" style={{ backgroundColor: COLOR_MAP[door.doorColor] || '#555' }}></div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="whitespace-nowrap">枠カラー</div>
                                  <div className="flex items-center justify-end gap-1 overflow-hidden">
                                    <span className="text-[6px] print:text-[9px] font-black text-black leading-tight truncate">{door.frameColor}</span>
                                    <div className="w-2 h-2 print:w-3.5 print:h-3.5 rounded border border-black shadow-sm shrink-0 overflow-hidden flex items-center justify-center bg-white">
                                      {COLOR_IMAGES[door.frameColor] ? (
                                        <img src={COLOR_IMAGES[door.frameColor]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full" style={{ backgroundColor: COLOR_MAP[door.frameColor] || '#555' }}></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {door.remarks && (
                                  <p className="text-[7px] print:text-[10px] font-black text-red-600 leading-tight mt-0.5 border-t border-black pt-0.5">
                                    備考: {door.remarks}
                                  </p>
                                )}
                              </div>
                              {showPrices && (
                                <div className="pt-0.5 mt-0.5 border-t border-black text-right">
                                  <span className="font-black text-black font-['Inter'] text-[8px] print:text-[11px]">¥{door.price.toLocaleString()}</span>
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
                          <div key="storage-item" className="bg-gray-50 rounded-lg overflow-hidden border border-black flex flex-col h-full min-h-[110px] print:min-h-[118px]">
                            <div className="h-16 bg-white p-0.5 relative flex items-center justify-center border-b border-black print:h-[64px]">
                              {imgUrl ? (
                                <img src={imgUrl} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" alt={storage.type} />
                              ) : (
                                <div className="text-[7px] print:text-[10px] text-black font-black">STORAGE</div>
                              )}
                              <div className="absolute top-0.5 left-0.5 bg-black text-white px-1 py-0 rounded shadow-sm text-[7px] print:text-[10px] font-black">
                                ST-1
                              </div>
                            </div>
                              {/* Details */}
                              <div className="p-1 flex flex-col justify-between flex-1">
                                <div>
                                  <div className="text-blue-700 font-black text-[7px] print:text-[10px] leading-none mb-0.5">玄関収納</div>
                                  <h3 className="font-black text-black text-[8px] print:text-[11px] leading-tight">{storage.type}</h3>
                                  <div className="flex items-center justify-between mt-1 text-[7px] print:text-[10px]">
                                    <div className="font-black text-black">{storage.size} / {storage.filler}</div>
                                    <div className="flex items-center gap-0.5">
                                      <span className="font-black text-black leading-tight">{storage.color}</span>
                                      <div className="w-2 h-2 print:w-3.5 print:h-3.5 rounded border border-black shadow-sm shrink-0 overflow-hidden flex items-center justify-center bg-white">
                                        {COLOR_IMAGES[storage.color] ? (
                                          <img src={COLOR_IMAGES[storage.color]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                          <div className="w-full h-full" style={{ backgroundColor: COLOR_MAP[storage.color] || '#555' }}></div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {showPrices && (
                                  <div className="pt-0.5 mt-0.5 border-t border-black text-right">
                                    <span className="font-black text-black font-['Inter'] text-[8px] print:text-[11px]">¥{storage.basePrice.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                          </div>
                        );
                      } else if (item.type === 'baseboard') {
                        const baseboard = item.data as any;
                        const record = baseboardMaster.find(b => b.product === baseboard.product);
                        return (
                          <div key={`baseboard-${idx}`} className="bg-gray-50 rounded-lg overflow-hidden border border-black flex flex-col h-full min-h-[110px] print:min-h-[118px]">
                            <div className="h-16 bg-white p-0.5 relative flex items-center justify-center border-b border-black print:h-[64px]">
                              {record?.pbImageUrl ? (
                                <img src={record.pbImageUrl} className="max-h-full max-w-full object-contain" />
                              ) : COLOR_IMAGES[baseboard.color] ? (
                                <img src={COLOR_IMAGES[baseboard.color]} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded border border-black shadow-inner" style={{ backgroundColor: COLOR_MAP[baseboard.color] || '#666' }}></div>
                              )}
                              <div className="absolute top-0.5 left-0.5 bg-black text-white px-1 py-0 rounded shadow-sm text-[7px] print:text-[10px] font-black">
                                BB
                              </div>
                            </div>
                            <div className="p-1 flex flex-col justify-between flex-1">
                              <div>
                                <h3 className="font-black text-black text-[8px] print:text-[11px] leading-tight">{baseboard.product}</h3>
                                <div className="text-[7px] print:text-[10px] font-black text-black mt-0.5 flex items-center justify-between">
                                  <span className="flex items-center gap-0.5 font-black text-black">
                                    <span className="leading-tight">{baseboard.color}</span>
                                    <div className="w-2 h-2 print:w-3.5 print:h-3.5 rounded border border-black shadow-sm shrink-0 overflow-hidden flex items-center justify-center bg-white">
                                      {COLOR_IMAGES[baseboard.color] ? (
                                        <img src={COLOR_IMAGES[baseboard.color]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-full h-full" style={{ backgroundColor: COLOR_MAP[baseboard.color] || '#555' }}></div>
                                      )}
                                    </div>
                                  </span>
                                </div>
                              </div>
                              <div className="mt-0.5 flex justify-between items-end">
                                 <div className="text-[7px] print:text-[10px] font-black text-black">-{baseboard.quantity}-</div>
                                 {showPrices && (
                                   <span className="font-black text-black font-['Inter'] text-[8px] print:text-[11px]">¥{(baseboard.unitPrice * baseboard.quantity).toLocaleString()}</span>
                                 )}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        // Handle item
                        const handleName = item.data as string;
                        const record = handleMaster.find(h => h.name === handleName);
                        
                        // Label determination logic
                        let handleLabel = "把手部材";
                        const pullHandles = [
                          "セラミックホワイト(PC-422-001)",
                          "マットブラック(PC-422-003)",
                          "サテンニッケル(PC-422-XN)"
                        ];
                        const leverHandles = [
                          "セラミックホワイト(丁番サテンニッケル色)",
                          "マットブラック(丁番ブラック色)",
                          "サテンニッケル(丁番サテンニッケル色)"
                        ];
                        
                        if (leverHandles.includes(handleName)) handleLabel = "レバーハンドル";
                        else if (pullHandles.includes(handleName)) handleLabel = "引手";
                        else if (handleName === "J型取手") handleLabel = "J型取手";
                        
                        // Shorten label for tight grid
                        const shortLabel = handleLabel === "レバーハンドル" ? "ハンドル" : handleLabel;

                        return (
                          <div key={`handle-${idx}`} className="bg-gray-50 rounded-lg overflow-hidden border border-black flex flex-col h-full min-h-[110px] print:min-h-[118px]">
                            <div className="h-16 bg-white p-0.5 relative flex items-center justify-center border-b border-black print:h-[64px]">
                              {record?.pbImageUrl ? (
                                <img src={record.pbImageUrl} className="max-h-full max-w-full object-contain" />
                              ) : (
                                <div className="text-[7px] print:text-[10px] text-black font-black">HANDLE</div>
                              )}
                              <div className="absolute top-0.5 left-0.5 bg-black text-white px-1 py-0 rounded shadow-sm text-[7px] print:text-[10px] font-black">
                                HD
                              </div>
                            </div>
                            <div className="p-1 flex flex-col justify-between flex-1">
                              <div>
                                <div className="text-blue-700 font-black text-[7px] print:text-[10px] leading-none mb-0.5">{shortLabel}</div>
                                <h3 className="font-black text-black text-[8px] print:text-[11px] leading-tight truncate">{handleName}</h3>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                    {/* Fill remaining slots to make exactly 24 slots (4 rows) */}
                    {Array.from({ length: Math.max(0, 24 - items.length) }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-gray-50/30 print:bg-transparent rounded-lg border border-dashed border-black min-h-[110px] print:min-h-[118px]"></div>
                    ))}
                  </>
                );
              })()}
            </div>

            {/* Footer Area */}
            <div className={`mt-1 pt-0.5 border-t-2 border-black flex justify-between items-start`}>
              <div className="flex gap-12">
                <div>
                   <p className="font-black text-black text-md">{order.customerInfo.company}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {showPrices && (
                  <div className="mb-0 flex items-baseline gap-2">
                     <p className="text-xs print:text-sm font-black text-black">合計金額</p>
                     <p className="text-xl print:text-2xl font-black text-black font-['Inter'] tracking-tighter italic">¥{(
                       order.doors.reduce((sum, d) => sum + d.price, 0) + 
                       (order.storage.type !== 'NONE' ? order.storage.basePrice : 0) + 
                       order.baseboards.reduce((sum, b) => sum + (b.unitPrice * b.quantity), 0)
                     ).toLocaleString()}</p>
                  </div>
                )}
                <div className="text-right">
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
      {/* End of content */}
    </div>
  );
};
