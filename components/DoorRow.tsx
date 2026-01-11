
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
    const { name, value } = e.target;
    let updates: Partial<DoorItem> = { [name]: value };

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
      if (value === '特寸') updates.customHeight = door.customHeight || 2250;
      updates.frameType = getFrameType(door.type, value === '特寸' ? 'H2400' : value);
      updates.price = calculatePrice(door.type, door.design, value, updates.customHeight || door.customHeight);
    } else if (name === 'width') {
      if (value === '特寸') updates.customWidth = door.customWidth || 800;
    } else if (name === 'customHeight') {
      const val = Math.min(2400, parseInt(value) || 0);
      updates.customHeight = val;
      updates.price = calculatePrice(door.type, door.design, door.height, val);
    } else if (name === 'customWidth') {
      updates.customWidth = parseInt(value) || 0;
    } else if (name === 'design') {
      updates.price = calculatePrice(door.type, value, door.height, door.customHeight);
    }
    updateDoor(door.id, updates);
  };

  const handleOpenDetails = () => {
    const originalPdfUrl = getDoorDetailPdfUrl(door);
    const cleanUrl = originalPdfUrl.replace(/^https?:\/\//, '');
    const bgImageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&output=jpg&w=2400`;
    const wdText = `WD-${index + 1}`;
    const widthVal = door.width === '特寸' ? door.customWidth : door.width;
    const heightVal = door.height === '特寸' ? door.customHeight : door.height.replace('H', '');

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
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            margin: 0 auto;
          }
          .overlay-header {
            position: absolute;
            top: 10mm;
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
            padding: 2mm 3mm;
            display: grid;
            grid-template-columns: auto auto;
            gap: 1mm 6mm;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          .details-item {
            display: flex;
            align-items: baseline;
            gap: 1.5mm;
          }
          .details-label {
            color: #444;
            font-size: 7pt;
            white-space: nowrap;
          }
          .details-value {
            font-weight: bold;
            font-size: 9pt;
            color: #000;
            line-height: 1.1;
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
              <div class="details-item"><span class="details-label">物件名</span><span class="details-value">${siteName || ''}</span></div>
              <div class="details-item"><span class="details-label">部屋名</span><span class="details-value">${door.roomName || ''}</span></div>
              
              <div class="details-item"><span class="details-label">建具種類</span><span class="details-value">${door.type}</span></div>
              <div class="details-item"><span class="details-label">デザイン</span><span class="details-value">${door.design}</span></div>
              
              <div class="details-item"><span class="details-label">幅×高さ</span><span class="details-value">${widthVal}mm × ${heightVal}mm</span></div>
              <div class="details-item"><span class="details-label">枠仕様</span><span class="details-value">${door.frameType}</span></div>
              
              <div class="details-item"><span class="details-label">吊元</span><span class="details-value">${door.hangingSide}</span></div>
              <div class="details-item"><span class="details-label">扉カラー</span><span class="details-value">${door.doorColor}</span></div>
              
              <div class="details-item"><span class="details-label">枠カラー</span><span class="details-value">${door.frameColor}</span></div>
              <div class="details-item"><span class="details-label">ハンドル</span><span class="details-value">${door.handleColor}</span></div>
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
      <td className="p-1">
        <input type="text" name="frameType" value={door.frameType} readOnly className="w-full border rounded px-1 py-1 bg-gray-100 text-gray-600 font-medium h-8 outline-none" />
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
      <td className="p-1 text-center no-print">
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
