
import React, { useState, useMemo, useCallback, useEffect } from 'react';
/* UsageLocationを追加 */
import { DoorItem, OrderState, DoorType, EntranceStorage, BaseboardItem, PriceRecord, StorageTypeRecord, ShippingFeeRecord, UsageLocation } from './types';
import { DoorRow } from './components/DoorRow';
import { EntranceStorageSection } from './components/EntranceStorageSection';
import { BusinessDatePicker } from './components/BusinessDatePicker';
import { DataViewerModal } from './components/DataViewerModal';
import { COLORS, HANDLE_COLORS, DOOR_SPEC_MASTER, getFrameType, HINGED_HANDLES, SLIDING_HANDLES, DOOR_POINTS, getStoragePoints, getBaseboardPoints, resolveDoorDrawingUrl, getStorageDetailPdfUrl } from './constants';
import { supabase } from './supabase';
import { PDFDocument, degrees } from 'pdf-lib';

const SIMPLE_HANDLE_OPTIONS = ["セラミックホワイト", "マットブラック", "サテンニッケル"];
const PB_OPTIONS = ["9.5", "12.5", "15.0"];

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Canvasを使ってオーバーレイ画像（WD番号や仕様詳細）を生成するヘルパー関数
const createDoorOverlayImage = async (door: DoorItem, index: number, siteName: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scale = 3; // 高解像度化
    // おおよそのサイズ感 (pt換算で調整: A3横=1191pt, オーバーレイ幅は約700pt程度)
    const width = 800 * scale; 
    const height = 80 * scale;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.scale(scale, scale);
    ctx.textBaseline = 'middle';
    
    // --- WD Box (左側) ---
    const wdX = 2; const wdY = 2; const wdW = 100; const wdH = 50;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wdX, wdY, wdW, wdH);
    ctx.strokeStyle = '#1d4ed8'; // Blue
    ctx.lineWidth = 2;
    ctx.strokeRect(wdX, wdY, wdW, wdH);
    
    // Text WD
    ctx.font = 'bold 24px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'center';
    ctx.fillText(`WD-${index+1}`, wdX + wdW/2, wdY + wdH/2 + 2);
    
    // --- Details Box (右側) ---
    const detX = wdX + wdW + 10; const detY = 2; const detW = 680; const detH = 60;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(detX, detY, detW, detH);
    ctx.strokeStyle = '#1d4ed8';
    ctx.strokeRect(detX, detY, detW, detH);
    
    // Text Details Helpers
    ctx.textAlign = 'left';
    const row1Y = detY + 18;
    const row2Y = detY + 44;
    
    const drawLabelValue = (x: number, y: number, label: string, value: string, color: string = '#000') => {
        ctx.font = 'normal 10px "Noto Sans JP", sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(label, x, y);
        const labelWidth = ctx.measureText(label).width;
        
        ctx.font = 'bold 12px "Noto Sans JP", sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(value, x + labelWidth + 6, y);
    };

    // Row 1
    let curX = detX + 10;
    drawLabelValue(curX, row1Y, "物件名", siteName || ''); curX += 160;
    drawLabelValue(curX, row1Y, "部屋名", door.roomName || ''); curX += 120;
    drawLabelValue(curX, row1Y, "種類", door.type); curX += 100;
    drawLabelValue(curX, row1Y, "デザイン", door.design); curX += 150;
    
    // Size logic
    const wStr = door.width === '特寸' ? `${door.customWidth}㎜特寸` : door.width;
    const hStr = door.height === '特寸' ? `${door.customHeight}㎜特寸` : door.height.replace('H','');
    const sizeColor = (door.width === '特寸' || door.height === '特寸') ? '#ef4444' : '#000';
    drawLabelValue(curX, row1Y, "サイズ", `${wStr}×${hStr}`, sizeColor);

    // Row 2
    curX = detX + 10;
    // Frame text construction
    let frameText = door.frameType;
    let frameColor = '#000';
    const opts = [];
    if(door.isUndercut) opts.push(`UC${door.undercutHeight}`);
    if(door.isFrameExtended) {
       if(door.domaExtensionType === 'none') opts.push('土間');
       else opts.push(`土間+${door.frameExtensionHeight}`);
    }
    if(opts.length > 0) {
      frameText += ` (${opts.join('/')})`;
      frameColor = '#ef4444';
    }

    drawLabelValue(curX, row2Y, "枠仕様", frameText, frameColor); curX += 200;
    drawLabelValue(curX, row2Y, "吊元", door.hangingSide); curX += 80;
    drawLabelValue(curX, row2Y, "色", `${door.doorColor}(枠:${door.frameColor})`); curX += 200;
    drawLabelValue(curX, row2Y, "ハンドル", door.handleColor);

    return canvas.toDataURL('image/png');
};

const createStorageOverlayImage = async (storage: EntranceStorage, category: string, siteName: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scale = 3;
    const width = 800 * scale; 
    const height = 80 * scale;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.scale(scale, scale);
    ctx.textBaseline = 'middle';
    
    // --- ID Box (左側) ---
    const idX = 2; const idY = 2; const idW = 80; const idH = 50;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(idX, idY, idW, idH);
    ctx.strokeStyle = '#ea580c'; // Orange
    ctx.lineWidth = 2;
    // 枠は右側のみ太線っぽく、今回は全体枠
    ctx.strokeRect(idX, idY, idW, idH);
    
    // Text ID
    ctx.font = 'bold 26px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#ea580c';
    ctx.textAlign = 'center';
    ctx.fillText("GS", idX + idW/2, idY + idH/2 + 2);
    
    // --- Details Box (右側) ---
    const detX = idX + idW + 10; const detY = 2; const detW = 500; const detH = 60;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(detX, detY, detW, detH);
    // 玄関収納は枠なし（CSSに合わせて）だが、視認性のため薄くつけるか、あるいは枠をつける
    ctx.strokeStyle = '#ea580c';
    ctx.strokeRect(detX, detY, detW, detH);

    // Text Details Helpers
    ctx.textAlign = 'left';
    const row1Y = detY + 18;
    const row2Y = detY + 44;
    
    const drawLabelValue = (x: number, y: number, label: string, value: string) => {
        ctx.font = 'normal 10px "Noto Sans JP", sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(label, x, y);
        const labelWidth = ctx.measureText(label).width;
        
        ctx.font = 'bold 12px "Noto Sans JP", sans-serif';
        ctx.fillStyle = '#000';
        ctx.fillText(value, x + labelWidth + 6, y);
    };

    // Row 1
    let curX = detX + 15;
    drawLabelValue(curX, row1Y, "物件名", siteName || ''); curX += 200;
    drawLabelValue(curX, row1Y, "種類", category);

    // Row 2
    curX = detX + 15;
    drawLabelValue(curX, row2Y, "仕様", storage.size); curX += 200;
    drawLabelValue(curX, row2Y, "色", storage.color);
    
    return canvas.toDataURL('image/png');
};


const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [priceList, setPriceList] = useState<PriceRecord[]>([]);
  const [storageTypes, setStorageTypes] = useState<StorageTypeRecord[]>([]);
  const [shippingFees, setShippingFees] = useState<ShippingFeeRecord[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isWakuModalOpen, setIsWakuModalOpen] = useState(false);
  const [isHabakiModalOpen, setIsHabakiModalOpen] = useState(false);
  const [isCornerHabakiModalOpen, setIsCornerHabakiModalOpen] = useState(false);
  const [isHandleModalOpen, setIsHandleModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  const [isOrderFlowModalOpen, setIsOrderFlowModalOpen] = useState(false);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [isEstimateSaved, setIsEstimateSaved] = useState(false);
  const [isPbModalOpen, setIsPbModalOpen] = useState(false);
  const [isDataViewerOpen, setIsDataViewerOpen] = useState(false);
  
  const [isStorageGuideOpen, setIsStorageGuideOpen] = useState(true);
  const [isBaseboardGuideOpen, setIsBaseboardGuideOpen] = useState(true);

  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<{
    errors: string[],
    warnings: string[]
  }>({ errors: [], warnings: [] });

  const [initialSettings, setInitialSettings] = useState({
    company: '',
    siteName: '',
    contactName: '',
    phone: '',
    defaultHeight: 'H2200',
    defaultDoorColor: COLORS[0],
    defaultHandleColor: SIMPLE_HANDLE_OPTIONS[0],
    defaultBaseboardColor: COLORS[0],
  });

  const [order, setOrder] = useState<OrderState>({
    customerInfo: {
      company: '',
      address: '',
      siteName: '',
      contactName: '',
      phone: '',
      deliveryDate1: '',
      deliveryDate2: '',
      delivery1Selection: { baseboard: false, storage: false },
      delivery2Selection: { baseboard: false, storage: false },
      ceilingPB: '12.5',
    },
    doors: [],
    storage: {
      type: 'NONE',
      size: 'なし',
      color: COLORS[0],
      basePrice: 0,
      baseRing: 'なし',
      baseRingPrice: 0,
      filler: 'なし',
      fillerPrice: 0,
      fillerCount: 0,
      mirror: 'なし',
      mirrorPrice: 0,
    },
    baseboards: [
      { product: 'スリム巾木(t5.5×H23×L3960)', color: COLORS[0], unitPrice: 900, quantity: 0, unit: '本' },
      { product: 'スリムコーナー巾木', color: COLORS[0], unitPrice: 500, quantity: 0, unit: '個' },
    ],
    shipping: 0,
    memo: '',
  });

  const [addressPart, setAddressPart] = useState({
    prefecture: '',
    detail: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: doorsData, error: doorsError } = await supabase.from('internal_doors').select('*');
        if (doorsError) throw doorsError;
        const mappedDoors: PriceRecord[] = (doorsData || []).map(d => ({
          id: d.id,
          type: d.type,
          location: d.location as UsageLocation,
          design: d.design,
          notes: '',
          height: d.height,
          framePrice: d.frame_price,
          doorPrice: d.door_price,
          setPrice: d.set_price,
          imageUrl: d.image_url
        }));
        setPriceList(mappedDoors);

        const { data: storageData, error: storageError } = await supabase.from('entrance_storages').select('*');
        if (storageError) throw storageError;
        const mappedStorage: StorageTypeRecord[] = (storageData || []).map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          width: s.width,
          price: s.price,
          imageUrl: s.image_url
        }));
        if (!mappedStorage.find(s => s.id === 'NONE')) {
          mappedStorage.unshift({ id: "NONE", name: "なし", category: "なし", width: 0, price: 0 });
        }
        setStorageTypes(mappedStorage);

        const { data: shippingData, error: shippingError } = await supabase.from('shipping_fees').select('*').order('id');
        if (shippingError) throw shippingError;
        setShippingFees(shippingData as ShippingFeeRecord[]);

      } catch (error) {
        console.error('Error fetching data:', error);
        alert('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (shippingFees.length === 0) return;
    const address = order.customerInfo.address;
    let matchedFee = 0;
    let longestMatch = -1;
    
    shippingFees.forEach(fee => {
        if (address.startsWith(fee.prefecture)) {
            if (fee.prefecture.length > longestMatch) {
                longestMatch = fee.prefecture.length;
                matchedFee = fee.price;
            }
        }
    });
    
    setOrder(prev => {
        if (prev.shipping === matchedFee) return prev;
        return { ...prev, shipping: matchedFee };
    });
  }, [shippingFees, order.customerInfo.address]);

  const resolveHandleName = (simpleName: string, doorType: string) => {
    if (doorType.includes("折戸") || doorType.includes("物入")) return "J型取手";
    const isSliding = doorType.includes("引") || doorType.includes("引き");
    const list = isSliding ? SLIDING_HANDLES : HINGED_HANDLES;
    return list.find(h => h.includes(simpleName)) || list[0];
  };

  const handleStart = () => {
    const defaultType = DoorType.Hinged;
    const defaultSpec = DOOR_SPEC_MASTER[defaultType];
    const defaultDesign = defaultSpec.designs[0]; 
    const initialPrice = priceList.find(p => p.type === defaultType && p.height === initialSettings.defaultHeight && p.design === defaultDesign)?.setPrice || 27300;

    setOrder(prev => ({
      ...prev,
      customerInfo: { 
        ...prev.customerInfo, 
        company: initialSettings.company, 
        siteName: initialSettings.siteName, 
        contactName: initialSettings.contactName,
        phone: initialSettings.phone
      },
      storage: { ...prev.storage, color: initialSettings.defaultDoorColor },
      baseboards: prev.baseboards.map(b => ({ ...b, color: initialSettings.defaultBaseboardColor })),
      doors: [{
        id: generateId(),
        roomName: '',
        type: defaultType,
        design: defaultDesign,
        width: '778',
        height: initialSettings.defaultHeight,
        frameType: getFrameType(defaultType, initialSettings.defaultHeight),
        hangingSide: '右吊元(R)',
        doorColor: initialSettings.defaultDoorColor,
        frameColor: initialSettings.defaultDoorColor,
        handleColor: resolveHandleName(initialSettings.defaultHandleColor, defaultType),
        specialNotes: '',
        price: initialPrice,
        isUndercut: false,
        undercutHeight: 120,
        isFrameExtended: false,
        frameExtensionHeight: 130,
      }]
    }));
    setIsModalOpen(false);
  };

  const addDoorRow = () => {
    const defaultType = DoorType.Hinged;
    const defaultSpec = DOOR_SPEC_MASTER[defaultType];
    const defaultDesign = defaultSpec.designs[0];
    const initialPrice = priceList.find(p => p.type === defaultType && p.height === initialSettings.defaultHeight && p.design === defaultDesign)?.setPrice || 27300;
    
    setOrder(prev => ({
      ...prev,
      doors: [...prev.doors, {
        id: generateId(),
        roomName: '',
        type: defaultType,
        design: defaultDesign,
        width: '778', 
        height: initialSettings.defaultHeight,
        frameType: getFrameType(defaultType, initialSettings.defaultHeight),
        hangingSide: 'なし',
        doorColor: initialSettings.defaultDoorColor,
        frameColor: initialSettings.defaultDoorColor,
        handleColor: resolveHandleName(initialSettings.defaultHandleColor, defaultType),
        specialNotes: '',
        price: initialPrice,
        isUndercut: false,
        undercutHeight: 120,
        isFrameExtended: false,
        frameExtensionHeight: 130,
      }]
    }));
  };

  const updateDoor = useCallback((id: string, updates: Partial<DoorItem>) => {
    setOrder(prev => ({ ...prev, doors: prev.doors.map(d => d.id === id ? { ...d, ...updates } : d) }));
  }, []);

  const removeDoor = useCallback((id: string) => {
    if (window.confirm('このWD行を削除してもよろしいですか？')) {
      setOrder(prev => ({ ...prev, doors: prev.doors.filter(d => d.id !== id) }));
    }
  }, []);

  const handlePrefectureChange = (pref: string) => {
    setAddressPart(prev => {
      const newState = { ...prev, prefecture: pref };
      setOrder(o => ({ ...o, customerInfo: { ...o.customerInfo, address: `${newState.prefecture}${newState.detail}` } }));
      return newState;
    });
  };

  const handleAddressDetailChange = (detail: string) => {
    setAddressPart(prev => {
      const newState = { ...prev, detail };
      setOrder(o => ({ ...o, customerInfo: { ...o.customerInfo, address: `${newState.prefecture}${newState.detail}` } }));
      return newState;
    });
  };

  const handleUpdateShipping = (id: number, newPrice: number) => {
    setShippingFees(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
  };

  const handleDeliveryItemChange = (dateNum: 1 | 2, item: 'baseboard' | 'storage', checked: boolean) => {
    setOrder(prev => {
      const newInfo = { ...prev.customerInfo };
      if (dateNum === 1) {
        newInfo.delivery1Selection = { ...newInfo.delivery1Selection, [item]: checked };
        if (checked) {
          newInfo.delivery2Selection = { ...newInfo.delivery2Selection, [item]: false };
        }
      } else {
        newInfo.delivery2Selection = { ...newInfo.delivery2Selection, [item]: checked };
        if (checked) {
          newInfo.delivery1Selection = { ...newInfo.delivery1Selection, [item]: false };
        }
      }
      return { ...prev, customerInfo: newInfo };
    });
  };

  const totals = useMemo(() => {
    const doorPoints = order.doors.reduce((sum, d) => sum + (DOOR_POINTS[d.type] || 0), 0);
    const storagePoints = getStoragePoints(order.storage.type);
    const totalBaseboardQty = order.baseboards.reduce((sum, b) => b.unit === '本' ? sum + b.quantity : sum, 0);
    const baseboardPoints = getBaseboardPoints(totalBaseboardQty);
    
    const totalPoints = doorPoints + storagePoints + baseboardPoints;
    
    const baseShipping = order.shipping;
    const finalShipping = totalPoints >= 10 ? baseShipping : Math.floor(baseShipping * (totalPoints / 10));

    const doorSubtotal = order.doors.reduce((sum, d) => sum + d.price, 0);
    const storageSubtotal = order.storage.type === 'NONE' ? 0 : order.storage.basePrice + order.storage.baseRingPrice + (order.storage.fillerPrice * order.storage.fillerCount) + order.storage.mirrorPrice;
    const baseboardSubtotal = order.baseboards.reduce((sum, b) => sum + (b.unitPrice * b.quantity), 0);
    
    const subtotal = doorSubtotal + storageSubtotal + baseboardSubtotal + finalShipping;
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;
    
    return { 
      doorSubtotal, 
      storageSubtotal, 
      baseboardSubtotal, 
      subtotal, 
      tax, 
      total, 
      totalPoints, 
      finalShipping,
      isShippingDiscounted: totalPoints > 0 && totalPoints < 10
    };
  }, [order]);

  const hasStorage = useMemo(() => order.storage.type !== 'NONE', [order.storage.type]);
  const hasBaseboard = useMemo(() => order.baseboards.reduce((sum, b) => sum + b.quantity, 0) > 0, [order.baseboards]);

  const isStorageDateSelected = order.customerInfo.delivery1Selection.storage || order.customerInfo.delivery2Selection.storage;
  const isBaseboardDateSelected = order.customerInfo.delivery1Selection.baseboard || order.customerInfo.delivery2Selection.baseboard;

  const showStorageBubble = hasStorage && !isStorageDateSelected && isStorageGuideOpen;
  const showBaseboardBubble = hasBaseboard && !isBaseboardDateSelected && isBaseboardGuideOpen;

  const validateOrder = () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const basicFields = [
      { key: 'company', label: '会社名' },
      { key: 'siteName', label: '現場名' },
      { key: 'contactName', label: 'ご担当者名' },
      { key: 'address', label: '納品先住所' },
    ];
    basicFields.forEach(f => { if (!order.customerInfo[f.key as keyof typeof order.customerInfo]) errors.push(`${f.label}が入力されていません。`); });

    if (!order.customerInfo.deliveryDate1 && !order.customerInfo.deliveryDate2) {
      errors.push('納品希望日が入力されていません。');
    }
    
    if (hasBaseboard && !order.customerInfo.delivery1Selection.baseboard && !order.customerInfo.delivery2Selection.baseboard) {
      errors.push('巾木の納品希望日（①または②）が選択されていません。');
      setIsBaseboardGuideOpen(true);
    }
    if (hasStorage && !order.customerInfo.delivery1Selection.storage && !order.customerInfo.delivery2Selection.storage) {
      errors.push('玄関収納の納品希望日（①または②）が選択されていません。');
      setIsStorageGuideOpen(true);
    }

    if (order.shipping === 0) {
      errors.push('送料が計算できません。納品先住所（都道府県）を確認してください。');
    }

    if (order.doors.length === 0 && order.storage.type === 'NONE') errors.push('商品を選択してください。');
    
    return { errors, warnings };
  };

  const handleOpenEstimate = () => {
    const { errors, warnings } = validateOrder();
    if (errors.length > 0 || warnings.length > 0) {
      setValidationData({ errors, warnings });
      setIsValidationModalOpen(true);
      return;
    }
    setIsEstimateModalOpen(true);
  };

  /**
   * 詳細図面を一括でPDF化して出力するハンドラ
   */
  const handleBatchExport = async () => {
    const { errors } = validateOrder();
    if (errors.length > 0) {
      setValidationData({ errors, warnings: [] });
      setIsValidationModalOpen(true);
      return;
    }
    
    setLoading(true);

    try {
      const doc = await PDFDocument.create();
      
      // 内部建具のページ生成
      for (let i = 0; i < order.doors.length; i++) {
        const door = order.doors[i];
        const url = resolveDoorDrawingUrl(door, priceList);
        
        // 1. 図面ファイルの取得
        const res = await fetch(url);
        if (!res.ok) throw new Error(`図面の取得に失敗しました: ${url}`);
        const buffer = await res.arrayBuffer();
        
        const isPdf = url.toLowerCase().endsWith('.pdf');
        
        // 2. オーバーレイ画像の生成
        const overlayDataUrl = await createDoorOverlayImage(door, i, order.customerInfo.siteName);
        const overlayImage = await doc.embedPng(overlayDataUrl);
        
        // 3. ページ作成 (A3 Landscape: 420mm x 297mm -> approx 1190.55 x 841.89 points)
        const pageWidth = 1190.55;
        const pageHeight = 841.89;
        
        let page;

        if (isPdf) {
           const externalPdf = await PDFDocument.load(buffer);
           const [embeddedPage] = await doc.embedPdf(externalPdf, [0]); // 最初のページのみ
           page = doc.addPage([pageWidth, pageHeight]);
           
           // PDFを中心に合わせて描画（スケーリング調整）
           const { width: srcW, height: srcH } = embeddedPage.scale(1.0);
           // A3 Landscapeにフィットさせるスケール計算
           const scale = Math.min(pageWidth / srcW, pageHeight / srcH);
           
           page.drawPage(embeddedPage, {
             x: (pageWidth - srcW * scale) / 2,
             y: (pageHeight - srcH * scale) / 2,
             width: srcW * scale,
             height: srcH * scale
           });
        } else {
           // 画像の場合
           let embeddedImage;
           const contentType = res.headers.get('content-type');
           if (contentType && contentType.includes('png')) {
               embeddedImage = await doc.embedPng(buffer);
           } else {
               embeddedImage = await doc.embedJpg(buffer);
           }
           
           page = doc.addPage([pageWidth, pageHeight]);
           const { width: imgW, height: imgH } = embeddedImage.scale(1.0);
           // アスペクト比維持で最大化
           const scale = Math.min(pageWidth / imgW, pageHeight / imgH);
           
           page.drawImage(embeddedImage, {
             x: (pageWidth - imgW * scale) / 2,
             y: (pageHeight - imgH * scale) / 2,
             width: imgW * scale,
             height: imgH * scale
           });
        }
        
        // 4. オーバーレイ情報の描画
        const overlayScale = 0.25; // Canvas解像度が高いため縮小
        const overlayW = overlayImage.width * overlayScale;
        const overlayH = overlayImage.height * overlayScale;
        const xPos = 76; // 27mm
        const yPos = pageHeight - 28 - overlayH; // top 10mm
        
        page.drawImage(overlayImage, {
          x: xPos,
          y: yPos,
          width: overlayW,
          height: overlayH
        });
      }

      // 玄関収納のページ生成
      if (order.storage.type !== 'NONE') {
         const storageRecord = storageTypes.find(s => s.id === order.storage.type);
         const finalUrl = (storageRecord && storageRecord.imageUrl) ? storageRecord.imageUrl : getStorageDetailPdfUrl(order.storage.type);
         
         const res = await fetch(finalUrl);
         if (!res.ok) throw new Error(`図面の取得に失敗しました: ${finalUrl}`);
         const buffer = await res.arrayBuffer();
         const isPdf = finalUrl.toLowerCase().endsWith('.pdf');
         const category = storageRecord?.category || '玄関収納';

         // オーバーレイ生成
         const overlayDataUrl = await createStorageOverlayImage(order.storage, category, order.customerInfo.siteName);
         const overlayImage = await doc.embedPng(overlayDataUrl);

         const pageWidth = 1190.55;
         const pageHeight = 841.89;
         let page;

         // 玄関収納は時計回りに90度回転させて表示（縦長図面を横長用紙に合わせるため）
         if (isPdf) {
            const externalPdf = await PDFDocument.load(buffer);
            const [embeddedPage] = await doc.embedPdf(externalPdf, [0]);
            page = doc.addPage([pageWidth, pageHeight]);
            
            const { width: srcW, height: srcH } = embeddedPage.scale(1.0);
            
            // 90度回転（時計回り）させてフィットさせるため、WとHを入れ替えてスケール計算
            const scale = Math.min(pageWidth / srcH, pageHeight / srcW);
            
            const destW = srcH * scale; // 回転後の幅
            const destH = srcW * scale; // 回転後の高さ
            const targetX = (pageWidth - destW) / 2;
            const targetY = (pageHeight - destH) / 2;

            page.drawPage(embeddedPage, {
              x: targetX,
              y: targetY + destH, // 時計回り90度(-90度)の場合、左下起点が回転後の左上にくるためY補正
              width: srcW * scale,
              height: srcH * scale,
              rotate: degrees(-90)
            });
         } else {
            let embeddedImage;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('png')) {
                embeddedImage = await doc.embedPng(buffer);
            } else {
                embeddedImage = await doc.embedJpg(buffer);
            }
            page = doc.addPage([pageWidth, pageHeight]);
            const { width: imgW, height: imgH } = embeddedImage.scale(1.0);
            
            const scale = Math.min(pageWidth / imgH, pageHeight / imgW);
            
            const destW = imgH * scale;
            const destH = imgW * scale;
            const targetX = (pageWidth - destW) / 2;
            const targetY = (pageHeight - destH) / 2;

            page.drawImage(embeddedImage, {
              x: targetX,
              y: targetY + destH,
              width: imgW * scale,
              height: imgH * scale,
              rotate: degrees(-90)
            });
         }
         
         const overlayScale = 0.25;
         const overlayW = overlayImage.width * overlayScale;
         const overlayH = overlayImage.height * overlayScale;
         const xPos = 76;
         const yPos = pageHeight - 28 - overlayH;
         
         page.drawImage(overlayImage, {
           x: xPos,
           y: yPos,
           width: overlayW,
           height: overlayH
         });
      }

      // PDF保存と表示
      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');

    } catch (e: any) {
      console.error(e);
      alert('PDF作成中にエラーが発生しました。\n・ネットワーク接続を確認してください。\n・サーバーのCORS設定が原因で図面が取得できない可能性があります。\nエラー詳細: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchMail = () => {
    const subject = "注文書送付依頼書";
    const body = `柏木工株式会社
担当：滝下 様

お世話になっております。
以下の案件について、注文書の作成をお願いいたします。

■お客様情報
会社名：${order.customerInfo.company}
担当者名：${order.customerInfo.contactName}
現場名：${order.customerInfo.siteName}
連絡先：${order.customerInfo.phone}

■備考
${order.memo}

---
※重要※
この後、下記3点のファイルを必ず添付して送信してください。
1. 見積書PDF (先ほどダウンロードしたもの)
2. 現地案内図
3. 平面図
---
`;
    
    const mailtoUrl = `mailto:takishita@kashiwa-f.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setIsMailModalOpen(false);
  };

  const handleCeilingPbChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setOrder(p => ({ ...p, customerInfo: { ...p.customerInfo, ceilingPB: value } }));
    if (value === '15.0') {
      setIsPbModalOpen(true);
    }
  };

  const handlePrintPdf = () => { window.print(); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-['Noto_Sans_JP']">
      
      {isDataViewerOpen && (
        <DataViewerModal 
          onClose={() => setIsDataViewerOpen(false)} 
          priceList={priceList}
          storageTypes={storageTypes}
          shippingFees={shippingFees}
          onUpdateShipping={handleUpdateShipping}
          setPriceList={setPriceList}
          setStorageTypes={setStorageTypes}
        />
      )}

      {/* バリデーションエラーモーダル */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setIsValidationModalOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 px-6 py-4 text-white font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                入力内容の確認が必要です
              </div>
              <button onClick={() => setIsValidationModalOpen(false)} className="hover:rotate-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              {validationData.errors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-red-600 font-black text-sm flex items-center gap-2 border-b-2 border-red-50 pb-2 uppercase tracking-wider">
                    <span className="bg-red-100 px-2 py-0.5 rounded text-[10px]">Must</span>
                    修正が必要な項目 ({validationData.errors.length})
                  </h4>
                  <ul className="space-y-2">
                    {validationData.errors.map((error, idx) => (
                      <li key={idx} className="flex gap-3 text-sm font-bold text-gray-700 leading-relaxed group">
                        <span className="text-red-500 mt-0.5 shrink-0 group-hover:scale-125 transition-transform">●</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-full p-1 shrink-0 mt-0.5">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                  納品日の不備については、日付選択欄に詳細な案内（吹き出し）が表示されています。
                </p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <button onClick={() => setIsValidationModalOpen(false)} className="bg-gray-800 hover:bg-black text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                閉じて修正する
              </button>
            </div>
          </div>
        </div>
      )}

      {isMailModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsMailModalOpen(false)}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>
                </div>
                メール送信の準備
              </h3>
               <button onClick={() => setIsMailModalOpen(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                  <p className="font-bold text-orange-800 text-sm">重要：メールを起動する前に、必ず「PDF保存」ボタンから見積書を保存してください。</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">添付ファイル準備リスト</h4>
                <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100">
                    <input type="checkbox" checked={isEstimateSaved} onChange={(e) => setIsEstimateSaved(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    <span className={`font-medium ${isEstimateSaved ? 'text-gray-800' : 'text-gray-400'}`}>1. 見積書PDFを保存しました</span>
                  </label>
                  <div className="flex items-center gap-3 p-2">
                     <div className="w-5 h-5 flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 16 16"><path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/></svg></div>
                     <span className="font-medium text-gray-400">2. 現地案内図</span>
                  </div>
                   <div className="flex items-center gap-3 p-2">
                     <div className="w-5 h-5 flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 16 16"><path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/></svg></div>
                     <span className="font-medium text-gray-400">3. 平面図</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t flex justify-end gap-3">
              <button 
                onClick={() => setIsMailModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={handleLaunchMail}
                disabled={!isEstimateSaved}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-200 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                メールアプリを起動
              </button>
            </div>
          </div>
        </div>
      )}

      {isOrderFlowModalOpen && (
        <div className="fixed inset-0 z-[150] bg-gray-600/90 backdrop-blur-md overflow-y-auto no-print animate-in fade-in duration-300 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full p-10 relative animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
             <button onClick={() => setIsOrderFlowModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 rounded-full p-2 hover:bg-gray-100 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                  <h3 className="text-3xl font-bold text-gray-800 border-b-2 border-gray-100 pb-4">ご注文フロー確認</h3>
                   <div className="bg-white rounded-2xl border-2 border-blue-100 overflow-hidden shadow-sm">
                    <h5 className="text-blue-800 font-bold p-5 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      商品に関するお問い合わせ
                    </h5>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 font-bold mb-1">担当者</p>
                        <p className="text-xl font-black text-gray-800">柏木工株式会社　滝下</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-gray-500 font-['Inter'] text-xs font-bold">TEL</span>
                          <span className="font-mono font-bold text-lg text-gray-800">090-3307-6294</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="text-gray-500 font-['Inter'] text-xs font-bold">Email</span>
                          <span className="font-mono text-blue-600 font-bold break-all text-sm">takishita@kashiwa-f.com</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100 text-orange-900 text-sm leading-relaxed">
                    <p className="font-bold mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ご注意
                    </p>
                    <p>正式発注後の変更・キャンセルは原則お受けできません。仕様や寸法は十分にご確認ください。</p>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-gray-900 p-8 rounded-3xl shadow-xl text-white h-full">
                    <h5 className="text-indigo-400 font-bold mb-8 text-xl border-b border-gray-800 pb-4 flex items-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18l-6-6m0 0l6-6m-6 6h18" /></svg>
                      ご注文から納品までの流れ
                    </h5>
                    <div className="space-y-0 relative">
                      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-700"></div>
                      {[
                        { step: 1, title: "見積書の入力", desc: "アプリ上で仕様を入力し、見積書PDFを作成・保存します。", color: "bg-indigo-500", ring: "ring-indigo-900" },
                        { step: 2, title: "注文書送付依頼を送る", desc: "「注文書送付依頼」ボタンからメールを起動し、見積書PDFと平面図を添付して送信します。", color: "bg-indigo-500", ring: "ring-indigo-900" },
                        { step: 3, title: "見積り確認・図面確認（柏木工側）", desc: "お送りいただいた内容を確認し、詳細図面を作成します。", color: "bg-gray-600", ring: "ring-gray-800" },
                        { step: 4, title: "正式な注文書を送付いたします", desc: "柏木工より, 図面と正式な注文書をお送りいたします。", color: "bg-gray-600", ring: "ring-gray-800" },
                        { step: 5, title: "注文書返信により正式発注", desc: "内容をご確認の上、注文書にご捺印いただきご返信ください。この時点で発注確定となります。", color: "bg-orange-500", ring: "ring-orange-900" },
                        { step: 6, title: "製作開始", desc: "製作期間（中2週間〜）のカウントを開始します。", color: "bg-blue-600", ring: "ring-blue-900" },
                        { step: 7, title: "1次納品（枠・巾木）", desc: "現場の進捗に合わせ、枠類を先行納品します。", color: "bg-emerald-500", ring: "ring-emerald-900" },
                        { step: 8, title: "2次納品（ドア本体）", desc: "ドア本体を順次納品し、完了となります。", color: "bg-emerald-500", ring: "ring-emerald-900" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-6 relative z-10 pb-8 last:pb-0 group">
                          <div className={`${item.color} ${item.ring} ring-4 w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-black shadow-lg text-sm z-10 transition-transform group-hover:scale-110`}>
                            {item.step}
                          </div>
                          <div className="flex flex-col pt-1.5 pb-2">
                            <p className="text-lg font-bold leading-none mb-2">{item.title}</p>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
             
             <div className="flex justify-center mt-8">
               <button onClick={() => setIsOrderFlowModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-12 py-4 rounded-xl font-bold transition-colors text-lg shadow-sm">
                 閉じる
               </button>
             </div>
          </div>
        </div>
      )}

      {isEstimateModalOpen && (
        <div className="fixed inset-0 z-[150] bg-gray-600/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300 print:absolute print:inset-0 print:bg-white print:h-auto print:w-full print:z-[200] print:overflow-visible">
           <div className="min-h-screen py-6 px-4 flex flex-col items-center print:block print:h-auto print:p-0">
            <div className="max-w-[1000px] w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 gap-4 no-print">
              <button onClick={() => setIsEstimateModalOpen(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold group">
                <div className="bg-gray-100 p-2 rounded-full group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                戻って修正
              </button>
              <div className="flex flex-wrap justify-center items-center gap-3">
                <button onClick={handlePrintPdf} className="bg-gray-800 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  PDF保存
                </button>
                <button onClick={() => { setIsMailModalOpen(true); setIsEstimateSaved(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>
                  注文書送付依頼
                </button>
              </div>
            </div>

            <div className="flex justify-center w-full max-w-[1000px] print:block print:w-full print:max-w-none">
              <div className="flex-grow w-full flex justify-center print:block">
                <div className="bg-white p-[10mm] shadow-2xl rounded-sm text-gray-900 w-full max-w-[210mm] min-h-[297mm] flex flex-col relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 box-border">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 mr-4">
                      <h2 className="text-4xl font-bold border-b-4 border-gray-800 pb-2 mb-4 font-['Inter'] tracking-tight">御見積書</h2>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-baseline gap-4">
                            <p className="text-xl font-bold underline underline-offset-4">{order.customerInfo.company} 御中</p>
                            {order.customerInfo.contactName && (
                              <p className="text-lg font-bold underline underline-offset-4">{order.customerInfo.contactName} 様</p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-6 text-sm">
                            <p>現場名：{order.customerInfo.siteName}</p>
                            <p>連絡先：{order.customerInfo.phone}</p>
                            <p className={`font-bold ${order.customerInfo.ceilingPB === '15.0' ? 'text-red-600' : 'text-gray-700'}`}>天井PB厚：{order.customerInfo.ceilingPB}mm</p>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm leading-tight">
                          <p className="flex items-center gap-2">
                            <span className="font-bold">納品希望日①</span> 
                            <span>{order.customerInfo.deliveryDate1 || '未指定'}</span>
                            <span className="text-xs text-gray-600">（ドア枠
                              {order.customerInfo.delivery1Selection.baseboard ? '・巾木' : ''}
                              {order.customerInfo.delivery1Selection.storage ? '・玄関収納' : ''}
                              ）</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-bold">納品希望日②</span> 
                            <span>{order.customerInfo.deliveryDate2 || '未指定'}</span>
                            <span className="text-xs text-gray-600">（ドア本体
                              {order.customerInfo.delivery2Selection.baseboard ? '・巾木' : ''}
                              {order.customerInfo.delivery2Selection.storage ? '・玄関収納' : ''}
                              ）</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-sm text-gray-500 mb-2 font-['Inter']">発行日：{new Date().toLocaleDateString('ja-JP')}</p>
                      <p className="font-bold text-lg">柏木工株式会社</p>
                      <p className="text-sm">担当：滝下</p>
                      <p className="text-sm mt-2 font-['Inter']">TEL: 090-3307-6294</p>
                    </div>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-xl mb-6 flex justify-between items-baseline">
                    <span className="text-lg font-bold">御見積合計（税込）</span>
                    <span className="text-xl font-black font-['Inter']">¥{totals.total.toLocaleString()}</span>
                  </div>

                  <div className="mb-4 flex-grow">
                    <h4 className="font-bold border-b border-gray-300 pb-1 mb-2 text-gray-700 uppercase tracking-widest text-xs">内訳明細</h4>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-800">
                          <th className="py-2 text-left w-8">No.</th>
                          <th className="py-2 text-left">品名・仕様</th>
                          <th className="py-2 text-center w-14">数量</th>
                          <th className="py-2 text-left w-16">単価</th>
                          <th className="py-2 text-right w-20">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.doors.map((door, idx) => {
                          const isDesignRed = door.design !== 'フラット';
                          const isSizeRed = door.width === '特寸' || door.height === '特寸';
                          const isDoorColorRed = door.doorColor !== initialSettings.defaultDoorColor;
                          const isFrameColorRed = door.frameColor !== initialSettings.defaultDoorColor;
                          const isFrameOptionRed = door.isUndercut || door.isFrameExtended;

                          return (
                            <React.Fragment key={door.id}>
                              <tr className="border-b border-gray-200">
                                  <td className="py-1.5 align-top font-medium text-gray-500">WD{idx+1}</td>
                                  <td className="py-1.5 align-top">
                                    <div className="font-bold text-sm">内部建具 {door.roomName}</div>
                                    <div className="text-[10px] text-gray-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0 leading-tight">
                                       <span>種類: {door.type}</span>
                                       <span className={isDesignRed ? 'text-red-600 font-bold' : ''}>デザイン: {door.design}</span>
                                       <span className={isSizeRed ? 'text-red-600 font-bold' : ''}>サイズ: {door.width==='特寸'?`W${door.customWidth}㎜特寸`:door.width} × {door.height==='特寸'?`H${door.customHeight}㎜特寸`:door.height}</span>
                                       <span>吊元: {door.hangingSide}</span>
                                       <span className={door.handleColor !== "J型取手" && !door.handleColor.includes(initialSettings.defaultHandleColor) ? 'text-red-600 font-bold' : ''}>ハンドル: {door.handleColor}</span>
                                       <span className={isFrameOptionRed ? 'text-red-600 font-bold' : ''}>枠: {door.frameType}
                                         {(door.isUndercut || door.isFrameExtended) && (
                                           <span className="text-red-600 font-bold ml-1">
                                             ※{door.isUndercut ? `アンダーカット${door.undercutHeight}mm` : ''}
                                             {door.isUndercut && door.isFrameExtended ? '/' : ''}
                                             {door.isFrameExtended ? `土間${door.frameExtensionHeight}mm` : ''}
                                           </span>
                                         )}
                                       </span>
                                       <span>
                                         <span className={isDoorColorRed ? 'text-red-600 font-bold' : ''}>色: {door.doorColor}</span>
                                         <span className={isFrameColorRed ? 'text-red-600 font-bold ml-1' : 'ml-1'}>(枠:{door.frameColor})</span>
                                       </span>
                                       {door.specialNotes && <span className="text-red-500 font-bold">特記: {door.specialNotes}</span>}
                                    </div>
                                  </td>
                                  <td className="py-1.5 align-top text-center">1式</td>
                                  <td className="py-1.5 align-top text-left font-mono text-sm">¥{door.price.toLocaleString()}</td>
                                  <td className="py-1.5 align-top text-right font-bold font-mono text-sm">¥{door.price.toLocaleString()}</td>
                              </tr>
                            </React.Fragment>
                          );
                        })}

                        {order.storage.type !== 'NONE' && (
                          <>
                            <tr className="border-b border-gray-200">
                               <td className="py-1.5 align-top font-medium text-gray-500">GS</td>
                               <td className="py-1.5 align-top">
                                  <div className="font-bold text-sm">玄関収納 本体</div>
                                  <div className="text-[10px] text-gray-500 mt-0.5">
                                     {order.storage.type} / {order.storage.size} / {order.storage.color}
                                  </div>
                               </td>
                               <td className="py-1.5 align-top text-center">1式</td>
                               <td className="py-1.5 align-top text-left font-mono text-sm">¥{order.storage.basePrice.toLocaleString()}</td>
                               <td className="py-1.5 align-top text-right font-bold font-mono text-sm">¥{order.storage.basePrice.toLocaleString()}</td>
                            </tr>
                             {order.storage.baseRingPrice > 0 && (
                               <tr className="border-b border-gray-200">
                                 <td className="py-1 align-top"></td>
                                 <td className="py-1 align-top text-gray-600 pl-4 text-[10px]">└ 台輪あり ({order.storage.baseRing})</td>
                                 <td className="py-1 align-top text-center">1式</td>
                                 <td className="py-1 align-top text-left font-mono text-sm">¥{order.storage.baseRingPrice.toLocaleString()}</td>
                                 <td className="py-1 align-top text-right font-bold font-mono text-sm">¥{order.storage.baseRingPrice.toLocaleString()}</td>
                               </tr>
                            )}
                            {order.storage.mirrorPrice > 0 && (
                               <tr className="border-b border-gray-200">
                                 <td className="py-1 align-top"></td>
                                 <td className="py-1 align-top text-gray-600 pl-4 text-[10px]">└ ミラーあり ({order.storage.mirror})</td>
                                 <td className="py-1 align-top text-center">1式</td>
                                 <td className="py-1 align-top text-left font-mono text-sm">¥{order.storage.mirrorPrice.toLocaleString()}</td>
                                 <td className="py-1 align-top text-right font-bold font-mono text-sm">¥{order.storage.mirrorPrice.toLocaleString()}</td>
                               </tr>
                            )}
                            {order.storage.fillerCount > 0 && (
                               <tr className="border-b border-gray-200">
                                 <td className="py-1 align-top"></td>
                                 <td className="py-1 align-top text-gray-600 pl-4 text-[10px]">└ フィラー</td>
                                 <td className="py-1 align-top text-center">{order.storage.fillerCount}個</td>
                                 <td className="py-1 align-top text-left font-mono text-sm">¥{order.storage.fillerPrice.toLocaleString()}</td>
                                 <td className="py-1 align-top text-right font-bold font-mono text-sm">¥{(order.storage.fillerPrice * order.storage.fillerCount).toLocaleString()}</td>
                               </tr>
                            )}
                          </>
                        )}

                        {order.baseboards.map((item, idx) => {
                           if (item.quantity === 0) return null;
                           return (
                              <tr key={idx} className="border-b border-gray-200">
                                 <td className="py-1.5 align-top font-medium text-gray-500">{idx===0 ? 'Z1' : 'Z2'}</td>
                                 <td className="py-1.5 align-top">
                                    <div className="font-bold text-sm">{item.product}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{item.color}</div>
                                 </td>
                                 <td className="py-1.5 align-top text-center">{item.quantity}{item.unit}</td>
                                 <td className="py-1.5 align-top text-left font-mono text-sm">¥{item.unitPrice.toLocaleString()}</td>
                                 <td className="py-1.5 align-top text-right font-bold font-mono text-sm">¥{(item.unitPrice * item.quantity).toLocaleString()}</td>
                              </tr>
                           );
                        })}

                        {order.shipping > 0 && (
                            <tr className="border-b border-gray-200">
                               <td className="py-1.5 align-top font-medium text-gray-500">他</td>
                               <td className="py-1.5 align-top">
                                 <div className="font-bold text-sm">運搬諸経費（点数計算: {totals.totalPoints}点）</div>
                                 <div className="text-[10px] text-gray-500 mt-0.5">
                                   納品先: {order.customerInfo.address}
                                   {totals.isShippingDiscounted && ` (送料算定点数: ${totals.totalPoints}/10)`}
                                 </div>
                               </td>
                               <td className="py-1.5 align-top text-center">1式</td>
                               <td className="py-1.5 align-top text-left font-mono text-sm">¥{totals.finalShipping.toLocaleString()}</td>
                               <td className="py-1.5 align-top text-right font-bold font-mono text-sm">¥{totals.finalShipping.toLocaleString()}</td>
                            </tr>
                        )}
                        
                        <tr className="border-t-2 border-gray-400">
                          <td colSpan={2}></td>
                          <td colSpan={2} className="py-1 px-2 text-right text-sm text-gray-600">小計 (税抜)</td>
                          <td className="py-1 px-2 text-right font-mono text-sm">¥{totals.subtotal.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td colSpan={2}></td>
                          <td colSpan={2} className="py-1 px-2 text-right text-sm text-gray-600">消費税 (10%)</td>
                          <td className="py-1 px-2 text-right font-mono text-sm">¥{totals.tax.toLocaleString()}</td>
                        </tr>
                        <tr className="bg-gray-50 font-bold border-t border-gray-200">
                          <td colSpan={2}></td>
                          <td colSpan={2} className="py-2 px-2 text-right text-sm">合計 (税込)</td>
                          <td className="py-2 px-2 text-right font-mono text-base">¥{totals.total.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-2 print:break-inside-avoid">
                    <h4 className="font-bold text-xs text-gray-700 mb-1">備考 / メモ</h4>
                    <textarea
                      className="w-full h-24 p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none text-xs print:border print:border-gray-400 print:text-gray-900 bg-white"
                      placeholder="特記事項やご要望があればご記入ください。"
                      value={order.memo}
                      onChange={(e) => setOrder(prev => ({ ...prev, memo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
       {isHardwareModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsHardwareModalOpen(false)}>
           <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-5xl w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 text-white p-2" onClick={() => setIsHardwareModalOpen(false)}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="bg-gray-50 p-4 border-b rounded-t-lg">
              <h4 className="text-center font-bold text-gray-800">ハンドル・ハードウェア一覧</h4>
            </div>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/hardware.JPG" alt="ハードウェア一覧" className="w-full h-auto rounded-b-lg" />
          </div>
        </div>
      )}
      {isHandleModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsHandleModalOpen(false)}>
           <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-lg w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 text-white p-2" onClick={() => setIsHandleModalOpen(false)}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="bg-gray-50 p-4 border-b rounded-t-lg">
              <h4 className="text-center font-bold text-gray-800">J型取手 形状確認</h4>
              <p className="text-[10px] text-center text-gray-500 mt-1">折戸・物入の標準仕様となります。</p>
            </div>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/jtotte.JPG" alt="J型取手" className="w-full h-auto rounded-b-lg" />
          </div>
        </div>
      )}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsInfoModalOpen(false)}>
           <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-5xl w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/hirakigatte.jpg" alt="吊元説明" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}
      {isWakuModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsWakuModalOpen(false)}>
           <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-5xl w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/waku.jpg" alt="枠仕様説明" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}
      {isHabakiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsHabakiModalOpen(false)}>
          <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-white p-2" onClick={() => setIsHabakiModalOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="bg-gray-50 p-4 border-b rounded-t-lg">
              <h4 className="text-center font-bold text-gray-800">スリム巾木 詳細</h4>
            </div>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/slimhabaki.JPG" alt="スリム巾木説明" className="w-full h-auto rounded-b-lg" />
          </div>
        </div>
      )}
      {isCornerHabakiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsCornerHabakiModalOpen(false)}>
           <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-white p-2" onClick={() => setIsCornerHabakiModalOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="bg-gray-50 p-4 border-b rounded-t-lg">
              <h4 className="text-center font-bold text-gray-800">スリムコーナー巾木 詳細</h4>
            </div>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/cornerslimhabaki.JPG" alt="スリムコーナー巾木説明" className="w-full h-auto rounded-b-lg" />
          </div>
        </div>
      )}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsColorModalOpen(false)}>
          <div className="relative bg-white p-2 rounded-xl shadow-2xl max-w-5xl w-full animate-in zoom-in flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 text-white p-2" onClick={() => setIsColorModalOpen(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="bg-gray-50 p-4 border-b rounded-t-lg w-full">
              <h4 className="text-center font-bold text-gray-800">扉カラー 一覧</h4>
            </div>
            <img src="http://25663cc9bda9549d.main.jp/aistudio/door/Doorcolor.jpg" alt="扉カラー一覧" className="w-[60%] h-auto rounded-lg my-4" />
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden animate-in zoom-in flex flex-col max-h-[90vh]">
            <div className="bg-gray-900 px-6 py-4 text-white font-bold text-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                初期設定【柏木工 オリジナルドア】
              </div>
              <button 
                onClick={() => setIsDataViewerOpen(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2.5 rounded-lg flex items-center transition-colors shadow-sm"
                title="データ確認（価格表・送料等）"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col lg:flex-row gap-6">
                
                <div className="flex-1 lg:max-w-[40%] flex flex-col">
                  <h3 className="font-bold text-gray-800 text-lg mb-4 border-b-2 border-blue-500 pb-1 inline-block">基本設定の入力</h3>
                  <div className="space-y-4">
                    <div className="space-y-3">
                       <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 ml-1">会社名</label>
                          <input type="text" className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="株式会社 〇〇" value={initialSettings.company} onChange={e => setInitialSettings(p => ({...p, company: e.target.value}))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 ml-1">現場名</label>
                          <input type="text" className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="〇〇様邸" value={initialSettings.siteName} onChange={e => setInitialSettings(p => ({...p, siteName: e.target.value}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 ml-1">担当者名</label>
                            <input type="text" className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="山田 太郎" value={initialSettings.contactName} onChange={e => setInitialSettings(p => ({...p, contactName: e.target.value}))} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 ml-1">連絡先(電話番号)</label>
                            <input type="text" className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="090-0000-0000" value={initialSettings.phone} onChange={e => setInitialSettings(p => ({...p, phone: e.target.value}))} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">標準高さ</label>
                        <select className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={initialSettings.defaultHeight} onChange={e => setInitialSettings(p => ({...p, defaultHeight: e.target.value}))}><option value="H2000">H2000</option><option value="H2200">H2200</option><option value="H2400">H2400</option></select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">扉標準カラー</label>
                        <select className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={initialSettings.defaultDoorColor} onChange={e => setInitialSettings(p => ({...p, defaultDoorColor: e.target.value}))}>{COLORS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">標準ハンドル</label>
                        <select className="w-full border rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={initialSettings.defaultHandleColor} onChange={e => setInitialSettings(p => ({...p, defaultHandleColor: e.target.value}))}>{SIMPLE_HANDLE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 lg:border-l lg:pl-6 lg:border-gray-200 flex flex-col">
                   <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm mb-4">
                    <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3 text-base border-b border-orange-200 pb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      見積書のご入力について
                    </h3>
                    <div className="space-y-3">
                      <ul className="list-disc list-inside space-y-1 text-xs text-gray-800 font-medium ml-1">
                        <li><span className="font-bold text-orange-700">納品希望日</span>：玄関収納、巾木の納品日が枠(①)か本体(②)か要確認。</li>
                        <li><span className="font-bold text-orange-700">天井PB厚</span>：下地材サイズに影響するため確認してください。</li>
                        <li><span className="font-bold text-orange-700">特寸入力</span>：リストの高さ/幅の「特寸」を選択して入力。</li>
                      </ul>

                      <div className="bg-white p-3 rounded-lg border border-orange-100">
                        <p className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          枠オプション設定について
                        </p>
                        <p className="text-[10px] text-gray-600 mb-3 leading-relaxed ml-1 flex flex-wrap items-center gap-1">
                          ドア下開口（アンダーカット）や枠伸長は、リスト内「枠仕様」欄の設定ボタン
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </span>
                          から。
                        </p>
                         <div className="grid grid-cols-2 gap-4">
                          <div className="text-center group">
                            <div className="overflow-hidden rounded border border-gray-200 shadow-sm mb-1 bg-gray-100 h-28 flex items-center justify-center">
                              <img src="http://25663cc9bda9549d.main.jp/aistudio/door/kaikou.jpg" alt="ドア下開口" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <p className="text-[10px] font-bold text-gray-600">ドア下開口</p>
                          </div>
                          <div className="text-center group">
                            <div className="overflow-hidden rounded border border-gray-200 shadow-sm mb-1 bg-gray-100 h-28 flex items-center justify-center">
                              <img src="http://25663cc9bda9549d.main.jp/aistudio/door/wakuencho.jpg" alt="枠伸長" className="max-h-full w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <p className="text-[10px] font-bold text-gray-600">枠伸長</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm mt-auto">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4 text-sm border-b border-slate-200 pb-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      ご注文〜納品の流れ
                    </h3>
                    <div className="relative pt-2 px-1">
                      <div className="absolute top-[11px] left-4 right-4 h-0.5 bg-slate-300 -z-0"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        {[
                          { label: "見積・依頼", sub: "お客様", color: "bg-indigo-500" },
                          { label: "図面確認", sub: "柏木工", color: "bg-gray-500" },
                          { label: "正式発注", sub: "お客様", color: "bg-orange-500", active: true },
                          { label: "製作", sub: "中2週〜", color: "bg-blue-600" },
                          { label: "納品", sub: "1次・2次", color: "bg-emerald-500" },
                        ].map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1 group w-14">
                            <div className={`w-6 h-6 rounded-full ${step.color} text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-4 ring-slate-50 group-hover:scale-110 transition-transform`}>
                              {idx + 1}
                            </div>
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-bold ${step.active ? 'text-orange-600' : 'text-slate-700'} leading-tight whitespace-nowrap`}>
                                {step.label}
                              </span>
                              <span className="text-[9px] text-slate-400 leading-none scale-90 whitespace-nowrap">{step.sub}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 bg-gray-50 flex justify-end border-t shrink-0">
              <button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
                <span>入力を開始する</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
       <div className={`max-w-[1550px] mx-auto p-8 bg-white shadow-xl my-8 transition-opacity duration-500 rounded-3xl ${isModalOpen || isEstimateModalOpen || isOrderFlowModalOpen || isMailModalOpen || isValidationModalOpen ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-900 pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">柏木工 オリジナルドア 発注書</h1>
            <p className="text-lg text-gray-500 mt-1 font-['Inter']">Ordering System v1.0</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsOrderFlowModalOpen(true)}
              className="bg-white text-blue-700 border-2 border-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18l-6-6m0 0l6-6m-6 6h18" /></svg>
              注文フロー確認
            </button>
            <button 
              onClick={handleOpenEstimate} 
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              見積書作成
            </button>
            <button 
              onClick={handleBatchExport}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
              詳細図一括出力
            </button>
          </div>
        </div>

         <div className="grid grid-cols-4 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">会社名</label>
            <input type="text" className="w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none" placeholder="会社名" value={order.customerInfo.company} onChange={e => setOrder(p => ({...p, customerInfo: {...p.customerInfo, company: e.target.value}}))} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">現場名</label>
            <input type="text" className="w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none" placeholder="〇〇様邸" value={order.customerInfo.siteName} onChange={e => setOrder(p => ({...p, customerInfo: {...p.customerInfo, siteName: e.target.value}}))} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">担当者名</label>
            <input type="text" className="w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none" placeholder="担当者名" value={order.customerInfo.contactName} onChange={e => setOrder(p => ({...p, customerInfo: {...p.customerInfo, contactName: e.target.value}}))} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">連絡先(電話番号)</label>
            <input type="text" className="w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none" placeholder="電話番号" value={order.customerInfo.phone} onChange={e => setOrder(p => ({...p, customerInfo: {...p.customerInfo, phone: e.target.value}}))} />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">納品先住所</label>
            <div className="flex gap-2">
              <div className="w-1/3 shrink-0">
                <select 
                  className={`w-full border rounded-lg p-2.5 font-medium focus:ring-1 outline-none transition-colors ${!addressPart.prefecture && order.customerInfo.address ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 bg-white'}`}
                  value={addressPart.prefecture}
                  onChange={(e) => handlePrefectureChange(e.target.value)}
                >
                  <option value="">都道府県を選択</option>
                  {shippingFees.map(fee => (
                    <option key={fee.id} value={fee.prefecture}>{fee.prefecture}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-lg p-2.5 font-medium focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  placeholder="市区町村・番地・マンション名など" 
                  value={addressPart.detail} 
                  onChange={(e) => handleAddressDetailChange(e.target.value)} 
                />
              </div>
            </div>
            {order.customerInfo.address && order.shipping === 0 && (
              <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">
                ※ 都道府県名が正しく選択されていないため、送料が計算できません。
              </p>
            )}
          </div>
          <div className="space-y-1 col-span-1 relative">
             <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">納品希望日</label>
             <div className="space-y-2">
                <div className="flex flex-col gap-1 p-2 border rounded-lg bg-white shadow-sm">
                  <BusinessDatePicker 
                    value={order.customerInfo.deliveryDate1} 
                    onChange={date => setOrder(p => ({...p, customerInfo: {...p.customerInfo, deliveryDate1: date}}))}
                    label="① ドア枠"
                    colorClass="bg-blue-600"
                  />
                  {(hasBaseboard || hasStorage) && (
                    <div className="flex items-center gap-4 ml-1 pl-2 border-l-2 border-blue-100">
                      {hasBaseboard && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                          <input type="checkbox" checked={order.customerInfo.delivery1Selection.baseboard} onChange={e => handleDeliveryItemChange(1, 'baseboard', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="font-bold text-gray-600">巾木</span>
                        </label>
                      )}
                      {hasStorage && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                          <input type="checkbox" checked={order.customerInfo.delivery1Selection.storage} onChange={e => handleDeliveryItemChange(1, 'storage', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                          <span className="font-bold text-gray-600">玄関収納</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 p-2 border rounded-lg bg-white shadow-sm">
                  <BusinessDatePicker 
                    value={order.customerInfo.deliveryDate2} 
                    onChange={date => setOrder(p => ({...p, customerInfo: {...p.customerInfo, deliveryDate2: date}}))}
                    label="② ドア本体"
                    colorClass="bg-green-600"
                  />
                  {(hasBaseboard || hasStorage) && (
                    <div className="flex items-center gap-4 ml-1 pl-2 border-l-2 border-green-100">
                      {hasBaseboard && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                          <input type="checkbox" checked={order.customerInfo.delivery2Selection.baseboard} onChange={e => handleDeliveryItemChange(2, 'baseboard', e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
                          <span className="font-bold text-gray-600">巾木</span>
                        </label>
                      )}
                      {hasStorage && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                          <input type="checkbox" checked={order.customerInfo.delivery2Selection.storage} onChange={e => handleDeliveryItemChange(2, 'storage', e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
                          <span className="font-bold text-gray-600">玄関収納</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
             </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">天井PB厚</label>
            <div className="flex flex-col gap-1">
              <select 
                className={`w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 outline-none ${order.customerInfo.ceilingPB === '15.0' ? 'border-red-300 text-red-600 focus:ring-red-500' : 'focus:ring-blue-500'}`} 
                value={order.customerInfo.ceilingPB} 
                onChange={handleCeilingPbChange}
              >
                {PB_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}㎜</option>
                ))}
              </select>
              {order.customerInfo.ceilingPB === '15.0' && (
                <p className="text-[10px] font-bold text-red-600 bg-red-50 p-1 rounded text-center">
                  別途ご相談ください。
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 border-l-4 border-blue-500 pl-3 mt-10">
          <h3 className="text-xl font-bold text-gray-800">内部建具</h3>
        </div>

        <div className="mb-8 overflow-x-auto rounded-2xl border shadow-sm">
          <table className="w-full border-collapse min-w-[1300px]">
            <thead className="bg-gray-800 text-white text-[11px] uppercase font-bold text-center">
              <tr>
                <th className="p-4 w-12 border-r border-gray-700">No.</th>
                <th className="w-24">部屋名</th>
                <th className="w-52">建具種類</th>
                <th className="w-32">デザイン</th>
                <th className="w-20">幅</th>
                <th className="w-20">高さ</th>
                <th className="w-40">枠仕様</th>
                <th className="w-28">
                  <div className="flex items-center justify-center gap-1">
                    <span>吊元</span>
                    <button
                      onClick={() => setIsInfoModalOpen(true)}
                      className="no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm"
                      title="吊元の説明を表示"
                    >
                      i
                    </button>
                  </div>
                </th>
                <th className="w-40">
                  <div className="flex items-center justify-center gap-1">
                    <span>扉カラー</span>
                    <button
                      onClick={() => setIsColorModalOpen(true)}
                      className="no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm"
                      title="扉カラー一覧を表示"
                    >
                      i
                    </button>
                  </div>
                </th>
                <th className="w-40">枠カラー</th>
                <th className="w-48">
                  <div className="flex items-center justify-center gap-1">
                    <span>ハンドル</span>
                    <button
                      onClick={() => setIsHardwareModalOpen(true)}
                      className="no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm"
                      title="ハンドル・ハードウェア一覧を表示"
                    >
                      i
                    </button>
                  </div>
                </th>
                <th className="w-28">価格 (円)</th>
                <th className="w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {order.doors.map((door, idx) => (
                <DoorRow 
                  key={door.id} 
                  index={idx} 
                  door={door} 
                  updateDoor={updateDoor} 
                  removeDoor={removeDoor} 
                  initialSettings={initialSettings} 
                  onShowHandleImage={() => setIsHandleModalOpen(true)}
                  siteName={order.customerInfo.siteName}
                  priceList={priceList}
                />
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
            <button onClick={addDoorRow} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-2 rounded-xl font-bold transition-all border border-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              建具行を追加する
            </button>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-gray-500">建具合計:</span>
              <div className="text-3xl font-bold text-blue-700 font-['Inter']">¥{totals.doorSubtotal.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="relative">
          {showStorageBubble && (
            <div className="absolute top-0 left-28 z-20 bg-red-600 text-white p-3 rounded-lg shadow-lg text-xs font-bold animate-bounce">
              <div className="flex justify-between items-start gap-2">
                <span className="leading-tight">どちらかの納品希望日の<br/>どちらかを選択してください</span>
                <button onClick={() => setIsStorageGuideOpen(false)} className="text-white hover:text-red-200 ml-2 text-lg leading-none">×</button>
              </div>
              <div className="absolute -bottom-2 left-4 w-4 h-4 bg-red-600 rotate-45"></div>
            </div>
          )}
          <EntranceStorageSection 
            storage={order.storage} 
            updateStorage={u => setOrder(p => ({...p, storage: {...p.storage, ...u}}))} 
            siteName={order.customerInfo.siteName} 
            storageTypes={storageTypes}
          />
        </div>

        <div className="grid grid-cols-2 gap-8 items-start mt-10">
          <div className="border p-6 rounded-2xl bg-white shadow-sm border-emerald-100 flex flex-col h-full relative">
            {showBaseboardBubble && (
              <div className="absolute top-4 right-10 z-20 bg-red-600 text-white p-3 rounded-lg shadow-lg text-xs font-bold animate-bounce">
                <div className="flex justify-between items-start gap-2">
                  <span className="leading-tight">どちらかの納品希望日の<br/>どちらかを選択してください</span>
                  <button onClick={() => setIsBaseboardGuideOpen(false)} className="text-white hover:text-red-200 ml-2 text-lg leading-none">×</button>
                </div>
                <div className="absolute -bottom-2 left-1/2 w-4 h-4 bg-red-600 rotate-45"></div>
              </div>
            )}
            <div className="flex-grow">
              <h3 className="text-xl font-bold border-l-4 border-emerald-600 pl-3 mb-6 text-gray-800">
                巾木・造作材
              </h3>
              <div className="divide-y divide-emerald-50">
                {order.baseboards.map((b,i) => (
                  <div key={i} className="flex flex-col xl:flex-row justify-between items-center py-4 border-b border-gray-100 last:border-0">
                    <div className="flex flex-col mb-2 xl:mb-0 w-full xl:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 text-sm">{b.product}</span>
                        {b.product === 'スリムコーナー巾木' ? (
                          <button
                            onClick={() => setIsCornerHabakiModalOpen(true)}
                            className="no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm shrink-0"
                            title="コーナー巾形の詳細を表示"
                          >
                            i
                          </button>
                        ) : b.product.includes('スリム巾木') ? (
                          <button
                            onClick={() => setIsHabakiModalOpen(true)}
                            className="no-print bg-blue-500 hover:bg-blue-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors shadow-sm shrink-0"
                            title="巾形の詳細を表示"
                          >
                            i
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {i === 0 ? (
                          <select
                            value={b.color}
                            onChange={(e) => {
                              const newColor = e.target.value;
                              setOrder(prev => ({
                                ...prev,
                                baseboards: prev.baseboards.map(board => ({ ...board, color: newColor }))
                              }));
                            }}
                            className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer max-w-[180px]"
                          >
                            {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 cursor-not-allowed" title="スリム巾木の色と連動します">
                            {b.color}
                          </span>
                        )}
                        {b.product.includes('3960') && b.quantity > 0 && (
                          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            換算: {(b.quantity * 3.96).toFixed(2)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
                      <span className="text-sm font-medium text-gray-500 whitespace-nowrap">単価 ¥{b.unitPrice.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" className="w-16 border rounded-lg text-center h-9 font-bold focus:ring-1 focus:ring-emerald-500 outline-none" value={b.quantity} onChange={e => { const nb = [...order.baseboards]; nb[i].quantity = Math.max(0, parseInt(e.target.value)||0); setOrder(p=>({...p, baseboards:nb})); }} />
                        <span className="text-xs font-bold text-gray-400">{b.unit}</span>
                      </div>
                      <span className="text-base font-bold text-blue-600 font-mono whitespace-nowrap min-w-[80px] text-right">小計 ¥{(b.unitPrice * b.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-end items-baseline gap-2">
              <span className="text-sm font-bold text-gray-500">造作材合計:</span>
              <div className="text-3xl font-bold text-blue-700 font-['Inter']">¥{totals.baseboardSubtotal.toLocaleString()}</div>
            </div>
          </div>
          <div className="bg-white text-gray-900 p-10 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden group border border-gray-200">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-blue-500/10"></div>
            
            <div className="w-full space-y-3 mb-8">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-gray-500 font-bold text-base">配送点数</span>
                    <span className="text-xl font-bold font-['Inter'] text-gray-800">{totals.totalPoints} 点</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-bold text-base">運搬諸経費</span>
                      {totals.isShippingDiscounted && (
                        <span className="text-[10px] text-orange-500 font-bold leading-tight">送料算定点数 ({totals.totalPoints}/10)</span>
                      )}
                    </div>
                    <span className="text-xl font-bold font-['Inter'] text-gray-800">¥{totals.finalShipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold text-base">小計 (税抜)</span>
                    <span className="text-xl font-bold font-['Inter'] text-gray-800">¥{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold text-base">消費税 (10%)</span>
                    <span className="text-xl font-bold font-['Inter'] text-gray-800">¥{totals.tax.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-base font-['Inter'] mb-2">合計金額（税込）</p>
                <p className="text-4xl xl:text-5xl font-black font-['Inter'] tracking-tighter leading-none text-blue-700">¥{totals.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-[10px] text-gray-300 border-t pt-8 flex justify-center items-center gap-4">
          <p className="font-bold uppercase tracking-widest font-['Inter']">Kashiwa-f Ordering System</p>
          <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
          <p className="font-medium font-['Inter']">Copyright © Kashiwa-f Co., Ltd. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default App;
