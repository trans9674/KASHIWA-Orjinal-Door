
import React, { useState } from 'react';
import { DoorItem, DoorType } from '../types';
import { DOOR_GROUPS, PRICE_LIST, COLORS, SLIDING_HANDLES, HINGED_HANDLES, DOOR_SPEC_MASTER, getFrameType, getDoorDetailPdfUrl } from '../constants';

interface DoorRowProps {
  index: number;
  door: DoorItem;
  updateDoor: (id: string, updates: Partial<DoorItem>) => void;
  removeDoor: (id: string) => void;
  initialSettings: {
    defaultHeight: string;
    defaultDoorColor: string;
    defaultHandleColor: string;
  };
  onShowHandleImage: () => void;
  siteName: string;
}

export const DoorRow: React.FC<DoorRowProps> = ({ 
  index, 
  door, 
  updateDoor, 
  removeDoor, 
  initialSettings, 
  onShowHandleImage,
  siteName
}) => {
  const [isCustomSizeInfoOpen, setIsCustomSizeInfoOpen] = useState(false);
  const [isFrameOptionOpen, setIsFrameOptionOpen] = useState(false);
  
  const spec = DOOR_SPEC_MASTER[door.type] || { designs: [], widths: [], hangingSides: ["なし"] };
  const isFoldingOrStorage = door.type.includes("折戸") || door.type.includes("物入");
  const isSliding = door.type.includes("引") || door.type.includes("引き");
  const isStorage = door.type === DoorType.StorageDouble || door.type === DoorType.StorageSingle;
  
  const standardHeights = isStorage 
    ? ["H900", "H1200", "H2000", "H2200", "H2400"] 
    : ["H2000", "H2200", "H2400"];
  
  const availableHeights = [...standardHeights, "特寸"];
  const availableWidths = [...spec.widths, "特寸"];

  const getAvailableHandleColors = () => {
    if (isFoldingOrStorage) return ["J型取手"];
    if (isSliding) return SLIDING_HANDLES;
    return HINGED_HANDLES;
  };

  const calculatePrice = (type: string, design: string, height: string, customHeight?: number) => {
    let effectiveHeight = height;
    if (height === '特寸' && customHeight) {
      if (isStorage) {
        if (customHeight <= 900) effectiveHeight = "H900";
        else if (customHeight <= 1200) effectiveHeight = "H1200";
        else if (customHeight <= 2000) effectiveHeight = "H2000";
        else if (customHeight <= 2200) effectiveHeight = "H2200";
        else effectiveHeight = "H2400";
      } else {
        if (customHeight <= 2000) effectiveHeight = "H2000";
        else if (customHeight <= 2200) effectiveHeight = "H2200";
        else effectiveHeight = "H2400";
      }
    }
    const record = PRICE_LIST.find(p => p.type === type && p.design === design && p.height === effectiveHeight);
    if (record) return record.setPrice;
    const fallbackRecord = PRICE_LIST.find(p => p.type === type && p.height === effectiveHeight);
    return fallbackRecord ? fallbackRecord.setPrice : 30000;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let updates: Partial<DoorItem> = {};

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updates = { [name]: checked };
    } else {
       updates = { [name]: value };
    }

    if (name === 'type') {
      const newSpec = DOOR_SPEC_MASTER[value];
      if (newSpec) {
        updates.design = newSpec.designs[0];
        updates.width = newSpec.widths[0];
        updates.hangingSide = newSpec.hangingSides[0];
        const nextIsFoldingOrStorage = value.includes("折戸") || value.includes("物入");
        const nextIsSliding = value.includes("引") || value.includes("引き");
        if (nextIsFoldingOrStorage) updates.handleColor = "J型取手";
        else if (nextIsSliding) updates.handleColor = SLIDING_HANDLES[0];
        else updates.handleColor = HINGED_HANDLES[0];
        const nextIsStorage = value === DoorType.StorageDouble || value === DoorType.StorageSingle;
        const nextAvailableHeights = nextIsStorage 
          ? ["H900", "H1200", "H2000", "H2200", "H2400", "特寸"] 
          : ["H2000", "H2200", "H2400", "特寸"];
        let nextHeight = door.height;
        if (!nextAvailableHeights.includes(door.height)) {
          nextHeight = nextAvailableHeights.includes(initialSettings.defaultHeight) ? initialSettings.defaultHeight : "H2000";
          updates.height = nextHeight;
        }
        updates.frameType = getFrameType(value, nextHeight === '特寸' ? 'H2400' : nextHeight);
        updates.price = calculatePrice(value, updates.design || door.design, nextHeight, door.customHeight);
      }
    } else if (name === 'height') {
      if (value === '特寸') {
        updates.customHeight = door.customHeight || 2250;
        setIsCustomSizeInfoOpen(true);
      }
      updates.frameType = getFrameType(door.type, value === '特寸' ? 'H2400' : value);
      updates.price = calculatePrice(door.type, door.design, value, updates.customHeight || door.customHeight);
    } else if (name === 'width') {
      if (value === '特寸') {
        updates.customWidth = door.customWidth || 800;
        setIsCustomSizeInfoOpen(true);
      }
    } else if (name === 'customHeight') {
      const val = Math.min(2400, parseInt(value) || 0);
      updates.customHeight = val;
      updates.price = calculatePrice(door.type, door.design, door.height, val);
    } else if (name === 'customWidth') {
      updates.customWidth = parseInt(value) || 0;
    } else if (name === 'design') {
      updates.price = calculatePrice(door.type, value, door.height, door.customHeight);
    } else if (name === 'undercutHeight') {
       updates.undercutHeight = parseInt(value) || 0;
    } else if (name === 'frameExtensionHeight') {
       updates.frameExtensionHeight = parseInt(value) || 0;
    }
    updateDoor(door.id, updates);
  };

  const handleOpenDetails = () => {
    const originalPdfUrl = getDoorDetailPdfUrl(door);
    const cleanUrl = originalPdfUrl.replace(/^https?:\/\//, '');
    const bgImageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&w=2400`;
    const wdText = `WD-${index + 1}`;
    
    // 特寸の場合の表示用HTML生成
    const widthHtml = door.width === '特寸' 
      ? `<span style="color: red;">${door.customWidth}㎜特寸</span>` 
      : `${door.width}`;
      
    const heightHtml = door.height === '特寸' 
      ? `<span style="color: red;">${door.customHeight}㎜特寸</span>` 
      : `${door.height.replace('H', '')}`;

    // 枠オプション情報の生成
    const frameOptionText = [];
    if (door.isUndercut) frameOptionText.push(`アンダーカット${door.undercutHeight}㎜`);
    if (door.isFrameExtended) frameOptionText.push(`枠伸長${door.frameExtensionHeight}㎜`);
    
    // 赤文字で枠仕様の横に追記
    const frameOptionHtml = frameOptionText.length > 0
      ? `<span style="color: red; margin-left: 0.5em; font-weight: bold;">(${frameOptionText.join(' / ')})</span>`
      : '';

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
        <title>詳細図面 - ${wdText}</title>
        <style>
          @page { size: A3 landscape; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            background: #eee;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-family: 'Noto Sans JP', sans-serif;
          }
          .page-container {
            width: 420mm;
            height: 297mm;
            position: relative;
            background-color: white;
            background-image: url('${bgImageUrl}');
            background-size: 85%;
            background-repeat: no-repeat;
            background-position: center;
            margin: 0 auto;
          }
          .overlay-header {
            position: absolute;
            top: 12mm;
            left: 10mm;
            display: flex;
            align-items: flex-start;
            gap: 2mm;
            z-index: 100;
          }
          .wd-box {
            padding: 2mm 5mm;
            font-size: 30pt;
            font-weight: bold;
            color: #1d4ed8;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 35mm;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 4px;
          }
          .details-box {
            margin-top: 5mm;
            padding: 1.5mm 3mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1mm;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          .details-row {
            display: flex;
            align-items: baseline;
            gap: 3mm;
          }
          .details-item {
            display: flex;
            align-items: baseline;
            gap: 1mm;
          }
          .details-label {
            color: #555;
            font-size: 7pt;
            white-space: nowrap;
          }
          .details-value {
            font-weight: bold;
            font-size: 10pt;
            color: #000;
            white-space: nowrap;
            line-height: 1;
          }
          .no-print-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #333;
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
            padding: 8px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          @media print {
            .no-print-bar { display: none; }
            body { background: white; }
            .page-container { margin: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span>図面プレビュー: ${wdText} (${siteName || '現場名未設定'})</span>
          <button class="print-btn" onclick="window.print()">印刷 / PDF保存</button>
        </div>
        <div class="page-container">
          <div class="overlay-header">
            <div class="wd-box">${wdText}</div>
            <div class="details-box">
              <div class="details-row">
                <div class="details-item"><span class="details-label">物件名</span><span class="details-value">${siteName || ''}</span></div>
                <div class="details-item"><span class="details-label">部屋名</span><span class="details-value">${door.roomName || ''}</span></div>
                <div class="details-item"><span class="details-label">種類</span><span class="details-value">${door.type}</span></div>
                <div class="details-item"><span class="details-label">デザイン</span><span class="details-value">${door.design}</span></div>
                <div class="details-item"><span class="details-label">サイズ</span><span class="details-value">${widthHtml}×${heightHtml}</span></div>
              </div>
              <div class="details-row">
                <div class="details-item"><span class="details-label">枠仕様</span><span class="details-value">${door.frameType}${frameOptionHtml}</span></div>
                <div class="details-item"><span class="details-label">吊元</span><span class="details-value">${door.hangingSide}</span></div>
                <div class="details-item"><span class="details-label">扉色</span><span class="details-value">${door.doorColor}</span></div>
                <div class="details-item"><span class="details-label">枠色</span><span class="details-value">${door.frameColor}</span></div>
                <div class="details-item"><span class="details-label">ハンドル</span><span class="details-value">${door.handleColor}</span></div>
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

  const getAlertStyle = (current: string, initial: string, field?: string) => {
    if (field === 'handleColor') {
      // J型取手は常に許容
      if (current === 'J型取手') return '';
      // 現在のハンドル名が初期設定の色名（セラミックホワイト等）を含んでいればOK
      if (current.includes(initial)) return '';
      // それ以外はアラート
      return 'text-red-600 font-bold border-red-300 bg-red-50';
    }
    return current !== initial ? 'text-red-600 font-bold border-red-300 bg-red-50' : '';
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-[11px]">
      <td className="p-2 font-medium text-gray-500 text-center border-r border-gray-100">WD{index + 1}</td>
      <td className="p-1">
        <input type="text" name="roomName" value={door.roomName} onChange={handleChange} className="w-full border rounded px-1 py-1 h-8" placeholder="部屋名" />
      </td>
      <td className="p-1">
        <select name="type" value={door.type} onChange={handleChange} className="w-full border rounded px-1 py-1 h-8 font-semibold text-gray-700">
          {DOOR_GROUPS.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </td>
      <td className="p-1">
        <select name="design" value={door.design} onChange={handleChange} className="w-full border rounded px-1 py-1 h-8">
          {spec.designs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </td>
      <td className="p-1">
        <div className="flex flex-col gap-1 min-w-[70px]">
          <select name="width" value={door.width} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${door.width === '特寸' ? 'text-green-600 font-bold border-green-300 bg-green-50' : ''}`}>
            {availableWidths.map(w => <option key={w} value={w}>{w === '特寸' ? '特寸' : `${w}mm`}</option>)}
          </select>
          {door.width === '特寸' && (
            <div className="flex items-center gap-1 text-green-600 font-bold">
              <input type="number" name="customWidth" value={door.customWidth} onChange={handleChange} className="w-full border border-green-200 rounded px-1 h-6 bg-white" />
              <span className="text-[10px]">㎜</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-1">
        <div className="flex flex-col gap-1 min-w-[70px]">
          <select name="height" value={door.height} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${door.height === '特寸' ? 'text-green-600 font-bold border-green-300 bg-green-50' : getAlertStyle(door.height, initialSettings.defaultHeight)}`}>
            {availableHeights.map(h => <option key={h} value={h}>{h === '特寸' ? '特寸' : h}</option>)}
          </select>
          {door.height === '特寸' && (
            <div className="flex items-center gap-1 text-green-600 font-bold">
              <input type="number" name="customHeight" value={door.customHeight} max="2400" onChange={handleChange} className="w-full border border-green-200 rounded px-1 h-6 bg-white" />
              <span className="text-[10px]">㎜</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-1 relative">
        <div className="flex items-center gap-1">
           <input type="text" name="frameType" value={door.frameType} readOnly className="w-full border rounded px-1 py-1 bg-gray-100 text-gray-600 font-medium h-8 outline-none text-[10px]" />
           <button 
             onClick={(e) => {
               e.preventDefault();
               setIsFrameOptionOpen(!isFrameOptionOpen);
             }}
             className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm ${door.isUndercut || door.isFrameExtended ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
             title="枠オプション設定"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           </button>
        </div>
        
        {/* Frame Options Modal (Fixed Position) */}
        {isFrameOptionOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left" onClick={() => setIsFrameOptionOpen(false)}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <span className="font-bold text-gray-800 text-lg">枠オプション設定</span>
                  <button onClick={() => setIsFrameOptionOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-6">
                 {/* 左側: アンダーカット */}
                 <div className="flex-1 flex flex-col gap-3 border-b sm:border-b-0 sm:border-r border-gray-100 pb-4 sm:pb-0 sm:pr-4">
                    <div className="overflow-hidden rounded border border-gray-200 shadow-sm mb-1 bg-gray-100 h-28 flex items-center justify-center">
                       <img src="http://25663cc9bda9549d.main.jp/aistudio/door/kaikou.jpg" alt="ドア下開口" className="max-h-full w-auto object-contain mix-blend-multiply" />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        name="isUndercut" 
                        checked={door.isUndercut || false} 
                        onChange={handleChange}
                        className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5" 
                      />
                      <span className="text-gray-700 font-bold text-sm">ドアを床から浮かせる</span>
                    </label>
                    <div className={`flex items-center gap-2 pl-2 transition-opacity ${door.isUndercut ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <span className="text-gray-500 text-xs font-bold">床との隙間</span>
                      <input 
                        type="number" 
                        name="undercutHeight" 
                        value={door.undercutHeight} 
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-24 text-right font-mono text-base focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-gray-500 text-sm">mm</span>
                    </div>
                 </div>

                 {/* 右側: 枠伸長 */}
                 <div className="flex-1 flex flex-col gap-3">
                    <div className="overflow-hidden rounded border border-gray-200 shadow-sm mb-1 bg-gray-100 h-28 flex items-center justify-center">
                       <img src="http://25663cc9bda9549d.main.jp/aistudio/door/wakuencho.jpg" alt="枠伸長" className="max-h-full w-auto object-contain mix-blend-multiply" />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        name="isFrameExtended" 
                        checked={door.isFrameExtended || false} 
                        onChange={handleChange}
                        className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5" 
                      />
                      <span className="text-gray-700 font-bold text-sm">ドア枠を下に伸長</span>
                    </label>
                    <div className={`flex items-center gap-2 pl-2 transition-opacity ${door.isFrameExtended ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <span className="text-gray-500 text-xs font-bold">伸長寸法</span>
                      <input 
                        type="number" 
                        name="frameExtensionHeight" 
                        value={door.frameExtensionHeight} 
                        onChange={handleChange}
                        className="border rounded px-2 py-1 w-24 text-right font-mono text-base focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-gray-500 text-sm">mm</span>
                    </div>
                 </div>
               </div>

               <div className="mt-6 flex justify-end">
                  <button onClick={() => setIsFrameOptionOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">決定</button>
               </div>
            </div>
          </div>
        )}
      </td>
      <td className="p-1">
        <select name="hangingSide" value={door.hangingSide} onChange={handleChange} className="w-full border rounded px-1 py-1 h-8">
          {spec.hangingSides.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className="p-1">
        <select name="doorColor" value={door.doorColor} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getAlertStyle(door.doorColor, initialSettings.defaultDoorColor)}`}>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-1">
        <select name="frameColor" value={door.frameColor} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getAlertStyle(door.frameColor, initialSettings.defaultDoorColor)}`}>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-1">
        <div className="flex items-center gap-1">
          <select
            name="handleColor"
            value={door.handleColor}
            onChange={handleChange}
            disabled={isFoldingOrStorage}
            className={`w-full border rounded px-1 py-1 h-8 ${getAlertStyle(door.handleColor, initialSettings.defaultHandleColor, 'handleColor')} ${isFoldingOrStorage ? 'bg-gray-50' : ''}`}
          >
            {getAvailableHandleColors().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {door.handleColor === "J型取手" && (
            <button
              onClick={(e) => { e.preventDefault(); onShowHandleImage(); }}
              className="no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm shrink-0"
              title="ハンドルの写真を表示"
            >
              i
            </button>
          )}
        </div>
      </td>
      <td className="p-1 text-right font-mono font-bold text-base pr-2 text-gray-900 border-l border-gray-100">
        {door.price.toLocaleString()}
      </td>
      <td className="p-1 text-center no-print relative">
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <button 
            onClick={(e) => { e.preventDefault(); handleOpenDetails(); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm whitespace-nowrap"
            title="詳細図面にWD番号を合成して表示・印刷"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            詳細図
          </button>
          <button onClick={() => removeDoor(door.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors shrink-0" title="行を削除">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>

        {/* 特寸注意モーダル */}
        {isCustomSizeInfoOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left" onClick={() => setIsCustomSizeInfoOpen(false)}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in cursor-default" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  特寸（オーダーサイズ）について
                </h3>
                <button onClick={() => setIsCustomSizeInfoOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-900 space-y-2">
                 <p className="font-bold">価格は切り上げた寸法が適用されます。</p>
                 <p className="text-blue-800">例：2100㎜なら2200㎜の価格</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setIsCustomSizeInfoOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
};
