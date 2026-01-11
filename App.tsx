
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { DoorItem, OrderState, DoorType, EntranceStorage, BaseboardItem } from './types';
import { DoorRow } from './components/DoorRow';
import { EntranceStorageSection } from './components/EntranceStorageSection';
import { COLORS, HANDLE_COLORS, SHIPPING_FEE_MAP, PRICE_LIST, DOOR_SPEC_MASTER, getFrameType, HINGED_HANDLES, SLIDING_HANDLES } from './constants';

const SIMPLE_HANDLE_OPTIONS = ["セラミックホワイト", "マットブラック", "サテンニッケル"];

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isWakuModalOpen, setIsWakuModalOpen] = useState(false);
  const [isHabakiModalOpen, setIsHabakiModalOpen] = useState(false);
  const [isCornerHabakiModalOpen, setIsCornerHabakiModalOpen] = useState(false);
  const [isHandleModalOpen, setIsHandleModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);
  
  const [floorPlan, setFloorPlan] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationData, setValidationData] = useState<{
    errors: string[],
    warnings: string[]
  }>({ errors: [], warnings: [] });

  const [initialSettings, setInitialSettings] = useState({
    company: '',
    siteName: '',
    contactName: '',
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
      deliveryDate: '',
      ceilingPB: '12.5',
    },
    doors: [],
    storage: {
      type: 'E02',
      size: 'W800(E02)/2枚',
      color: COLORS[0],
      basePrice: 23700,
      baseRing: 'W800用',
      baseRingPrice: 2300,
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
  });

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
    const initialPrice = PRICE_LIST.find(p => p.type === defaultType && p.height === initialSettings.defaultHeight && p.design === defaultDesign)?.setPrice || 27300;

    setOrder(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, company: initialSettings.company, siteName: initialSettings.siteName, contactName: initialSettings.contactName },
      storage: { ...prev.storage, color: initialSettings.defaultDoorColor },
      baseboards: prev.baseboards.map(b => ({ ...b, color: initialSettings.defaultBaseboardColor })),
      doors: [{
        id: crypto.randomUUID(),
        roomName: 'LDK',
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
      }]
    }));
    setIsModalOpen(false);
  };

  const addDoorRow = () => {
    const defaultType = DoorType.Hinged;
    const defaultSpec = DOOR_SPEC_MASTER[defaultType];
    const defaultDesign = defaultSpec.designs[0];
    const initialPrice = PRICE_LIST.find(p => p.type === defaultType && p.height === initialSettings.defaultHeight && p.design === defaultDesign)?.setPrice || 27300;
    
    setOrder(prev => ({
      ...prev,
      doors: [...prev.doors, {
        id: crypto.randomUUID(),
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

  const handleAddressChange = (address: string) => {
    setOrder(prev => {
      let matchedFee = 0; let longestMatch = -1;
      Object.entries(SHIPPING_FEE_MAP).forEach(([key, value]) => {
        if (address.includes(key)) { if (key.length > longestMatch) { longestMatch = key.length; matchedFee = value; } }
      });
      return { ...prev, customerInfo: { ...prev.customerInfo, address }, shipping: matchedFee };
    });
  };

  const totals = useMemo(() => {
    const doorSubtotal = order.doors.reduce((sum, d) => sum + d.price, 0);
    const storageSubtotal = order.storage.type === 'NONE' ? 0 : order.storage.basePrice + order.storage.baseRingPrice + (order.storage.fillerPrice * order.storage.fillerCount) + order.storage.mirrorPrice;
    const baseboardSubtotal = order.baseboards.reduce((sum, b) => sum + (b.unitPrice * b.quantity), 0);
    const subtotal = doorSubtotal + storageSubtotal + baseboardSubtotal + order.shipping;
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;
    return { doorSubtotal, storageSubtotal, baseboardSubtotal, subtotal, tax, total };
  }, [order]);

  const handleOpenEstimate = () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fields = [
      { key: 'company', label: '会社名' },
      { key: 'siteName', label: '現場名' },
      { key: 'contactName', label: 'ご担当者名' },
      { key: 'address', label: '納品先住所' },
      { key: 'deliveryDate', label: '納品希望日' },
    ];
    fields.forEach(f => { if (!order.customerInfo[f.key as keyof typeof order.customerInfo]) errors.push(`${f.label}が入力されていません。`); });
    
    // 送料チェック
    if (order.shipping === 0) {
      errors.push('送料が計算できません。納品先住所を確認してください。');
    }

    if (order.doors.length === 0 && order.storage.type === 'NONE') errors.push('商品を選択してください。');
    if (order.storage.type === 'NONE' && order.doors.length > 0) warnings.push('玄関収納が選択されていません。');
    if (order.baseboards.reduce((s, b) => s + b.quantity, 0) === 0) warnings.push('巾木の数量が0個です。');

    if (errors.length > 0 || warnings.length > 0) {
      setValidationData({ errors, warnings });
      setIsValidationModalOpen(true);
      return;
    }
    setIsEstimateModalOpen(true);
  };

  const handleSendEstimate = () => {
    if (!floorPlan) {
      setValidationData({ errors: ['平面図の添付が必須です。'], warnings: [] });
      setIsValidationModalOpen(true);
      return;
    }
    if (window.confirm('送信しますか？')) {
      alert('送信完了しました。');
      setIsEstimateModalOpen(false);
      setFloorPlan(null);
    }
  };

  const handlePrintPdf = () => { window.print(); };

  return (
    <div className="min-h-screen bg-slate-100 font-['Noto_Sans_JP']">
      {/* Integrated Estimate & Order Flow Modal */}
      {isEstimateModalOpen && (
        <div className="fixed inset-0 z-[150] bg-gray-600/90 backdrop-blur-md overflow-y-auto no-print animate-in fade-in duration-300">
          <div className="min-h-screen py-6 px-4 flex flex-col items-center">
            {/* Action Bar (Top) */}
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 gap-4 no-print">
              <button onClick={() => setIsEstimateModalOpen(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold group">
                <div className="bg-gray-100 p-2 rounded-full group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </div>
                戻って修正
              </button>
              <div className="flex flex-wrap justify-center items-center gap-3">
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setFloorPlan(e.target.files[0])} className="hidden" accept=".pdf,image/*" />
                <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${floorPlan ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}>
                  {floorPlan ? `平面図：${floorPlan.name}` : "平面図を添付 (必須)"}
                </button>
                <button onClick={handleSendEstimate} className={`bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ${!floorPlan ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" /></svg>
                  見積・平面図を送付
                </button>
                <button onClick={handlePrintPdf} className="bg-gray-800 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  PDF保存
                </button>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start w-full max-w-[1400px]">
              {/* Document Column (Center/Left) - A4 Sized Container */}
              <div className="flex-grow w-full flex justify-center">
                <div className="bg-white p-[15mm] shadow-2xl rounded-sm text-gray-900 w-full max-w-[210mm] min-h-[297mm] flex flex-col relative print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 box-border">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h2 className="text-4xl font-bold border-b-4 border-gray-800 pb-2 mb-4 font-['Inter'] tracking-tight">御見積書</h2>
                      <div className="space-y-1">
                        <p className="text-xl font-bold underline underline-offset-4">{order.customerInfo.company} 御中</p>
                        {order.customerInfo.contactName && (
                          <p className="text-lg font-bold underline underline-offset-4 ml-4">{order.customerInfo.contactName} 様</p>
                        )}
                        <p className="text-sm mt-2">現場名：{order.customerInfo.siteName}</p>
                        <p className="text-sm">納品希望日：{order.customerInfo.deliveryDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-2 font-['Inter']">発行日：{new Date().toLocaleDateString('ja-JP')}</p>
                      <p className="font-bold text-lg">柏木工株式会社</p>
                      <p className="text-sm">担当：滝下まで 宛</p>
                      <p className="text-sm mt-2 font-['Inter']">TEL: 090-3307-6294</p>
                    </div>
                  </div>

                  <div className="bg-gray-100 p-6 rounded-xl mb-10 flex justify-between items-baseline">
                    <span className="text-xl font-bold">御見積合計（税込）</span>
                    <span className="text-xl font-black font-['Inter']">¥{totals.total.toLocaleString()}</span>
                  </div>

                  <div className="mb-10 flex-grow">
                    <h4 className="font-bold border-b border-gray-300 pb-1 mb-4 text-gray-700 uppercase tracking-widest text-sm">内訳明細</h4>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-800">
                          <th className="py-2 text-left w-10">No.</th>
                          <th className="py-2 text-left">品名・仕様</th>
                          <th className="py-2 text-center w-16">数量</th>
                          <th className="py-2 text-right w-20">単価</th>
                          <th className="py-2 text-right w-24">金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Internal Doors Details */}
                        {order.doors.map((door, idx) => (
                          <React.Fragment key={door.id}>
                            <tr className="border-b border-gray-200">
                                <td className="py-3 align-top font-medium text-gray-500">WD{idx+1}</td>
                                <td className="py-3 align-top">
                                  <div className="font-bold text-sm">内部建具 {door.roomName}</div>
                                  <div className="text-[10px] text-gray-500 mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 leading-tight">
                                     <span>種類: {door.type}</span>
                                     <span>デザイン: {door.design}</span>
                                     <span>サイズ: {door.width==='特寸'?`W${door.customWidth}`:door.width} × {door.height==='特寸'?`H${door.customHeight}`:door.height}</span>
                                     <span>枠: {door.frameType}</span>
                                     <span>吊元: {door.hangingSide}</span>
                                     <span>ハンドル: {door.handleColor}</span>
                                     <span className="col-span-2">カラー: {door.doorColor} (枠:{door.frameColor})</span>
                                     {door.specialNotes && <span className="col-span-2 text-red-500">特記: {door.specialNotes}</span>}
                                  </div>
                                </td>
                                <td className="py-3 align-top text-center">1式</td>
                                <td className="py-3 align-top text-right font-mono">¥{door.price.toLocaleString()}</td>
                                <td className="py-3 align-top text-right font-bold font-mono">¥{door.price.toLocaleString()}</td>
                            </tr>
                          </React.Fragment>
                        ))}

                        {/* Storage Details */}
                        {order.storage.type !== 'NONE' && (
                          <>
                            <tr className="border-b border-gray-200">
                               <td className="py-3 align-top font-medium text-gray-500">GS</td>
                               <td className="py-3 align-top">
                                  <div className="font-bold text-sm">玄関収納 本体</div>
                                  <div className="text-[10px] text-gray-500 mt-1">
                                     {order.storage.type} / {order.storage.size} / {order.storage.color}
                                  </div>
                               </td>
                               <td className="py-3 align-top text-center">1式</td>
                               <td className="py-3 align-top text-right font-mono">¥{order.storage.basePrice.toLocaleString()}</td>
                               <td className="py-3 align-top text-right font-bold font-mono">¥{order.storage.basePrice.toLocaleString()}</td>
                            </tr>
                            {/* Base Ring */}
                            {order.storage.baseRingPrice > 0 && (
                               <tr className="border-b border-gray-200">
                                 <td className="py-2 align-top"></td>
                                 <td className="py-2 align-top text-gray-600 pl-4 text-[11px]">└ 台輪あり ({order.storage.baseRing})</td>
                                 <td className="py-2 align-top text-center">1式</td>
                                 <td className="py-2 align-top text-right font-mono">¥{order.storage.baseRingPrice.toLocaleString()}</td>
                                 <td className="py-2 align-top text-right font-bold font-mono">¥{order.storage.baseRingPrice.toLocaleString()}</td>
                               </tr>
                            )}
                            {/* Mirror */}
                            {order.storage.mirrorPrice > 0 && (
                               <tr className="border-b border-gray-200">
                                 <td className="py-2 align-top"></td>
                                 <td className="py-2 align-top text-gray-600 pl-4 text-[11px]">└ ミラーあり ({order.storage.mirror})</td>
                                 <td className="py-2 align-top text-center">1式</td>
                                 <td className="py-2 align-top text-right font-mono">¥{order.storage.mirrorPrice.toLocaleString()}</td>
                                 <td className="py-2 align-top text-right font-bold font-mono">¥{order.storage.mirrorPrice.toLocaleString()}</td>
                               </tr>
                            )}
                            {/* Filler */}
                            {order.storage.fillerCount > 0 && (
                               <tr className="border-b border-gray-200">
                                 <td className="py-2 align-top"></td>
                                 <td className="py-2 align-top text-gray-600 pl-4 text-[11px]">└ フィラー</td>
                                 <td className="py-2 align-top text-center">{order.storage.fillerCount}個</td>
                                 <td className="py-2 align-top text-right font-mono">¥{order.storage.fillerPrice.toLocaleString()}</td>
                                 <td className="py-2 align-top text-right font-bold font-mono">¥{(order.storage.fillerPrice * order.storage.fillerCount).toLocaleString()}</td>
                               </tr>
                            )}
                          </>
                        )}

                        {/* Baseboards Details */}
                        {order.baseboards.map((item, idx) => {
                           if (item.quantity === 0) return null;
                           return (
                              <tr key={idx} className="border-b border-gray-200">
                                 <td className="py-3 align-top font-medium text-gray-500">{idx===0 ? 'Z1' : 'Z2'}</td>
                                 <td className="py-3 align-top">
                                    <div className="font-bold text-sm">{item.product}</div>
                                    <div className="text-[10px] text-gray-500 mt-1">{item.color}</div>
                                 </td>
                                 <td className="py-3 align-top text-center">{item.quantity}{item.unit}</td>
                                 <td className="py-3 align-top text-right font-mono">¥{item.unitPrice.toLocaleString()}</td>
                                 <td className="py-3 align-top text-right font-bold font-mono">¥{(item.unitPrice * item.quantity).toLocaleString()}</td>
                              </tr>
                           );
                        })}

                        {/* Shipping */}
                        {order.shipping > 0 && (
                            <tr className="border-b border-gray-200">
                               <td className="py-3 align-top font-medium text-gray-500">他</td>
                               <td className="py-3 align-top">
                                 <div className="font-bold text-sm">運賃（配送費）</div>
                                 <div className="text-[10px] text-gray-500 mt-1">納品先: {order.customerInfo.address}</div>
                               </td>
                               <td className="py-3 align-top text-center">1式</td>
                               <td className="py-3 align-top text-right font-mono">¥{order.shipping.toLocaleString()}</td>
                               <td className="py-3 align-top text-right font-bold font-mono">¥{order.shipping.toLocaleString()}</td>
                            </tr>
                        )}
                        
                        {/* Totals Section in Table */}
                         <tr className="bg-gray-50 font-bold border-t-2 border-gray-400">
                            <td colSpan={3} className="py-2"></td>
                            <td className="py-3 px-2 text-right">小計</td>
                            <td className="py-3 px-2 text-right font-mono text-lg">¥{totals.subtotal.toLocaleString()}</td>
                          </tr>
                          <tr className="text-gray-500 italic">
                            <td colSpan={3} className="py-2"></td>
                            <td className="py-2 px-2 text-right text-xs">消費税（10%）</td>
                            <td className="py-2 px-2 text-right text-xs font-mono">¥{totals.tax.toLocaleString()}</td>
                          </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 mt-auto">
                    <h5 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      重要：納期に関するご案内
                    </h5>
                    <p className="text-xs text-orange-700 leading-relaxed font-medium">
                      正式発注（注文書のご返信）をいただいてから製作を開始いたします。製作には最低<span className="font-bold underline">「中2週間以上」</span>の期間を要します。<br/>
                      1次納品（枠類・巾木）は最短2週間後、その後2次納品（ドア本体）を順次行います。
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Info (Right) - Hidden on Print */}
              <div className="w-full xl:w-[320px] shrink-0 space-y-6 no-print">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100">
                  <h5 className="text-blue-800 font-bold mb-4 flex items-center gap-2 border-b pb-2">
                    商品に関するお問い合わせ
                  </h5>
                  <div className="space-y-3">
                    <p className="text-lg font-black text-gray-800">柏木工株式会社　滝下まで</p>
                    <div className="text-sm space-y-2">
                      <p className="flex justify-between items-center bg-gray-50 p-2 rounded-lg font-medium"><span className="text-gray-500 font-['Inter'] text-xs">TEL</span><span className="font-mono font-bold">090-3307-6294</span></p>
                      <p className="flex justify-between items-center bg-gray-50 p-2 rounded-lg font-medium"><span className="text-gray-500 font-['Inter'] text-xs">Email</span><span className="font-mono text-blue-600 break-all text-sm">takishita@kashiwa-f.com</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 p-8 rounded-2xl shadow-xl text-white">
                  <h5 className="text-indigo-400 font-bold mb-8 text-lg border-b border-gray-800 pb-2">ご注文の流れ</h5>
                  <div className="space-y-8 relative">
                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-700"></div>
                    {[
                      { step: 1, title: "見積依頼・平面図送付", desc: "入力内容と平面図を柏木工へ送信します。", color: "bg-indigo-500" },
                      { step: 2, title: "内容確認・図面作成", desc: "柏木工にて内容を確認し、詳細図面と正式見積を送付します。", color: "bg-indigo-500" },
                      { step: 3, title: "正式発注", desc: "内容確認後、注文書をご返信ください。", color: "bg-orange-500" },
                      { step: 4, title: "製作開始", desc: "製作期間（中2週間〜）のカウントを開始します。", color: "bg-blue-500" },
                      { step: 5, title: "1次納品（枠・巾木）", desc: "現場の進捗に合わせ、枠類を先行納品します。", color: "bg-blue-500" },
                      { step: 6, title: "2次納品（ドア本体）", desc: "ドア本体を順次納品し、完了となります。", color: "bg-emerald-500" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 relative z-10">
                        <div className={`${item.color} w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-black shadow-lg`}>
                          {item.step}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold leading-tight">{item.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsValidationModalOpen(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              確認
            </h3>
            <div className="space-y-4">
              {validationData.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <p className="text-sm font-bold text-red-800 mb-2">未入力の項目があります</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {validationData.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {validationData.warnings.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <p className="text-sm font-bold text-yellow-800 mb-2">確認事項</p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                    {validationData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsValidationModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                戻って修正
              </button>
              {validationData.errors.length === 0 && (
                <button 
                  onClick={() => { setIsValidationModalOpen(false); setIsEstimateModalOpen(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  このまま作成
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Modals */}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in">
            <div className="bg-gray-900 p-6 text-white font-bold text-2xl flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              初期設定
            </div>
            <div className="p-8 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">会社名</label>
                  <input type="text" className="w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="株式会社 〇〇" value={initialSettings.company} onChange={e => setInitialSettings(p => ({...p, company: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">現場名</label>
                  <input type="text" className="w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="〇〇様邸" value={initialSettings.siteName} onChange={e => setInitialSettings(p => ({...p, siteName: e.target.value}))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">担当者名</label>
                  <input type="text" className="w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="山田 太郎" value={initialSettings.contactName} onChange={e => setInitialSettings(p => ({...p, contactName: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">標準高さ</label>
                  <select className="w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={initialSettings.defaultHeight} onChange={e => setInitialSettings(p => ({...p, defaultHeight: e.target.value}))}><option value="H2000">H2000</option><option value="H2200">H2200</option><option value="H2400">H2400</option></select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">扉標準カラー</label>
                  <select className="w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={initialSettings.defaultDoorColor} onChange={e => setInitialSettings(p => ({...p, defaultDoorColor: e.target.value}))}>{COLORS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">標準ハンドル</label>
                  <select className="w-full border rounded-lg p-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" value={initialSettings.defaultHandleColor} onChange={e => setInitialSettings(p => ({...p, defaultHandleColor: e.target.value}))}>{SIMPLE_HANDLE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end border-t"><button onClick={handleStart} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">開始する</button></div>
          </div>
        </div>
      )}

      <div className={`max-w-[1550px] mx-auto p-8 bg-white shadow-xl my-8 transition-opacity duration-500 rounded-3xl ${isModalOpen || isEstimateModalOpen ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-8 border-b-2 border-gray-900 pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">柏木工 オリジナルドア 発注書</h1>
            <p className="text-lg text-gray-500 mt-1 font-['Inter']">Ordering System v1.0</p>
          </div>
          <button 
            onClick={handleOpenEstimate} 
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl active:scale-95 border border-blue-400/30"
          >
            <div className="bg-white/20 p-1.5 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div className="text-left leading-tight">
              <span className="text-lg font-bold">見積作成・注文フロー確認</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border">
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
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">納品先住所（都道府県から入力してください）</label>
            <div className="relative">
              <input 
                type="text" 
                className={`w-full border rounded-lg p-2.5 font-medium focus:ring-1 outline-none transition-colors ${order.customerInfo.address && order.shipping === 0 ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 bg-white'}`}
                placeholder="都道府県から入力してください" 
                value={order.customerInfo.address} 
                onChange={(e) => handleAddressChange(e.target.value)} 
              />
              {order.customerInfo.address && order.shipping === 0 && (
                <p className="text-xs text-red-500 font-bold mt-1 animate-pulse">
                  ※ 都道府県名が含まれていないため、送料が計算できません。
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">納品希望日</label>
            <input type="date" className="w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none font-['Inter']" value={order.customerInfo.deliveryDate} onChange={e => setOrder(p => ({...p, customerInfo: {...p.customerInfo, deliveryDate: e.target.value}}))} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-wider">天井PB厚 (mm)</label>
            <div className="flex items-center gap-2">
              <input type="number" className="w-full border rounded-lg p-2.5 bg-white font-medium focus:ring-1 focus:ring-blue-500 outline-none font-['Inter']" value={order.customerInfo.ceilingPB} onChange={e => setOrder(p => ({...p, customerInfo: {...p.customerInfo, ceilingPB: e.target.value}}))} />
            </div>
          </div>
        </div>

        {/* Internal Doors Section Header */}
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
                <th className="w-48">ハンドル</th>
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

        <EntranceStorageSection storage={order.storage} updateStorage={u => setOrder(p => ({...p, storage: {...p.storage, ...u}}))} siteName={order.customerInfo.siteName} />

        <div className="grid grid-cols-2 gap-8 items-start mt-10">
          <div className="border p-6 rounded-2xl bg-white shadow-sm border-emerald-100 flex flex-col h-full">
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
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{b.color}</span>
                        {b.product.includes('3960') && b.quantity > 0 && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            換算: {(b.quantity * 3.96).toFixed(2)}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
                      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">単価 ¥{b.unitPrice.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" className="w-16 border rounded-lg text-center h-9 font-bold focus:ring-1 focus:ring-emerald-500 outline-none" value={b.quantity} onChange={e => { const nb = [...order.baseboards]; nb[i].quantity = Math.max(0, parseInt(e.target.value)||0); setOrder(p=>({...p, baseboards:nb})); }} />
                        <span className="text-xs font-bold text-gray-400">{b.unit}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 font-mono whitespace-nowrap min-w-[80px] text-right">小計 ¥{(b.unitPrice * b.quantity).toLocaleString()}</span>
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
          <div className="bg-gray-900 text-white p-10 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-blue-500/20"></div>
            
            <div className="w-full space-y-3 mb-8">
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                    <span className="text-gray-400 font-bold text-sm">送料</span>
                    <span className="text-xl font-bold font-['Inter']">¥{order.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-sm">小計 (税抜)</span>
                    <span className="text-xl font-bold font-['Inter']">¥{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold text-sm">消費税 (10%)</span>
                    <span className="text-xl font-bold font-['Inter']">¥{totals.tax.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-800">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm font-['Inter'] mb-2">合計金額（税込）</p>
                <p className="text-4xl xl:text-5xl font-black font-['Inter'] tracking-tighter leading-none">¥{totals.total.toLocaleString()}</p>
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
