
import React, { useState, useEffect } from 'react';
import { EntranceStorage, StorageTypeRecord } from '../types';
import { STORAGE_CATEGORIES, COLORS, DAIWA_PRICES, getStorageDetailPdfUrl } from '../constants';

interface EntranceStorageSectionProps {
  storage: EntranceStorage;
  updateStorage: (updates: Partial<EntranceStorage>) => void;
  siteName: string;
  storageTypes: StorageTypeRecord[];
}

export const EntranceStorageSection: React.FC<EntranceStorageSectionProps> = ({ storage, updateStorage, siteName, storageTypes }) => {
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
            background: transparent;
            padding: 2mm 5mm;
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
          .print-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
          }
          @media print {
            .no-print-bar { display: none; }
            body { background: white; overflow: visible; }
            .page-container { 
              margin: 0; 
              transform: none; 
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span>図面プレビュー: ${storage.size} (${siteName || '現場名未設定'}) - 表示倍率 85%</span>
          <button class="print-btn" onClick="window.print()">印刷 / PDF保存</button>
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
          baseRingPrice: storage.baseRing !== "なし" ? (DAIWA_PRICES[firstInCat.width] || 0) : 0
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
        baseRingPrice: storage.baseRing !== "なし" ? (DAIWA_PRICES[selected.width] || 0) : 0
      });
    }
  };

  const handleBaseRingToggle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hasBaseRing = e.target.value === "あり";
    const selected = storageTypes.find(s => s.id === storage.type);
    const width = selected?.width || 0;
    
    updateStorage({
      baseRing: e.target.value,
      baseRingPrice: hasBaseRing ? (DAIWA_PRICES[width] || 0) : 0
    });
  };

  const isNone = storage.type === 'NONE';
  const isMirrorDisabled = isNone || mirrorIncompatibleCategories.includes(selectedCategory);
  
  const total = isNone ? 0 : (storage.basePrice + storage.baseRingPrice + (storage.fillerPrice * storage.fillerCount) + storage.mirrorPrice);

  const Modal = ({ isOpen, onClose, title, imageUrl, children }: { isOpen: boolean, onClose: () => void, title: string, imageUrl?: string, children?: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print"
        onClick={onClose}
      >
        <div 
          className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-800">{title}</h4>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {imageUrl && <img src={imageUrl} alt={title} className="w-full h-auto rounded-lg mb-4 max-h-[60vh] object-contain" />}
          {children}
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 print-break-inside-avoid ${isNone ? 'opacity-70' : ''}`}>
      <Modal isOpen={isFillerInfoOpen} onClose={() => setIsFillerInfoOpen(false)} title="フィラー（幕板）について">
        <p className="text-gray-600 leading-relaxed text-sm mb-4">
          「フィラー（幕板）」とは、玄関収納と壁の間に取り付ける隙間を埋めるための板。扉の開閉が完全に行なわれるようにする役割もあります。
        </p>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-4 text-xs text-gray-700">
          <div>
            <p className="font-bold text-blue-900 border-b border-blue-200 pb-1 mb-2">フィラーセット サイズ 60×18×長さ</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 flex justify-between">
              <span>セパレートタイプセット</span>
              <span className="text-blue-700 font-bold">2,000円</span>
            </p>
            <p className="mt-1">長さ＝900㎜/1本　長さ400㎜/2本</p>
          </div>
          <div className="pt-2">
            <p className="font-bold text-gray-900 flex justify-between">
              <span>トールタイプセット</span>
              <span className="text-blue-700 font-bold">2,000円</span>
            </p>
            <p className="mt-1">長さ＝2100㎜/１本　長さ＝400㎜/2本</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDaiwaInfoOpen} onClose={() => setIsDaiwaInfoOpen(false)} title="台輪について" imageUrl="http://25663cc9bda9549d.main.jp/aistudio/door/daiwa.jpg">
        <p className="text-xs text-gray-500">玄関収納本体を支える下部パーツです。</p>
      </Modal>

      <Modal isOpen={isMirrorInfoOpen} onClose={() => setIsMirrorInfoOpen(false)} title="ミラーについて" imageUrl="http://25663cc9bda9549d.main.jp/aistudio/door/mirror.JPG">
        <p className="text-xs text-gray-500">扉に設置される全身鏡オプションです。</p>
      </Modal>

      <div className="flex justify-between items-center mb-4 border-l-4 border-orange-500 pl-3">
        <h3 className="text-xl font-bold text-gray-800">玄関収納</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleOpenDetails();
          }}
          disabled={isNone}
          className={`no-print px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-2 ${isNone ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none border border-gray-100' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18l-6-6m0 0l6-6m-6 6h18" />
          </svg>
          玄関収納 詳細図面
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 text-sm">
        <div className="space-y-1 lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-500">カテゴリー</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full border rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {STORAGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1 lg:col-span-3">
          <label className={`block text-xs font-semibold ${isNone ? 'text-gray-300' : 'text-gray-500'}`}>タイプ / サイズ</label>
          <select
            value={storage.type}
            disabled={isNone}
            onChange={handleTypeChange}
            className={`w-full border rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 ${isNone ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white font-medium text-gray-800'}`}
          >
            {isNone ? <option value="NONE">なし</option> : filteredTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-1 lg:col-span-2">
           <label className={`block text-xs font-semibold ${isNone ? 'text-gray-300' : 'text-gray-500'}`}>本体価格 (調整可)</label>
           <div className="relative">
             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">¥</span>
             <input 
               type="number" 
               value={storage.basePrice} 
               disabled={isNone}
               onChange={(e) => updateStorage({ basePrice: parseInt(e.target.value) || 0 })}
               className={`w-full border rounded pl-5 pr-2 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono font-bold text-gray-700 ${isNone ? 'bg-gray-50 text-gray-300' : 'bg-white border-blue-100 text-blue-800'}`}
             />
           </div>
        </div>

        <div className="space-y-1 lg:col-span-1">
          <label className={`block text-xs font-semibold ${isNone ? 'text-gray-300' : 'text-gray-500'}`}>扉カラー</label>
          <select
            value={storage.color}
            disabled={isNone}
            onChange={(e) => updateStorage({ color: e.target.value })}
            className={`w-full border rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 ${isNone ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white'}`}
          >
            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="space-y-1 lg:col-span-4 grid grid-cols-7 gap-2">
          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-1">
              <label className={`block text-xs font-semibold ${isNone ? 'text-gray-300' : 'text-gray-500'}`}>台輪</label>
              <button 
                onClick={() => setIsDaiwaInfoOpen(true)}
                disabled={isNone}
                className={`no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm ${isNone ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="台輪の画像を表示"
              >
                i
              </button>
            </div>
            <select
              value={storage.baseRingPrice > 0 ? "あり" : "なし"}
              disabled={isNone}
              onChange={handleBaseRingToggle}
              className={`w-full border rounded px-1 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 ${isNone ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white'}`}
            >
              <option value="なし">なし</option>
              <option value="あり">あり (¥{storage.baseRingPrice.toLocaleString() || '-'})</option>
            </select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-1">
              <label className={`block text-xs font-semibold ${isMirrorDisabled ? 'text-gray-300' : 'text-gray-500'}`}>ミラー</label>
              <button 
                onClick={() => setIsMirrorInfoOpen(true)}
                disabled={isMirrorDisabled}
                className={`no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm ${isMirrorDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="ミラーの画像を表示"
              >
                i
              </button>
            </div>
            <select
              value={storage.mirror}
              disabled={isMirrorDisabled}
              onChange={(e) => updateStorage({ mirror: e.target.value, mirrorPrice: e.target.value === 'あり' ? 10400 : 0 })}
              className={`w-full border rounded px-1 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 ${isMirrorDisabled ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="なし">なし</option>
              {!isMirrorDisabled && <option value="あり">あり (+¥10,400)</option>}
            </select>
          </div>
          <div className="col-span-3">
            <div className="flex items-center gap-1 mb-1">
              <label className={`block text-xs font-semibold ${isNone ? 'text-gray-300' : 'text-gray-500'}`}>フィラー</label>
              <button 
                onClick={() => setIsFillerInfoOpen(true)}
                disabled={isNone}
                className={`no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm ${isNone ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="フィラーの説明を表示"
              >
                i
              </button>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={storage.fillerCount}
                disabled={isNone}
                onChange={(e) => {
                  const count = Math.max(0, parseInt(e.target.value) || 0);
                  updateStorage({ fillerCount: count, fillerPrice: 2000 });
                }}
                className={`w-[40%] border rounded px-1 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500 ${isNone ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white'}`}
              />
              <span className={`text-sm ${isNone ? 'text-gray-300' : 'text-gray-400'} whitespace-nowrap`}>個</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-3">
        <div className="text-sm text-gray-900 font-bold">
          {!isNone && (
            <div className="flex gap-4">
              <span>本体: ¥{storage.basePrice.toLocaleString()}</span>
              {storage.baseRingPrice > 0 && <span>台輪: ¥{storage.baseRingPrice.toLocaleString()}</span>}
              {storage.mirrorPrice > 0 && <span>ミラー: ¥{storage.mirrorPrice.toLocaleString()}</span>}
              {storage.fillerCount > 0 && <span>フィラー: ¥{(storage.fillerPrice * storage.fillerCount).toLocaleString()}</span>}
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-3 py-1 rounded border border-gray-200 text-right flex items-baseline justify-end gap-2">
          <span className="text-sm font-bold text-gray-500">収納合計:</span>
          <span className={`text-3xl font-bold ${isNone ? 'text-gray-400' : 'text-blue-700'} font-['Inter']`}>¥{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
