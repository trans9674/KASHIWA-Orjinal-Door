
import React, { useState } from 'react';
import { DoorItem, DoorType, PriceRecord } from '../types';
import { DOOR_GROUPS, COLORS, SLIDING_HANDLES, HINGED_HANDLES, DOOR_SPEC_MASTER, getFrameType, resolveDoorDrawingUrl } from '../constants';

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
  priceList: PriceRecord[];
}

export const DoorRow: React.FC<DoorRowProps> = ({ 
  index, 
  door, 
  updateDoor, 
  removeDoor, 
  initialSettings, 
  onShowHandleImage,
  siteName,
  priceList
}) => {
  const [isCustomSizeInfoOpen, setIsCustomSizeInfoOpen] = useState(false);
  const [isFrameOptionOpen, setIsFrameOptionOpen] = useState(false);
  
  const spec = DOOR_SPEC_MASTER[door.type] || { designs: [], widths: [], hangingSides: ["なし"] };
  const isFoldingOrStorage = door.type.includes("折戸") || door.type.includes("物入");
  const isSliding = door.type.includes("引") || door.type.includes("引き");
  const isStorage = door.type === DoorType.StorageDouble || door.type === DoorType.StorageSingle;

  const canShowFrameOption = [
    DoorType.Sliding,
    DoorType.Outset,
    DoorType.OutsetIncorner,
    DoorType.Folding2,
    DoorType.Folding4W12,
    DoorType.Folding4W16
  ].includes(door.type as DoorType);
  
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

  const calculatePrice = (type: string, design: string, height: string, customHeight?: number, options?: Partial<DoorItem>) => {
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

    let searchDesign = design;
    if (options?.isUndercut) {
      searchDesign = "アンダーカット";
    } else if (options?.isFrameExtended) {
      if (options.domaExtensionType === 'none') searchDesign = "土間納まり（伸長なし）";
      else if (options.domaExtensionType === 'frame') searchDesign = "土間納まり（枠伸長）";
      else if (options.domaExtensionType === 'door') searchDesign = "土間納まり（建具伸長）";
    }

    const record = priceList.find(p => p.type === type && p.design === searchDesign && p.height === effectiveHeight);
    if (record) return record.setPrice;
    
    const fallbackRecord = priceList.find(p => p.type === type && p.design === design && p.height === effectiveHeight);
    return fallbackRecord ? fallbackRecord.setPrice : 30000;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let updates: Partial<DoorItem> = {};

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updates = { [name]: checked };
      
      if (name === 'isUndercut' && checked) {
        updates.isFrameExtended = false;
      } else if (name === 'isFrameExtended' && checked) {
        updates.isUndercut = false;
        if (!door.domaExtensionType) updates.domaExtensionType = 'none';
      }

      const nextOptions = { ...door, ...updates };
      updates.price = calculatePrice(door.type, door.design, door.height, door.customHeight, nextOptions);
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
        updates.price = calculatePrice(value, updates.design || door.design, nextHeight, door.customHeight, door);
      }
    } else if (name === 'height') {
      if (value === '特寸') {
        updates.customHeight = door.customHeight || 2250;
        setIsCustomSizeInfoOpen(true);
      }
      updates.frameType = getFrameType(door.type, value === '特寸' ? 'H2400' : value);
      updates.price = calculatePrice(door.type, door.design, value, updates.customHeight || door.customHeight, door);
    } else if (name === 'width') {
      if (value === '特寸') {
        updates.customWidth = door.customWidth || 800;
        setIsCustomSizeInfoOpen(true);
      }
    } else if (name === 'customHeight') {
      const val = Math.min(2400, parseInt(value) || 0);
      updates.customHeight = val;
      updates.price = calculatePrice(door.type, door.design, door.height, val, door);
    } else if (name === 'customWidth') {
      updates.customWidth = parseInt(value) || 0;
    } else if (name === 'design') {
      updates.price = calculatePrice(door.type, value, door.height, door.customHeight, door);
    } else if (name === 'undercutHeight') {
       updates.undercutHeight = parseInt(value) || 0;
    } else if (name === 'frameExtensionHeight') {
       updates.frameExtensionHeight = parseInt(value) || 0;
    }
    updateDoor(door.id, updates);
  };

  const isDesignHighlighted = door.design !== "フラット";
  const isWidthHighlighted = door.width === "特寸";
  const isHeightHighlighted = door.height === "特寸" || door.height !== initialSettings.defaultHeight;
  const isFrameHighlighted = door.isUndercut || door.isFrameExtended;
  const isDoorColorHighlighted = door.doorColor !== initialSettings.defaultDoorColor;
  const isFrameColorHighlighted = door.frameColor !== initialSettings.defaultDoorColor;
  const isHandleColorHighlighted = door.handleColor !== "J型取手" && !door.handleColor.includes(initialSettings.defaultHandleColor);

  const getHighlightStyle = (isHighlighted: boolean) => isHighlighted ? 'color: #ef4444; font-weight: bold;' : '';
  const getTailwindHighlight = (isHighlighted: boolean) => isHighlighted ? 'text-red-600 font-bold bg-red-50 border-red-200' : '';

  const handleOpenDetails = () => {
    const finalUrl = resolveDoorDrawingUrl(door, priceList);
    const isPdf = finalUrl.toLowerCase().endsWith('.pdf');
    const wdText = `WD-${index + 1}`;
    
    const widthHtml = door.width === '特寸' 
      ? `<span style="color: #ef4444; font-weight: bold;">${door.customWidth}㎜特寸</span>` 
      : `${door.width}`;
      
    const heightHtml = door.height === '特寸' 
      ? `<span style="color: #ef4444; font-weight: bold;">${door.customHeight}㎜特寸</span>` 
      : `<span style="${getHighlightStyle(door.height !== initialSettings.defaultHeight)}">${door.height.replace('H', '')}</span>`;

    const frameOptionText = [];
    if (door.isUndercut) frameOptionText.push(`アンダーカット${door.undercutHeight}㎜`);
    if (door.isFrameExtended) {
      if (door.domaExtensionType === 'none') frameOptionText.push('土間(伸なし)');
      else if (door.domaExtensionType === 'frame') frameOptionText.push(`土間(枠+${door.frameExtensionHeight})`);
      else if (door.domaExtensionType === 'door') frameOptionText.push(`土間(扉+${door.frameExtensionHeight})`);
    }
    
    const frameOptionHtml = frameOptionText.length > 0
      ? `<span style="color: #ef4444; margin-left: 0.5em; font-weight: bold;">(${frameOptionText.join('/')})</span>`
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
            align-items: flex-start;
            gap: 2mm;
            z-index: 100;
          }
          .wd-box {
            padding: 1mm 4mm;
            font-size: 24pt;
            font-weight: bold;
            color: #1d4ed8;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 2px solid #1d4ed8;
            border-radius: 4px;
          }
          .details-box {
            margin-top: 1mm;
            padding: 1mm 3mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.5mm;
            background: transparent;
          }
          .details-row {
            display: flex;
            align-items: baseline;
            gap: 4mm;
          }
          .details-item {
            display: flex;
            align-items: baseline;
            gap: 1.5mm;
          }
          .details-label {
            color: #666;
            font-size: 8pt;
            white-space: nowrap;
          }
          .details-value {
            font-weight: bold;
            font-size: 10pt;
            color: #000;
            white-space: nowrap;
            line-height: 1.2;
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
          <span>図面プレビュー: ${wdText} (${siteName || '現場名未設定'}) - 表示倍率 85%</span>
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
            <div class="wd-box">${wdText}</div>
            <div class="details-box">
              <div class="details-row">
                <div class="details-item"><span class="details-label">物件名</span><span class="details-value">${siteName || ''}</span></div>
                <div class="details-item"><span class="details-label">部屋名</span><span class="details-value">${door.roomName || ''}</span></div>
                <div class="details-item"><span class="details-label">種類</span><span class="details-value">${door.type}</span></div>
                <div class="details-item"><span class="details-label">デザイン</span><span class="details-value" style="${getHighlightStyle(isDesignHighlighted)}">${door.design}</span></div>
                <div class="details-item"><span class="details-label">サイズ</span><span class="details-value">${widthHtml}×${heightHtml}</span></div>
              </div>
              <div class="details-row">
                <div class="details-item"><span class="details-label">枠仕様</span><span class="details-value">${door.frameType}${frameOptionHtml}</span></div>
                <div class="details-item"><span class="details-label">吊元</span><span class="details-value">${door.hangingSide}</span></div>
                <div class="details-item"><span class="details-label">扉色</span><span class="details-value" style="${getHighlightStyle(isDoorColorHighlighted)}">${door.doorColor}</span></div>
                <div class="details-item"><span class="details-label">枠色</span><span class="details-value" style="${getHighlightStyle(isFrameColorHighlighted)}">${door.frameColor}</span></div>
                <div class="details-item"><span class="details-label">ハンドル</span><span class="details-value" style="${getHighlightStyle(isHandleColorHighlighted)}">${door.handleColor}</span></div>
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
        <select name="design" value={door.design} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getTailwindHighlight(isDesignHighlighted)}`}>
          {spec.designs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </td>
      <td className="p-1">
        <div className="flex flex-col gap-1 min-w-[70px]">
          <select name="width" value={door.width} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getTailwindHighlight(isWidthHighlighted)}`}>
            {availableWidths.map(w => <option key={w} value={w}>{w === '特寸' ? '特寸' : `${w}mm`}</option>)}
          </select>
          {door.width === '特寸' && (
            <div className="flex items-center gap-1 text-red-600 font-bold">
              <input type="number" name="customWidth" value={door.customWidth} onChange={handleChange} className="w-full border border-red-200 rounded px-1 h-6 bg-white" />
              <span className="text-[10px]">㎜</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-1">
        <div className="flex flex-col gap-1 min-w-[70px]">
          <select name="height" value={door.height} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getTailwindHighlight(isHeightHighlighted)}`}>
            {availableHeights.map(h => <option key={h} value={h}>{h === '特寸' ? '特寸' : h}</option>)}
          </select>
          {door.height === '特寸' && (
            <div className="flex items-center gap-1 text-red-600 font-bold">
              <input type="number" name="customHeight" value={door.customHeight} max="2400" onChange={handleChange} className="w-full border border-red-200 rounded px-1 h-6 bg-white" />
              <span className="text-[10px]">㎜</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-1 relative">
        <div className="flex items-center gap-1">
           <div className={`w-full border rounded px-0.5 flex flex-col justify-center overflow-hidden h-8 bg-gray-100 text-[10px] leading-[1.0] transition-colors ${getTailwindHighlight(isFrameHighlighted)}`}>
             <span className="text-gray-600 font-medium truncate px-0.5">{door.frameType}</span>
             {door.isUndercut && <span className="text-red-600 font-bold truncate bg-white px-0.5 py-0.5 mt-0.5 rounded-[1px] border border-red-100">アンダーカット</span>}
             {door.isFrameExtended && (
               <span className="text-red-600 font-bold truncate bg-white px-0.5 py-0.5 mt-0.5 rounded-[1px] border border-red-100">
                 {door.domaExtensionType === 'none' ? '土間(伸なし)' :
                  door.domaExtensionType === 'frame' ? '土間(枠伸長)' : '土間(建具伸長)'}
               </span>
             )}
           </div>
           {canShowFrameOption && (
             <button 
               onClick={(e) => {
                 e.preventDefault();
                 setIsFrameOptionOpen(!isFrameOptionOpen);
               }}
               className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm ${isFrameHighlighted ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
               title="枠オプション設定"
             >
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
           )}
        </div>
        
        {isFrameOptionOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left" onClick={() => setIsFrameOptionOpen(false)}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-4xl w-full animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div>
                    <span className="font-bold text-gray-800 text-xl">枠オプション設定</span>
                    <span className="text-gray-400 text-sm ml-4">WD{index + 1} / {door.type}</span>
                  </div>
                  <button onClick={() => setIsFrameOptionOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <div className="space-y-10">
                 <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        name="isUndercut" 
                        checked={door.isUndercut || false} 
                        onChange={handleChange}
                        className="w-6 h-6 rounded text-red-600 focus:ring-red-500 border-2 border-gray-300 cursor-pointer" 
                      />
                      アンダーカット設定（ドア下開口）
                    </h4>
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start ml-9">
                       <div className="w-full md:w-64 shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white h-40 flex items-center justify-center">
                          <img src="http://25663cc9bda9549d.main.jp/aistudio/door/kaikou.jpg" alt="ドア下開口" className="max-h-full w-auto object-contain mix-blend-multiply" />
                       </div>
                       <div className="flex-1 space-y-4">
                          <div className={`bg-white p-4 rounded-xl border-2 transition-colors ${door.isUndercut ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'}`}>
                             <div className="flex flex-col">
                               <span className="text-gray-800 font-bold text-sm">アンダーカット仕様</span>
                               <span className="text-gray-400 text-[10px]">ドアを床から浮かせ、通気性を確保します</span>
                             </div>
                          </div>
                          <div className={`flex items-center gap-3 pl-2 transition-all ${door.isUndercut ? 'opacity-100' : 'opacity-30 pointer-events-none translate-x-2'}`}>
                            <span className="text-gray-600 text-xs font-bold whitespace-nowrap">隙間寸法</span>
                            <div className="flex items-center gap-2">
                               <input 
                                type="number" 
                                name="undercutHeight" 
                                value={door.undercutHeight} 
                                onChange={handleChange}
                                className="border-2 border-gray-200 rounded-lg px-3 py-2 w-28 text-right font-mono text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              />
                              <span className="text-gray-500 font-bold">mm</span>
                            </div>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        name="isFrameExtended" 
                        checked={door.isFrameExtended || false} 
                        onChange={handleChange} 
                        className="w-6 h-6 rounded text-red-600 focus:ring-red-500 border-2 border-gray-300 cursor-pointer" 
                      />
                      土間納まり設定
                    </h4>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all ml-9 ${door.isFrameExtended ? 'opacity-100 scale-100' : 'opacity-30 pointer-events-none scale-[0.98]'}`}>
                      <div 
                        onClick={() => {
                          if (door.isFrameExtended) {
                            const newOptions = { ...door, domaExtensionType: 'none' as const };
                            updateDoor(door.id, { 
                              domaExtensionType: 'none', 
                              price: calculatePrice(door.type, door.design, door.height, door.customHeight, newOptions) 
                            });
                          }
                        }}
                        className={`group relative flex flex-col bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${door.domaExtensionType === 'none' ? 'border-orange-500 shadow-lg ring-4 ring-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                      >
                        <div className="h-40 bg-gray-50 flex items-center justify-center p-4 border-b">
                           <img src="http://25663cc9bda9549d.main.jp/aistudio/door/expand.jpg" alt="伸長なし" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 text-center">
                           <p className="font-bold text-gray-800 text-sm">土間納まり（伸長なし）</p>
                           <p className="text-[10px] text-gray-400 mt-1 leading-tight">標準サイズのままで<br/>土間として納めます</p>
                           <div className={`mt-3 mx-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${door.domaExtensionType === 'none' ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                             {door.domaExtensionType === 'none' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                           </div>
                        </div>
                      </div>

                      <div 
                        onClick={() => {
                          if (door.isFrameExtended) {
                            const newOptions = { ...door, domaExtensionType: 'frame' as const };
                            updateDoor(door.id, { 
                              domaExtensionType: 'frame',
                              price: calculatePrice(door.type, door.design, door.height, door.customHeight, newOptions)
                            });
                          }
                        }}
                        className={`group relative flex flex-col bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${door.domaExtensionType === 'frame' ? 'border-orange-500 shadow-lg ring-4 ring-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                      >
                        <div className="h-40 bg-gray-50 flex items-center justify-center p-4 border-b">
                           <img src="http://25663cc9bda9549d.main.jp/aistudio/door/expandwaku.jpg" alt="枠伸長" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 text-center">
                           <p className="font-bold text-gray-800 text-sm">土間納まり（枠伸長）</p>
                           <p className="text-[10px] text-gray-400 mt-1 leading-tight">縦枠のみを下方に伸ばし<br/>埋め込み等に対応します</p>
                           <div className="mt-3 flex items-center justify-center gap-2">
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${door.domaExtensionType === 'frame' ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                               {door.domaExtensionType === 'frame' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                           </div>
                           {door.domaExtensionType === 'frame' && (
                             <div className="mt-3 pt-3 border-t flex items-center justify-center gap-1 animate-in slide-in-from-top-1">
                               <input 
                                 type="number" 
                                 name="frameExtensionHeight" 
                                 value={door.frameExtensionHeight} 
                                 onClick={(e) => e.stopPropagation()}
                                 onChange={handleChange} 
                                 placeholder="寸法"
                                 className="border-2 border-orange-200 rounded px-2 py-1 w-20 text-right font-mono font-bold text-orange-600 focus:border-orange-500 focus:ring-0 outline-none" 
                               />
                               <span className="text-[10px] font-bold text-gray-500">㎜</span>
                             </div>
                           )}
                        </div>
                      </div>

                      <div 
                        onClick={() => {
                          if (door.isFrameExtended) {
                            const newOptions = { ...door, domaExtensionType: 'door' as const };
                            updateDoor(door.id, { 
                              domaExtensionType: 'door',
                              price: calculatePrice(door.type, door.design, door.height, door.customHeight, newOptions)
                            });
                          }
                        }}
                        className={`group relative flex flex-col bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${door.domaExtensionType === 'door' ? 'border-orange-500 shadow-lg ring-4 ring-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                      >
                        <div className="h-40 bg-gray-50 flex items-center justify-center p-4 border-b">
                           <img src="http://25663cc9bda9549d.main.jp/aistudio/door/expanddoor.JPG" alt="建具伸長" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 text-center">
                           <p className="font-bold text-gray-800 text-sm">土間納まり（建具伸長）</p>
                           <p className="text-[10px] text-gray-400 mt-1 leading-tight">扉本体だけを下方に伸ばし<br/>段差を解消します</p>
                           <div className="mt-3 flex items-center justify-center gap-2">
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${door.domaExtensionType === 'door' ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                               {door.domaExtensionType === 'door' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                           </div>
                           {door.domaExtensionType === 'door' && (
                             <div className="mt-3 pt-3 border-t flex items-center justify-center gap-1 animate-in slide-in-from-top-1">
                               <input 
                                 type="number" 
                                 name="frameExtensionHeight" 
                                 value={door.frameExtensionHeight} 
                                 onClick={(e) => e.stopPropagation()}
                                 onChange={handleChange} 
                                 placeholder="寸法"
                                 className="border-2 border-orange-200 rounded px-2 py-1 w-20 text-right font-mono font-bold text-orange-600 focus:border-orange-500 focus:ring-0 outline-none" 
                               />
                               <span className="text-[10px] font-bold text-gray-500">㎜</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                 </section>
               </div>

               <div className="mt-10 flex justify-end">
                  <button onClick={() => setIsFrameOptionOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3.5 rounded-xl text-base font-bold transition-all shadow-xl active:scale-95">設定を保存して閉じる</button>
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
        <select name="doorColor" value={door.doorColor} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getTailwindHighlight(isDoorColorHighlighted)}`}>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-1">
        <select name="frameColor" value={door.frameColor} onChange={handleChange} className={`w-full border rounded px-1 py-1 h-8 ${getTailwindHighlight(isFrameColorHighlighted)}`}>
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
            className={`w-full border rounded px-1 py-1 h-8 ${getTailwindHighlight(isHandleColorHighlighted)} ${isFoldingOrStorage ? 'bg-gray-50' : ''}`}
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
      </td>
    </tr>
  );
};
