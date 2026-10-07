
import React, { useState, useEffect } from 'react';
import { EntranceStorage, StorageTypeRecord } from '../types';
import { STORAGE_CATEGORIES, COLORS, DAIWA_PRICES, getStorageDetailPdfUrl } from '../constants';

interface EntranceStorageSectionProps {
  storage: EntranceStorage;
  updateStorage: (updates: Partial<EntranceStorage>) => void;
  siteName: string;
  storageTypes: StorageTypeRecord[];
  storageOptionPrices?: {
    mirror: number;
    filler: number;
    daiwa_800: number;
    daiwa_1200: number;
    daiwa_1600: number;
    daiwa_2000: number;
  };
}

export const EntranceStorageSection: React.FC<EntranceStorageSectionProps> = ({ 
  storage, 
  updateStorage, 
  siteName, 
  storageTypes,
  storageOptionPrices = {
    mirror: 11440,
    filler: 2200,
    daiwa_800: 2530,
    daiwa_1200: 3410,
    daiwa_1600: 4070,
    daiwa_2000: 4290
  }
}) => {
  const getDaiwaPrice = (width: number) => {
    if (width === 800) return storageOptionPrices.daiwa_800;
    if (width === 1200) return storageOptionPrices.daiwa_1200;
    if (width === 1600) return storageOptionPrices.daiwa_1600;
    if (width === 2000) return storageOptionPrices.daiwa_2000;
    return 0;
  };
  const initialCategory = storageTypes.find(s => s.id === storage.type)?.category || "なし";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isFillerInfoOpen, setIsFillerInfoOpen] = useState(false);
  const [isDaiwaInfoOpen, setIsDaiwaInfoOpen] = useState(false);
  const [isMirrorInfoOpen, setIsMirrorInfoOpen] = useState(false);

  const filteredTypes = storageTypes.filter(s => s.category === selectedCategory);
  const mirrorIncompatibleCategories = ["一の字タイプ", "二の字タイプ"];

  const handleOpenDetails = () => {
    let finalUrl = '';
    let isPdf = false;
    
    const record = storageTypes.find(s => s.id === storage.type);
    
    if (record && record.imageUrl) {
      finalUrl = record.imageUrl;
    } else {
      finalUrl = getStorageDetailPdfUrl(storage.type);
    }

    isPdf = finalUrl.toLowerCase().endsWith('.pdf');
    
    const daiwaText = storage.baseRing === 'あり' ? 'あり' : 'なし';
    const mirrorText = storage.mirror === 'あり' ? 'あり' : '';
    const fillerText = storage.fillerCount > 0 ? `${storage.fillerCount}個` : 'なし';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>玄関収納詳細図面 - ${storage.size}</title>
        <style>
          @page { size: A3 landscape; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            background: #eee;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-family: 'Noto Sans JP', sans-serif;
            overflow-x: hidden;
            overflow-y: auto;
          }
          .page-container {
            width: 420mm;
            height: 297mm;
            position: relative;
            background-color: white;
            margin: 40px auto;
            overflow: hidden;
            transform: scale(0.85);
            transform-origin: top center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          .background-media {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }
          .background-image {
            width: 100%;
            height: 100%;
            background-image: url('${finalUrl}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
          }
          .background-pdf {
            width: 100%;
            height: 100%;
            border: none;
          }
          .overlay-header {
            position: absolute;
            top: 10mm;
            left: 27mm;
            display: flex;
            align-items: stretch;
            z-index: 100;
            background: white;
            padding: 2mm 5mm;
            border: 2px solid #ea580c;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .id-box {
            padding: 1mm 4mm;
            font-size: 26pt;
            font-weight: 900;
            color: #ea580c; 
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 2px solid #ea580c;
            margin-right: 4mm;
          }
          .details-box {
            padding: 1mm 2mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 120mm;
          }
          .details-row {
            display: flex;
            align-items: center;
            gap: 6mm;
            line-height: 1.2;
          }
          .details-item {
            display: flex;
            gap: 2mm;
            align-items: baseline;
          }
          .details-label {
            color: #555;
            font-size: 9pt;
            white-space: nowrap;
          }
          .details-value {
            font-weight: 800;
            font-size: 11pt;
            color: #000;
          }
          .no-print-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1f2937;
            color: white;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
          }
          @media print {
            .no-print-bar { display: none; }
            body { background: white; overflow: visible; margin: 0; }
            .page-container { 
              margin: 0; 
              transform: scale(0.95); 
              transform-origin: top left;
              box-shadow: none;
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span>図面プレビュー: ${storage.size} (${siteName || '現場名未設定'})</span>
          <span style="font-size: 11px; background: #374151; padding: 4px 10px; border-radius: 4px; border: 1px solid #4b5563;">※印刷は「詳細図一括出力」をご利用ください</span>
        </div>
        <div class="page-container">
          <div class="background-media">
             ${isPdf 
              ? `<iframe src="${finalUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH" class="background-pdf"></iframe>`
              : `<div class="background-image"></div>`
            }
          </div>
          <div class="overlay-header">
            <div class="id-box">GS</div>
            <div class="details-box">
              <div class="details-row">
                <div class="details-item">
                  <span class="details-label">物件名</span>
                  <span class="details-value">${siteName || '○○様邸'}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">種類</span>
                  <span class="details-value">${selectedCategory}</span>
                </div>
              </div>
              <div class="details-row" style="margin-top: 1mm;">
                <div class="details-item">
                  <span class="details-label">仕様</span>
                  <span class="details-value">${storage.size}</span>
                </div>
                <div class="details-item">
                  <span class="details-label">カラー</span>
                  <span class="details-value">${storage.color}</span>
                </div>
              </div>
              <div class="details-row" style="margin-top: 1mm;">
                <div class="details-item">
                  <span class="details-label">台輪</span>
                  <span class="details-value">${daiwaText}</span>
                </div>
                ${mirrorText ? `
                <div class="details-item">
                  <span class="details-label">ミラー</span>
                  <span class="details-value">${mirrorText}</span>
                </div>` : ''}
                <div class="details-item">
                  <span class="details-label">フィラー</span>
                  <span class="details-value">${fillerText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    
    if (newCategory === "なし") {
      updateStorage({
        type: "NONE",
        size: "なし",
        basePrice: 0,
        baseRing: "なし",
        baseRingPrice: 0,
        mirror: "なし",
        mirrorPrice: 0,
        fillerPrice: 0,
        fillerCount: 0
      });
    } else {
      const firstInCat = storageTypes.find(s => s.category === newCategory);
      if (firstInCat) {
        const updates: Partial<EntranceStorage> = {
          type: firstInCat.id,
          size: firstInCat.name,
          basePrice: firstInCat.price,
          baseRingPrice: storage.baseRing !== "なし" ? (getDaiwaPrice(firstInCat.width) || 0) : 0
        };

        if (mirrorIncompatibleCategories.includes(newCategory)) {
          updates.mirror = "なし";
          updates.mirrorPrice = 0;
        }

        updateStorage(updates);
      }
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = storageTypes.find(s => s.id === e.target.value);
    if (selected) {
      updateStorage({
        type: selected.id,
        size: selected.name,
        basePrice: selected.price,
        baseRingPrice: storage.baseRing !== "なし" ? (getDaiwaPrice(selected.width) || 0) : 0
      });
    }
  };

  const handleBaseRingToggle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hasBaseRing = e.target.value === "あり";
    const selected = storageTypes.find(s => s.id === storage.type);
    const width = selected?.width || 0;
    
    updateStorage({
      baseRing: e.target.value,
      baseRingPrice: hasBaseRing ? (getDaiwaPrice(width) || 0) : 0
    });
  };

  const isNone = storage.type === 'NONE';
  const isMirrorDisabled = isNone || mirrorIncompatibleCategories.includes(selectedCategory);
  
  const total = isNone ? 0 : (storage.basePrice + storage.baseRingPrice + (storage.fillerPrice * storage.fillerCount) + storage.mirrorPrice);

  const Modal = ({ isOpen, onClose, title, imageUrl, children }: { isOpen: boolean, onClose: () => void, title: string, imageUrl?: string, children?: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-md p-4 no-print"
        onClick={onClose}
      >
        <div 
          className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200 overflow-hidden border border-[#E5E5E7]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-[#1D1D1F] tracking-tight">{title}</h4>
            <button onClick={onClose} className="text-[#86868B] hover:text-[#1D1D1F] transition-all p-2 hover:bg-[#F5F5F7] rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {imageUrl && <img src={imageUrl} alt={title} className="w-full h-auto rounded-xl mb-6 max-h-[60vh] object-contain shadow-sm border border-[#E5E5E7]" />}
          <div className="text-[#1D1D1F]">
            {children}
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-[#1D1D1F] hover:bg-black text-white px-8 py-2.5 rounded-md text-sm font-medium transition-all active:scale-95 shadow-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[#E5E5E7] p-6 mb-8 print-break-inside-avoid transition-all ${isNone ? 'opacity-60 grayscale' : ''}`}>
      <Modal isOpen={isFillerInfoOpen} onClose={() => setIsFillerInfoOpen(false)} title="フィラー（幕板）について">
        <p className="text-[#86868B] leading-relaxed text-sm mb-6 font-medium">
          「フィラー（幕板）」とは、玄関収納と壁の間に取り付ける隙間を埋めるための板。扉の開閉が完全に行なわれるようにする役割もあります。
        </p>
        <div className="bg-[#F5F5F7] p-6 rounded-xl border border-[#E5E5E7] space-y-5 text-xs text-[#1D1D1F]">
          <div>
            <p className="font-bold text-[#1D1D1F] border-b border-[#E5E5E7] pb-2 mb-3 tracking-tight">フィラーセット サイズ 60×18×長さ</p>
          </div>
          <div>
            <p className="font-bold text-[#1D1D1F] flex justify-between text-sm">
              <span>セパレートタイプセット</span>
              <span className="text-[#0071E3] font-bold">¥2,000</span>
            </p>
            <p className="mt-1.5 text-[#86868B] font-medium">長さ＝900㎜/1本　長さ400㎜/2本</p>
          </div>
          <div className="pt-2">
            <p className="font-bold text-[#1D1D1F] flex justify-between text-sm">
              <span>トールタイプセット</span>
              <span className="text-[#0071E3] font-bold">¥2,000</span>
            </p>
            <p className="mt-1.5 text-[#86868B] font-medium">長さ＝2100㎜/１本　長さ＝400㎜/2本</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDaiwaInfoOpen} onClose={() => setIsDaiwaInfoOpen(false)} title="台輪について" imageUrl="http://25663cc9bda9549d.main.jp/aistudio/door/daiwa.jpg">
        <p className="text-xs text-[#86868B] font-medium">玄関収納本体を支える下部パーツです。</p>
      </Modal>

      <Modal isOpen={isMirrorInfoOpen} onClose={() => setIsMirrorInfoOpen(false)} title="ミラーについて" imageUrl="http://25663cc9bda9549d.main.jp/aistudio/door/mirror.JPG">
        <p className="text-xs text-[#86868B] font-medium">扉に設置される全身鏡オプションです。</p>
      </Modal>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#0071E3] rounded-full"></div>
          <h3 className="text-xl font-bold text-[#1D1D1F] tracking-tight">玄関収納</h3>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleOpenDetails();
          }}
          disabled={isNone}
          className={`no-print px-5 py-2 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap flex items-center gap-2 ${isNone ? 'bg-[#F5F5F7] text-[#D1D1D6] cursor-not-allowed shadow-none border border-[#E5E5E7]' : 'bg-[#0071E3] hover:bg-[#0077ED] text-white'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          プレビュー
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 text-sm">
        <div className="space-y-2 lg:col-span-2">
          <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider">カテゴリー</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full border border-[#E5E5E7] rounded-md px-3 py-2 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all bg-white text-[#1D1D1F] font-medium"
          >
            {STORAGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-2 lg:col-span-3">
          <label className={`block text-[11px] font-bold uppercase tracking-wider ${isNone ? 'text-[#D1D1D6]' : 'text-[#86868B]'}`}>タイプ / サイズ</label>
          <select
            value={storage.type}
            disabled={isNone}
            onChange={handleTypeChange}
            className={`w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${isNone ? 'bg-[#F5F5F7] text-[#D1D1D6] border-[#E5E5E7]' : 'bg-white font-semibold text-[#1D1D1F] border-[#E5E5E7]'}`}
          >
            {isNone ? <option value="NONE">なし</option> : filteredTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-2 lg:col-span-2">
           <label className={`block text-[11px] font-bold uppercase tracking-wider ${isNone ? 'text-[#D1D1D6]' : 'text-[#86868B]'}`}>本体価格</label>
           <div className={`flex items-center h-10 border rounded-md px-3 font-mono font-bold transition-all ${isNone ? 'bg-[#F5F5F7] text-[#D1D1D6] border-[#E5E5E7]' : 'bg-[#F5F5F7] border-[#E5E5E7] text-[#1D1D1F]'}`}>
             <span className="text-[#86868B] text-xs mr-1">¥</span>
             {storage.basePrice.toLocaleString()}
           </div>
        </div>

        <div className="space-y-2 lg:col-span-1">
          <label className={`block text-[11px] font-bold uppercase tracking-wider ${isNone ? 'text-[#D1D1D6]' : 'text-[#86868B]'}`}>扉カラー</label>
          <select
            value={storage.color}
            disabled={isNone}
            onChange={(e) => updateStorage({ color: e.target.value })}
            className={`w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${isNone ? 'bg-[#F5F5F7] text-[#D1D1D6] border-[#E5E5E7]' : 'bg-white text-[#1D1D1F] border-[#E5E5E7]'}`}
          >
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-2 lg:col-span-4 grid grid-cols-7 gap-3">
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-2">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isNone ? 'text-[#D1D1D6]' : 'text-[#86868B]'}`}>台輪</label>
              <button 
                onClick={() => setIsDaiwaInfoOpen(true)}
                disabled={isNone}
                className={`no-print bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] transition-all shadow-sm active:scale-90 ${isNone ? 'opacity-20 cursor-not-allowed' : ''}`}
                title="台輪の画像を表示"
              >
                i
              </button>
            </div>
            <select
              value={storage.baseRingPrice > 0 ? "あり" : "なし"}
              disabled={isNone}
              onChange={handleBaseRingToggle}
              className={`w-full border rounded-md px-2 py-2 text-xs focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${isNone ? 'bg-[#F5F5F7] text-[#D1D1D6] border-[#E5E5E7]' : 'bg-white text-[#1D1D1F] border-[#E5E5E7]'}`}
            >
              <option value="なし">なし</option>
              <option value="あり">あり (¥{storage.baseRingPrice.toLocaleString() || '-'})</option>
            </select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-2">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isMirrorDisabled ? 'text-[#D1D1D6]' : 'text-[#86868B]'}`}>ミラー</label>
              <button 
                onClick={() => setIsMirrorInfoOpen(true)}
                disabled={isMirrorDisabled}
                className={`no-print bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] transition-all shadow-sm active:scale-90 ${isMirrorDisabled ? 'opacity-20 cursor-not-allowed' : ''}`}
                title="ミラーの画像を表示"
              >
                i
              </button>
            </div>
            <select
              value={storage.mirror}
              disabled={isMirrorDisabled}
              onChange={(e) => updateStorage({ mirror: e.target.value, mirrorPrice: e.target.value === 'あり' ? storageOptionPrices.mirror : 0 })}
              className={`w-full border rounded-md px-2 py-2 text-xs focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${isMirrorDisabled ? 'bg-[#F5F5F7] text-[#D1D1D6] border-[#E5E5E7] cursor-not-allowed' : 'bg-white text-[#1D1D1F] border-[#E5E5E7]'}`}
            >
              <option value="なし">なし</option>
              {!isMirrorDisabled && <option value="あり">あり (+¥{storageOptionPrices.mirror.toLocaleString()})</option>}
            </select>
          </div>
          <div className="col-span-3">
            <div className="flex items-center gap-1.5 mb-2">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isNone ? 'text-[#D1D1D6]' : 'text-[#86868B]'}`}>フィラー</label>
              <button 
                onClick={() => setIsFillerInfoOpen(true)}
                disabled={isNone}
                className={`no-print bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px] transition-all shadow-sm active:scale-90 ${isNone ? 'opacity-20 cursor-not-allowed' : ''}`}
                title="フィラーの説明を表示"
              >
                i
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={storage.fillerCount}
                disabled={isNone}
                onChange={(e) => {
                  const count = Math.max(0, parseInt(e.target.value) || 0);
                  updateStorage({ fillerCount: count, fillerPrice: storageOptionPrices.filler });
                }}
                className={`w-[45%] border rounded-md px-2 py-2 text-xs text-center focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${isNone ? 'bg-[#F5F5F7] text-[#D1D1D6] border-[#E5E5E7]' : 'bg-white text-[#1D1D1F] border-[#E5E5E7] font-semibold'}`}
              />
              <span className={`text-xs font-medium ${isNone ? 'text-[#D1D1D6]' : 'text-[#86868B]'} whitespace-nowrap`}>個</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center border-t border-[#E5E5E7] pt-6">
        <div className="text-xs text-[#86868B] font-medium">
          {!isNone && (
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7]"></div>本体: ¥{storage.basePrice.toLocaleString()}</span>
              {storage.baseRingPrice > 0 && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7]"></div>台輪: ¥{storage.baseRingPrice.toLocaleString()}</span>}
              {storage.mirrorPrice > 0 && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7]"></div>ミラー: ¥{storage.mirrorPrice.toLocaleString()}</span>}
              {storage.fillerCount > 0 && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#E5E5E7]"></div>フィラー: ¥{(storage.fillerPrice * storage.fillerCount).toLocaleString()}</span>}
            </div>
          )}
        </div>
        <div className="bg-[#F5F5F7] px-6 py-3 rounded-xl border border-[#E5E5E7] text-right flex items-baseline justify-end gap-3 shadow-sm">
          <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">収納合計:</span>
          <span className={`text-3xl font-bold ${isNone ? 'text-[#D1D1D6]' : 'text-[#1D1D1F]'} tracking-tight`}>¥{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
