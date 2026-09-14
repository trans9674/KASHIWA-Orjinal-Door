
import React, { useState, useEffect } from 'react';
import { DoorItem, DoorType, PriceRecord } from '../types';
import { DOOR_GROUPS, COLORS, SLIDING_HANDLES, HINGED_HANDLES, DOOR_SPEC_MASTER, getFrameType, resolveDoorDrawingUrl, ROOM_NAMES } from '../constants';

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

// 枠オプションの吹き出しを表示する部屋名のリスト
const BUBBLE_TRIGGER_ROOMS = ["玄関", "シューズクローク", "土間", "シューズクローゼット", "土間収納"];

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
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  
  const spec = DOOR_SPEC_MASTER[door.type] || { designs: [], widths: [], hangingSides: ["なし"] };
  const isFoldingOrStorage = door.type.includes("折戸") || door.type.includes("物入");
  const isSliding = door.type.includes("引") || door.type.includes("引き");
  const isStorage = door.type === DoorType.StorageDouble || door.type === DoorType.StorageSingle;

  // 片引戸（Sliding）を除外、片開き戸（Hinged）もユーザー指示により除外
  const canShowFrameOption = [
    DoorType.Outset,
    DoorType.OutsetIncorner,
    DoorType.Folding2,
    DoorType.Folding4W12,
    DoorType.Folding4W16
  ].includes(door.type as DoorType) && door.type !== DoorType.Sliding;

  useEffect(() => {
    if (canShowFrameOption && BUBBLE_TRIGGER_ROOMS.includes(door.roomName)) {
      setIsBubbleVisible(true);
      const timer = setTimeout(() => {
        setIsBubbleVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setIsBubbleVisible(false);
    }
  }, [door.roomName, canShowFrameOption]);

  // 片引込戸の場合、吊元を「吊元左右兼用」に強制更新
  // 折戸4枚の場合、吊元を「軸固定」に強制更新（旧データ対応）
  // 吊元が選択肢にない場合、デフォルト値に更新
  useEffect(() => {
    const currentSpec = DOOR_SPEC_MASTER[door.type];
    
    if (door.type === DoorType.Pocket && door.hangingSide !== "吊元左右兼用") {
      updateDoor(door.id, { hangingSide: "吊元左右兼用" });
    } else if ((door.type === DoorType.Folding4W12 || door.type === DoorType.Folding4W16) && door.hangingSide === "軸固定4") {
      updateDoor(door.id, { hangingSide: "軸固定" });
    } else if (currentSpec && !currentSpec.hangingSides.includes(door.hangingSide)) {
      // 選択肢に含まれていない場合（'なし'など）、先頭の有効な値に更新
      updateDoor(door.id, { hangingSide: currentSpec.hangingSides[0] });
    } else if (door.type === DoorType.Sliding3 && door.width === "3167") {
      updateDoor(door.id, { width: "3215" });
    } else if (door.type === DoorType.Folding2 && door.width === "755") {
      updateDoor(door.id, { width: "735" });
    } else if (door.type === DoorType.StorageDouble && door.width === "900") {
      updateDoor(door.id, { width: "735" });
    } else if (door.type === DoorType.StorageSingle && door.width === "600") {
      updateDoor(door.id, { width: "435" });
    } else if (door.type === DoorType.Pocket && door.width === "735") {
      updateDoor(door.id, { width: "1450" });
    }
  }, [door.type, door.hangingSide, door.width, door.id, updateDoor]);
  
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

    // 片引込戸のガラス戸の特例対応（表記ゆれ対応）
    // デザイン名に「ガラス戸」が含まれる場合、DB上の表記ゆれ（全角・半角・スペース等）を無視して
    // 「ガラス戸」を含むレコードを検索して適用する。
    // さらに、重複レコードが存在する場合（価格改定等で古いデータが残っている場合など）を考慮し、
    // 最も高い価格を採用する（通常、新しい価格の方が高いため）。
    if (type === DoorType.Pocket && searchDesign.includes("ガラス戸")) {
        const candidates = priceList.filter(p => p.type === type && p.height === effectiveHeight && p.design.includes("ガラス戸"));
        if (candidates.length > 0) {
            const maxPriceRecord = candidates.reduce((prev, current) => (prev.setPrice > current.setPrice) ? prev : current);
            return maxPriceRecord.setPrice;
        }
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
        if (nextIsFoldingOrStorage) {
          updates.handleColor = "J型取手";
        } else {
          const list = nextIsSliding ? SLIDING_HANDLES : HINGED_HANDLES;
          const matched = list.find(h => h.startsWith(initialSettings.defaultHandleColor));
          updates.handleColor = matched || list[0];
        }
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

  const getHighlightStyle = (isHighlighted: boolean) => isHighlighted ? 'color: #D32F2F; font-weight: 600;' : '';
  const getTailwindHighlight = (isHighlighted: boolean) => isHighlighted ? 'text-[#D32F2F] font-semibold bg-[#D32F2F]/[0.02] border-[#D32F2F]/20' : 'text-[#1D1D1F] border-[#E5E5E7] bg-white';

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
            background: white;
            border: 2px solid #1d4ed8;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .details-box {
            margin-top: 1mm;
            padding: 1.5mm 4mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.8mm;
            background: white;
            border: 1px solid #1d4ed8;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          <span>図面プレビュー: ${wdText} (${siteName || '現場名未設定'})</span>
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
    <tr className="border-b border-[#E5E5E7] hover:bg-black/[0.01] transition-colors text-[11px]">
      <td className="p-3 font-medium text-[#86868B] text-center border-r border-[#E5E5E7] bg-[#F5F5F7]/30">WD{index + 1}</td>
      <td className="p-1.5">
        <input 
          type="text" 
          name="roomName" 
          value={door.roomName} 
          onChange={handleChange} 
          className="w-full border border-[#E5E5E7] rounded-md px-2 py-1 h-8 text-[#1D1D1F] focus:ring-1 focus:ring-[#0071E3] outline-none transition-all bg-white" 
          placeholder="部屋名" 
          list={`room-list-${index}`}
        />
        <datalist id={`room-list-${index}`}>
          {ROOM_NAMES.map(room => (
            <option key={room} value={room} />
          ))}
        </datalist>
      </td>
      <td className="p-1.5">
        <select name="type" value={door.type} onChange={handleChange} className="w-full border border-[#E5E5E7] rounded-md px-2 py-1 h-8 font-semibold text-[#1D1D1F] focus:ring-1 focus:ring-[#0071E3] outline-none bg-white">
          {DOOR_GROUPS.map(group => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </td>
      <td className="p-1.5">
        <select name="design" value={door.design} onChange={handleChange} className={`w-full border rounded-md px-2 py-1 h-8 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${getTailwindHighlight(isDesignHighlighted)}`}>
          {spec.designs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </td>
      <td className="p-1.5">
        <div className="flex flex-col gap-1.5 min-w-[70px]">
          <select name="width" value={door.width} onChange={handleChange} className={`w-full border rounded-md px-2 py-1 h-8 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${getTailwindHighlight(isWidthHighlighted)}`}>
            {availableWidths.map(w => <option key={w} value={w}>{w === '特寸' ? '特寸' : w}</option>)}
          </select>
          {door.width === '特寸' && (
            <div className="flex items-center gap-1 text-[#D32F2F] font-semibold">
              <input type="number" name="customWidth" value={door.customWidth} onChange={handleChange} className="w-full border border-[#D32F2F]/30 rounded-md px-2 h-7 bg-white text-sm outline-none focus:ring-1 focus:ring-[#D32F2F]" />
              <span className="text-[10px]">㎜</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-1.5">
        <div className="flex flex-col gap-1.5 min-w-[70px]">
          <select name="height" value={door.height} onChange={handleChange} className={`w-full border rounded-md px-2 py-1 h-8 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${getTailwindHighlight(isHeightHighlighted)}`}>
            {availableHeights.map(h => <option key={h} value={h}>{h === '特寸' ? '特寸' : h.replace('H', '')}</option>)}
          </select>
          {door.height === '特寸' && (
            <div className="flex items-center gap-1 text-[#D32F2F] font-semibold">
              <input type="number" name="customHeight" value={door.customHeight} max="2400" onChange={handleChange} className="w-full border border-[#D32F2F]/30 rounded-md px-2 h-7 bg-white text-sm outline-none focus:ring-1 focus:ring-[#D32F2F]" />
              <span className="text-[10px]">㎜</span>
            </div>
          )}
        </div>
      </td>
      <td className="p-1.5 relative">
        <div className="flex items-center gap-2">
           <div className={`w-full border rounded-md px-2 flex flex-col justify-center overflow-hidden h-8 text-[10px] leading-[1.1] transition-all ${isFrameHighlighted ? 'bg-[#D32F2F]/[0.03] border-[#D32F2F]/20' : 'bg-[#F5F5F7] border-[#E5E5E7]'}`}>
             <span className="text-[#86868B] font-medium truncate">{door.frameType}</span>
             {door.isUndercut && <span className="text-[#D32F2F] font-bold truncate mt-0.5">アンダーカット</span>}
             {door.isFrameExtended && (
               <span className="text-[#D32F2F] font-bold truncate mt-0.5">
                 {door.domaExtensionType === 'none' ? '土間(伸なし)' :
                  door.domaExtensionType === 'frame' ? '土間(枠伸長)' : '土間(建具伸長)'}
               </span>
             )}
           </div>
           {canShowFrameOption && (
             <div className="relative shrink-0">
               {isBubbleVisible && (
                 <div className="absolute bottom-full right-[-6px] mb-2 z-20 animate-bounce pointer-events-none">
                    <div className="bg-[#1D1D1F] text-white text-[9px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap relative">
                      枠のオプション設定
                      <div className="absolute top-full right-2 border-x-4 border-x-transparent border-t-4 border-t-[#1D1D1F]"></div>
                    </div>
                 </div>
               )}
               <button 
                 onClick={(e) => {
                   e.preventDefault();
                   setIsFrameOptionOpen(!isFrameOptionOpen);
                 }}
                 className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 ${isFrameHighlighted ? 'bg-[#D32F2F] text-white' : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:bg-[#F5F5F7]'}`}
                 title="枠オプション設定"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </button>
             </div>
           )}
        </div>
        
        {isFrameOptionOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-md p-4 text-left" onClick={() => setIsFrameOptionOpen(false)}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh] border border-[#E5E5E7]" onClick={(e) => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-8 border-b border-[#E5E5E7] pb-6">
                  <div>
                    <span className="font-bold text-[#1D1D1F] text-xl tracking-tight">枠オプション設定</span>
                    <span className="text-[#86868B] text-sm ml-4 font-medium">WD{index + 1} / {door.type}</span>
                  </div>
                  <button onClick={() => setIsFrameOptionOpen(false)} className="text-[#86868B] hover:text-[#1D1D1F] rounded-full p-2 hover:bg-[#F5F5F7] transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <div className="space-y-12">
                 <section className="bg-[#F5F5F7]/50 p-8 rounded-xl border border-[#E5E5E7]">
                    <h4 className="text-base font-semibold text-[#1D1D1F] mb-6 flex items-center gap-4 tracking-tight">
                      <input 
                        type="checkbox" 
                        name="isUndercut" 
                        checked={door.isUndercut || false} 
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-[#E5E5E7] text-[#0071E3] focus:ring-[#0071E3] cursor-pointer" 
                      />
                      アンダーカット設定（ドア下開口）
                    </h4>
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start ml-9">
                       <div className="w-full md:w-64 shrink-0 overflow-hidden rounded-lg border border-[#E5E5E7] bg-white h-44 flex items-center justify-center p-2">
                          <img src="http://25663cc9bda9549d.main.jp/aistudio/door/kaikou.jpg" alt="ドア下開口" className="max-h-full w-auto object-contain mix-blend-multiply" />
                       </div>
                       <div className="flex-1 space-y-6">
                          <div className={`p-5 rounded-lg border transition-all ${door.isUndercut ? 'border-[#0071E3] bg-[#0071E3]/[0.03]' : 'border-transparent bg-white/50'}`}>
                             <div className="flex flex-col">
                               <span className="text-[#1D1D1F] font-semibold text-sm">アンダーカット仕様</span>
                               <span className="text-[#86868B] text-[11px] mt-1">ドアを床から浮かせ、通気性を確保します</span>
                             </div>
                          </div>
                          <div className={`flex items-center gap-4 pl-2 transition-all ${door.isUndercut ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <span className="text-[#1D1D1F] text-xs font-semibold whitespace-nowrap">隙間寸法</span>
                            <div className="flex items-center gap-2">
                               <input 
                                type="number" 
                                name="undercutHeight" 
                                value={door.undercutHeight} 
                                onChange={handleChange}
                                className="border border-[#E5E5E7] rounded-md px-3 py-2 w-24 text-right font-mono text-lg text-[#1D1D1F] focus:ring-1 focus:ring-[#0071E3] outline-none transition-all bg-white"
                              />
                              <span className="text-[#86868B] font-medium">mm</span>
                            </div>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section className="bg-[#F5F5F7]/50 p-8 rounded-xl border border-[#E5E5E7]">
                    <h4 className="text-base font-semibold text-[#1D1D1F] mb-6 flex items-center gap-4 tracking-tight">
                      <input 
                        type="checkbox" 
                        name="isFrameExtended" 
                        checked={door.isFrameExtended || false} 
                        onChange={handleChange} 
                        className="w-5 h-5 rounded border-[#E5E5E7] text-[#0071E3] focus:ring-[#0071E3] cursor-pointer" 
                      />
                      土間納まり設定
                    </h4>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all ml-9 ${door.isFrameExtended ? 'opacity-100 scale-100' : 'opacity-30 pointer-events-none scale-[0.98]'}`}>
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
                        className={`group relative flex flex-col bg-white rounded-xl border transition-all cursor-pointer overflow-hidden ${door.domaExtensionType === 'none' ? 'border-[#0071E3] shadow-md ring-4 ring-[#0071E3]/[0.05]' : 'border-[#E5E5E7] hover:border-[#0071E3]/50'}`}
                      >
                        <div className="h-44 bg-[#F5F5F7]/30 flex items-center justify-center p-6 border-b border-[#E5E5E7]">
                           <img src="http://25663cc9bda9549d.main.jp/aistudio/door/expand.jpg" alt="伸長なし" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-5 text-center">
                           <p className="font-semibold text-[#1D1D1F] text-sm">土間納まり（伸長なし）</p>
                           <p className="text-[10px] text-[#86868B] mt-1.5 leading-relaxed">標準サイズのままで<br/>土間として納めます</p>
                           <div className={`mt-4 mx-auto w-5 h-5 rounded-full border flex items-center justify-center transition-all ${door.domaExtensionType === 'none' ? 'border-[#0071E3] bg-[#0071E3]' : 'border-[#E5E5E7]'}`}>
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
                        className={`group relative flex flex-col bg-white rounded-xl border transition-all cursor-pointer overflow-hidden ${door.domaExtensionType === 'frame' ? 'border-[#0071E3] shadow-md ring-4 ring-[#0071E3]/[0.05]' : 'border-[#E5E5E7] hover:border-[#0071E3]/50'}`}
                      >
                        <div className="h-44 bg-[#F5F5F7]/30 flex items-center justify-center p-6 border-b border-[#E5E5E7]">
                           <img src="http://25663cc9bda9549d.main.jp/aistudio/door/expandwaku.jpg" alt="枠伸長" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-5 text-center">
                           <p className="font-semibold text-[#1D1D1F] text-sm">土間納まり（枠伸長）</p>
                           <p className="text-[10px] text-[#86868B] mt-1.5 leading-relaxed">縦枠のみを下方に伸ばし<br/>埋め込み等に対応します</p>
                           <div className="mt-4 flex items-center justify-center gap-2">
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${door.domaExtensionType === 'frame' ? 'border-[#0071E3] bg-[#0071E3]' : 'border-[#E5E5E7]'}`}>
                               {door.domaExtensionType === 'frame' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                           </div>
                           {door.domaExtensionType === 'frame' && (
                             <div className="mt-4 pt-4 border-t border-[#E5E5E7] flex items-center justify-center gap-2 animate-in slide-in-from-top-1">
                               <input 
                                 type="number" 
                                 name="frameExtensionHeight" 
                                 value={door.frameExtensionHeight} 
                                 onClick={(e) => e.stopPropagation()}
                                 onChange={handleChange} 
                                 placeholder="寸法"
                                 className="border border-[#E5E5E7] rounded-md px-2 py-1 w-24 text-right font-mono font-bold text-[#1D1D1F] focus:ring-1 focus:ring-[#0071E3] outline-none transition-all" 
                               />
                               <span className="text-[11px] font-medium text-[#86868B]">㎜</span>
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
                        className={`group relative flex flex-col bg-white rounded-xl border transition-all cursor-pointer overflow-hidden ${door.domaExtensionType === 'door' ? 'border-[#0071E3] shadow-md ring-4 ring-[#0071E3]/[0.05]' : 'border-[#E5E5E7] hover:border-[#0071E3]/50'}`}
                      >
                        <div className="h-44 bg-[#F5F5F7]/30 flex items-center justify-center p-6 border-b border-[#E5E5E7]">
                           <img src="http://25663cc9bda9549d.main.jp/aistudio/door/expanddoor.JPG" alt="建具伸長" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-5 text-center">
                           <p className="font-semibold text-[#1D1D1F] text-sm">土間納まり（建具伸長）</p>
                           <p className="text-[10px] text-[#86868B] mt-1.5 leading-relaxed">扉本体だけを下方に伸ばし<br/>段差を解消します</p>
                           <div className="mt-4 flex items-center justify-center gap-2">
                             <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${door.domaExtensionType === 'door' ? 'border-[#0071E3] bg-[#0071E3]' : 'border-[#E5E5E7]'}`}>
                               {door.domaExtensionType === 'door' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                           </div>
                           {door.domaExtensionType === 'door' && (
                             <div className="mt-4 pt-4 border-t border-[#E5E5E7] flex items-center justify-center gap-2 animate-in slide-in-from-top-1">
                               <input 
                                 type="number" 
                                 name="frameExtensionHeight" 
                                 value={door.frameExtensionHeight} 
                                 onClick={(e) => e.stopPropagation()}
                                 onChange={handleChange} 
                                 placeholder="寸法"
                                 className="border border-[#E5E5E7] rounded-md px-2 py-1 w-24 text-right font-mono font-bold text-[#1D1D1F] focus:ring-1 focus:ring-[#0071E3] outline-none transition-all" 
                               />
                               <span className="text-[11px] font-medium text-[#86868B]">㎜</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                 </section>
               </div>

               <div className="mt-12 flex justify-end">
                  <button onClick={() => setIsFrameOptionOpen(false)} className="bg-[#1D1D1F] hover:bg-black text-white px-10 py-3 rounded-md text-sm font-medium transition-all active:scale-95 shadow-sm">設定を保存して閉じる</button>
               </div>
            </div>
          </div>
        )}
      </td>
      <td className="p-1.5">
        {door.type === DoorType.Pocket ? (
          <div className="w-full border border-[#E5E5E7] rounded-md px-2 py-1 h-8 bg-[#F5F5F7] text-[#86868B] flex items-center justify-center font-medium text-[10px]">
            吊元左右兼用
          </div>
        ) : (
          <select name="hangingSide" value={door.hangingSide} onChange={handleChange} className="w-full border border-[#E5E5E7] rounded-md px-2 py-1 h-8 text-[#1D1D1F] focus:ring-1 focus:ring-[#0071E3] outline-none bg-white">
            {spec.hangingSides.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </td>
      <td className="p-1.5">
        <select name="doorColor" value={door.doorColor} onChange={handleChange} className={`w-full border rounded-md px-2 py-1 h-8 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${getTailwindHighlight(isDoorColorHighlighted)}`}>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-1.5">
        <select name="frameColor" value={door.frameColor} onChange={handleChange} className={`w-full border rounded-md px-2 py-1 h-8 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${getTailwindHighlight(isFrameColorHighlighted)}`}>
          {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="p-1.5">
        <div className="flex items-center gap-2">
          <select
            name="handleColor"
            value={door.handleColor}
            onChange={handleChange}
            disabled={isFoldingOrStorage}
            className={`w-full border rounded-md px-2 py-1 h-8 focus:ring-1 focus:ring-[#0071E3] outline-none transition-all ${getTailwindHighlight(isHandleColorHighlighted)} ${isFoldingOrStorage ? 'bg-[#F5F5F7]' : ''}`}
          >
            {getAvailableHandleColors().map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {door.handleColor === "J型取手" && (
            <button
              onClick={(e) => { e.preventDefault(); onShowHandleImage(); }}
              className="no-print bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-all shadow-sm shrink-0 active:scale-90"
              title="ハンドルの写真を表示"
            >
              i
            </button>
          )}
        </div>
      </td>
      <td className="p-1.5">
        <input
          type="text"
          name="remarks"
          value={door.remarks || ''}
          onChange={handleChange}
          className="w-full border border-[#E5E5E7] rounded-md px-2 py-1 h-8 text-[#D32F2F] text-xs font-medium focus:ring-1 focus:ring-[#0071E3] outline-none transition-all bg-white"
          placeholder="備考"
        />
      </td>
      <td className="p-1.5 text-right font-mono font-semibold text-[13px] pr-4 text-[#1D1D1F] border-l border-[#E5E5E7]">
        {door.price.toLocaleString()}
      </td>
      <td className="p-1.5 text-center no-print relative">
        <div className="flex items-center justify-center gap-3 whitespace-nowrap">
          <button 
            onClick={(e) => { e.preventDefault(); handleOpenDetails(); }}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-3 py-1.5 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm whitespace-nowrap"
            title="詳細図面にWD番号を合成して表示"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            プレビュー
          </button>
          <button onClick={() => removeDoor(door.id)} className="text-[#86868B] hover:text-[#D32F2F] p-1.5 transition-all rounded-full hover:bg-black/[0.03]" title="行を削除">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </td>
    </tr>
  );
};
