
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { getDoorDetailPdfUrl, DOOR_GROUPS, STORAGE_CATEGORIES } from '../constants';
import { DoorItem, PriceRecord, StorageTypeRecord, ShippingFeeRecord, UsageLocation, DoorType } from '../types';
import { supabase } from '../supabase';

interface DataViewerModalProps {
  onClose: () => void;
  priceList: PriceRecord[];
  storageTypes: StorageTypeRecord[];
  shippingFees: ShippingFeeRecord[];
  onUpdateShipping: (id: number, price: number) => void;
  setPriceList: React.Dispatch<React.SetStateAction<PriceRecord[]>>;
  setStorageTypes: React.Dispatch<React.SetStateAction<StorageTypeRecord[]>>;
}

export const DataViewerModal: React.FC<DataViewerModalProps> = ({ 
  onClose, 
  priceList, 
  storageTypes, 
  shippingFees, 
  onUpdateShipping,
  setPriceList,
  setStorageTypes
}) => {
  const [activeTab, setActiveTab] = useState<'door' | 'storage' | 'shipping'>('door');
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Resize Logic
  const [modalWidth, setModalWidth] = useState<number>(window.innerWidth * 0.9);
  const isResizing = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const rect = document.getElementById('resizable-modal')?.getBoundingClientRect();
    if (rect) {
      const calculatedWidth = (e.clientX - rect.left);
      setModalWidth(Math.max(600, Math.min(calculatedWidth, window.innerWidth * 0.98)));
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof PriceRecord; direction: 'asc' | 'desc' } | null>(null);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PriceRecord>>({});

  // New Door State
  const [newDoor, setNewDoor] = useState<Partial<PriceRecord>>({
    type: DoorType.Hinged,
    location: UsageLocation.Room,
    design: 'フラット',
    height: 'H2000',
    framePrice: 0,
    doorPrice: 0,
    setPrice: 0,
    imageUrl: ''
  });

  // New Storage State
  const [newStorage, setNewStorage] = useState<Partial<StorageTypeRecord>>({
    id: '',
    name: '',
    category: STORAGE_CATEGORIES[1],
    width: 800,
    price: 0,
    imageUrl: ''
  });

  const getFileName = (record: PriceRecord) => {
    if (record.imageUrl) return record.imageUrl;
    const dummyDoor: DoorItem = {
      id: 'dummy', roomName: '', type: record.type, design: record.design, width: '778', height: record.height,
      frameType: 'dummy', hangingSide: 'dummy', doorColor: 'dummy', frameColor: 'dummy', handleColor: 'dummy', specialNotes: '', price: 0
    };
    try {
      const url = getDoorDetailPdfUrl(dummyDoor);
      return url.split('/').pop() || url;
    } catch (e) {
      return 'エラー';
    }
  };

  const handleFileUpload = async (file: File, recordId: string) => {
    try {
      setUploadingId(recordId);
      const fileExt = file.name.split('.').pop();
      const fileName = `door_${recordId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('door-images').upload(filePath, file);
      if (uploadError) throw new Error(`画像の保存に失敗しました: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('door-images').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('internal_doors').update({ image_url: publicUrl }).eq('id', recordId);
      if (dbError) throw new Error(`データベースの更新に失敗しました: ${dbError.message}`);

      setPriceList(prev => prev.map(item => item.id === recordId ? { ...item, imageUrl: publicUrl } : item));
    } catch (error: any) {
      alert('アップロード失敗:\n' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, recordId: string) => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0], recordId);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, recordId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0], recordId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDeleteImage = async (recordId: string) => {
      if(!confirm('登録済みの画像を解除し、デフォルト表示に戻しますか？')) return;
      try {
          const { error } = await supabase.from('internal_doors').update({ image_url: null }).eq('id', recordId);
          if (error) throw error;
          setPriceList(prev => prev.map(p => p.id === recordId ? {...p, imageUrl: undefined} : p));
      } catch(e: any) { alert('削除に失敗しました: ' + e.message); }
  };

  const handleSort = (key: keyof PriceRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const typeOrder = useMemo(() => {
    const order: Record<string, number> = {};
    let index = 0;
    DOOR_GROUPS.forEach(group => { group.options.forEach(option => { order[option] = index++; }); });
    return order;
  }, []);

  const sortedPriceList = useMemo(() => {
    let items = [...priceList];
    if (sortConfig) {
      items.sort((a, b) => {
        if (sortConfig.key === 'type') {
           const orderA = typeOrder[a.type] ?? 9999;
           const orderB = typeOrder[b.type] ?? 9999;
           if (orderA !== orderB) return sortConfig.direction === 'asc' ? orderA - orderB : orderB - orderA;
           return 0;
        }
        // @ts-ignore
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        // @ts-ignore
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [priceList, sortConfig, typeOrder]);

  const handleStartEdit = (record: PriceRecord) => { setEditingId(record.id!); setEditValues({ ...record }); };
  const handleCancelEdit = () => { setEditingId(null); setEditValues({}); };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase.from('internal_doors').update({
        design: editValues.design, frame_price: editValues.framePrice, door_price: editValues.doorPrice, set_price: editValues.setPrice,
      }).eq('id', editingId);
      if (error) throw error;
      setPriceList(prev => prev.map(p => p.id === editingId ? { ...p, ...editValues } as PriceRecord : p));
      setEditingId(null); setEditValues({}); alert('更新しました');
    } catch (e: any) { alert('更新に失敗しました: ' + e.message); }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('このデータを削除してもよろしいですか？')) return;
    try {
      const { error } = await supabase.from('internal_doors').delete().eq('id', id);
      if (error) throw error;
      setPriceList(prev => prev.filter(p => p.id !== id));
      alert('削除しました');
    } catch (e: any) { alert('削除に失敗しました: ' + e.message); }
  };

  const handleAddDoor = async () => {
    if (!newDoor.type || !newDoor.design || !newDoor.height) { alert('必須項目を入力してください'); return; }
    try {
      setIsAdding(true);
      const doorData = {
        type: newDoor.type, location: newDoor.location || UsageLocation.Room, design: newDoor.design, height: newDoor.height,
        frame_price: newDoor.framePrice || 0, door_price: newDoor.doorPrice || 0, set_price: newDoor.setPrice || ((newDoor.framePrice || 0) + (newDoor.doorPrice || 0)),
        image_url: newDoor.imageUrl || null
      };
      const { data, error } = await supabase.from('internal_doors').insert([doorData]).select();
      if (error) throw error;
      if (data) {
        const addedRecord: PriceRecord = {
          id: data[0].id, type: data[0].type, location: data[0].location as UsageLocation, design: data[0].design,
          notes: '', height: data[0].height, framePrice: data[0].frame_price, doorPrice: data[0].door_price, setPrice: data[0].set_price, imageUrl: data[0].image_url
        };
        setPriceList(prev => [...prev, addedRecord]);
        // NEW: Do not reset newDoor state to allow sequential additions with same/similar specs
        alert('登録しました');
      }
    } catch (e: any) { alert('登録に失敗しました: ' + e.message); } finally { setIsAdding(false); }
  };

  const handleAddStorage = async () => {
    if (!newStorage.id || !newStorage.name || !newStorage.category) { alert('必須項目を入力してください'); return; }
    try {
      setIsAdding(true);
      const storageData = { id: newStorage.id, name: newStorage.name, category: newStorage.category, width: newStorage.width || 0, price: newStorage.price || 0, image_url: newStorage.imageUrl || null };
      const { data, error } = await supabase.from('entrance_storages').insert([storageData]).select();
      if (error) throw error;
      if (data) {
        const addedRecord: StorageTypeRecord = { id: data[0].id, name: data[0].name, category: data[0].category, width: data[0].width, price: data[0].price, imageUrl: data[0].image_url };
        setStorageTypes(prev => [...prev, addedRecord]);
        // NEW: Also keeping storage info for convenience
        alert('登録しました');
      }
    } catch (e: any) { alert('登録に失敗しました: ' + e.message); } finally { setIsAdding(false); }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 animate-in fade-in" onClick={onClose}>
      <div 
        id="resizable-modal"
        className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in relative" 
        style={{ width: `${modalWidth}px`, height: '96vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Resize Handle */}
        <div 
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400/30 active:bg-blue-600/50 transition-colors z-[400]"
          onMouseDown={startResizing}
          title="ドラッグして幅を調整"
        />

        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2 select-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            登録データ確認・編集
            <span className="text-[10px] font-normal text-gray-400 ml-2">(右端をドラッグで幅調整可能)</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 select-none">
          <button
            onClick={() => setActiveTab('door')}
            className={`px-4 py-2 text-xs font-bold transition-colors ${activeTab === 'door' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            内部建具 価格・PDF一覧
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 text-xs font-bold transition-colors ${activeTab === 'storage' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            玄関収納 価格一覧
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-4 py-2 text-xs font-bold transition-colors ${activeTab === 'shipping' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            送料一覧
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-0 bg-white custom-scrollbar">
          {activeTab === 'door' ? (
            <div className="flex flex-col h-full">
              {/* Add New Section */}
              <div className="bg-blue-50 p-2 border-b border-blue-100 shrink-0">
                <details className="group">
                  <summary className="font-bold text-blue-800 cursor-pointer flex items-center gap-2 list-none text-xs">
                    <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm group-open:rotate-90 transition-transform">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </span>
                    新しい建具データを追加する
                  </summary>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end animate-in slide-in-from-top-2">
                    <div className="col-span-1 lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">種類</label>
                      <select 
                        className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newDoor.type}
                        onChange={(e) => setNewDoor(p => ({...p, type: e.target.value}))}
                      >
                         {DOOR_GROUPS.map(g => (
                           <optgroup key={g.label} label={g.label}>
                             {g.options.map(o => <option key={o} value={o}>{o}</option>)}
                           </optgroup>
                         ))}
                      </select>
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 block">設置場所</label>
                      <select
                         className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                         value={newDoor.location}
                         onChange={(e) => setNewDoor(p => ({...p, location: e.target.value as UsageLocation}))}
                      >
                        <option value={UsageLocation.Room}>居室</option>
                        <option value={UsageLocation.LD}>LD</option>
                        <option value={UsageLocation.Toilet}>トイレ・洗面</option>
                      </select>
                    </div>
                    <div className="col-span-1 lg:col-span-2 space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 block">デザイン</label>
                       <input 
                         type="text" 
                         className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="例: フラット"
                         value={newDoor.design}
                         onChange={(e) => setNewDoor(p => ({...p, design: e.target.value}))}
                       />
                    </div>
                    <div className="col-span-1 space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 block">高さ</label>
                       <select 
                         className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                         value={newDoor.height}
                         onChange={(e) => setNewDoor(p => ({...p, height: e.target.value}))}
                       >
                         <option value="H2000">H2000</option>
                         <option value="H2200">H2200</option>
                         <option value="H2400">H2400</option>
                         <option value="H900">H900</option>
                         <option value="H1200">H1200</option>
                       </select>
                    </div>
                    <div className="col-span-1 space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 block">枠価格</label>
                       <input 
                         type="number" 
                         className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="0"
                         value={newDoor.framePrice || ''}
                         onChange={(e) => {
                             const frame = parseInt(e.target.value) || 0;
                             setNewDoor(p => ({...p, framePrice: frame, setPrice: frame + (p.doorPrice || 0) }));
                         }}
                       />
                    </div>
                    <div className="col-span-1 space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 block">扉価格</label>
                       <input 
                         type="number" 
                         className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="0"
                         value={newDoor.doorPrice || ''}
                         onChange={(e) => {
                             const door = parseInt(e.target.value) || 0;
                             setNewDoor(p => ({...p, doorPrice: door, setPrice: (p.framePrice || 0) + door }));
                         }}
                       />
                    </div>
                    <div className="col-span-full mt-2 flex justify-end">
                      <button 
                        onClick={handleAddDoor} 
                        disabled={isAdding}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
                      >
                        {isAdding ? '保存中...' : '追加する'}
                      </button>
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex-grow overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="p-2 border-b cursor-pointer hover:bg-gray-200 transition-colors select-none group" onClick={() => handleSort('type')}>
                        <div className="flex items-center gap-1">
                          種別
                          <span className="text-gray-400 group-hover:text-gray-600">
                             {sortConfig?.key === 'type' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}
                          </span>
                        </div>
                      </th>
                      <th className="p-2 border-b">デザイン</th>
                      <th className="p-2 border-b text-center">高さ</th>
                      <th className="p-2 border-b text-right">枠価格</th>
                      <th className="p-2 border-b text-right">扉価格</th>
                      <th className="p-2 border-b text-right bg-blue-50">セット価格</th>
                      <th className="p-2 border-b font-mono w-40">画像/PDF</th>
                      <th className="p-2 border-b text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedPriceList.map((row, index) => {
                      const isEditing = editingId === row.id;
                      return (
                        <tr key={row.id || index} className={`transition-colors ${isEditing ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <td className="p-1.5 font-medium text-gray-800">{row.type}</td>
                          <td className="p-1.5">{isEditing ? <input type="text" className="w-full border rounded px-1 py-0.5" value={editValues.design || ''} onChange={(e) => setEditValues(prev => ({...prev, design: e.target.value}))}/> : row.design}</td>
                          <td className="p-1.5 text-center font-mono">{row.height}</td>
                          <td className="p-1.5 text-right font-mono text-gray-500">{isEditing ? <input type="number" className="w-20 text-right border rounded px-1 py-0.5" value={editValues.framePrice} onChange={(e) => { const val = parseInt(e.target.value) || 0; setEditValues(prev => ({...prev, framePrice: val, setPrice: val + (prev.doorPrice || 0) })); }}/> : `¥${row.framePrice.toLocaleString()}`}</td>
                          <td className="p-1.5 text-right font-mono text-gray-500">{isEditing ? <input type="number" className="w-20 text-right border rounded px-1 py-0.5" value={editValues.doorPrice} onChange={(e) => { const val = parseInt(e.target.value) || 0; setEditValues(prev => ({...prev, doorPrice: val, setPrice: (prev.framePrice || 0) + val })); }}/> : `¥${row.doorPrice.toLocaleString()}`}</td>
                          <td className={`p-1.5 text-right font-mono font-bold ${isEditing ? 'text-orange-600' : 'text-blue-600 bg-blue-50/30'}`}>{isEditing ? <input type="number" className="w-20 text-right border rounded px-1 py-0.5 font-bold" value={editValues.setPrice} onChange={(e) => setEditValues(prev => ({...prev, setPrice: parseInt(e.target.value) || 0 }))}/> : `¥${row.setPrice.toLocaleString()}`}</td>
                          <td className="p-1.5 font-mono text-xs text-gray-500 align-middle">
                            {!isEditing && (
                              <div className="flex flex-col gap-2">
                                {uploadingId === row.id ? <div className="flex items-center gap-2 text-blue-600 font-bold"><div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>Up...</div> : (
                                  <>
                                  {row.imageUrl ? <div className="flex items-center justify-between bg-blue-50 p-1 rounded border border-blue-100 w-full"><a href={row.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1 block w-20" title={row.imageUrl}>{row.imageUrl.split('/').pop()}</a>{row.id && <button onClick={() => handleDeleteImage(row.id!)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-0.5 transition-colors ml-1 shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>}</div> : <span className="text-gray-400 text-[10px] flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>{getFileName(row)} (自動)</span>}
                                  {row.id && <div className="border border-dashed border-gray-300 rounded px-1 py-1.5 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all relative group bg-gray-50/50" onDrop={(e) => row.id && handleDrop(e, row.id)} onDragOver={handleDragOver} onClick={() => row.id && fileInputRefs.current[row.id]?.click()} title="ファイルをドロップ または クリックしてアップロード"><input type="file" className="hidden" ref={el => { if(row.id) fileInputRefs.current[row.id] = el; }} onChange={(e) => row.id && handleFileSelect(e, row.id)} accept="image/*,application/pdf"/><div className="text-[10px] text-gray-500 pointer-events-none flex items-center justify-center gap-1"><svg className="w-3 h-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg><span className="group-hover:text-blue-600">登録/上書</span></div></div>}
                                </>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-1.5 text-center">
                            {isEditing ? <div className="flex flex-col gap-2"><button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded font-bold">保存</button><button onClick={handleCancelEdit} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] px-2 py-1 rounded">キャンセル</button></div> : <div className="flex flex-col gap-2"><button onClick={() => handleStartEdit(row)} className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 text-[10px] px-2 py-1 rounded font-bold transition-colors">編集</button><button onClick={() => row.id && handleDeleteRecord(row.id)} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-[10px] px-2 py-1 rounded transition-colors">削除</button></div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'storage' ? (
            <div className="flex flex-col h-full">
               <div className="bg-blue-50 p-2 border-b border-blue-100 shrink-0">
                <details className="group">
                  <summary className="font-bold text-blue-800 cursor-pointer flex items-center gap-2 list-none text-xs"><span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm group-open:rotate-90 transition-transform"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg></span>新しい玄関収納データを追加する</summary>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end animate-in slide-in-from-top-2">
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-gray-500 block">ID (型番)</label><input type="text" className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例: E99" value={newStorage.id} onChange={(e) => setNewStorage(p => ({...p, id: e.target.value}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-gray-500 block">カテゴリー</label><select className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none" value={newStorage.category} onChange={(e) => setNewStorage(p => ({...p, category: e.target.value}))}>{STORAGE_CATEGORIES.filter(c => c !== "なし").map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
                    <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold text-gray-500 block">商品名</label><input type="text" className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例: W1200トール" value={newStorage.name} onChange={(e) => setNewStorage(p => ({...p, name: e.target.value}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-gray-500 block">幅(mm)</label><input type="number" className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="800" value={newStorage.width || ''} onChange={(e) => setNewStorage(p => ({...p, width: parseInt(e.target.value) || 0}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-gray-500 block">本体価格</label><input type="number" className="w-full text-xs border border-blue-300 rounded p-1.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" value={newStorage.price || ''} onChange={(e) => setNewStorage(p => ({...p, price: parseInt(e.target.value) || 0}))}/></div>
                    <div className="col-span-full mt-2 flex justify-end"><button onClick={handleAddStorage} disabled={isAdding} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50">{isAdding ? '保存中...' : '追加する'}</button></div>
                  </div>
                </details>
              </div>
              <div className="flex-grow overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 shadow-sm z-10">
                    <tr><th className="p-2 border-b">ID</th><th className="p-2 border-b">カテゴリー</th><th className="p-2 border-b">名称</th><th className="p-2 border-b text-right">幅(mm)</th><th className="p-2 border-b text-right bg-blue-50">本体価格</th><th className="p-2 border-b font-mono">画像</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {storageTypes.filter(s => s.id !== 'NONE').map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors"><td className="p-1.5 font-mono text-gray-500">{row.id}</td><td className="p-1.5 text-gray-800 font-medium">{row.category}</td><td className="p-1.5">{row.name}</td><td className="p-1.5 text-right font-mono">{row.width}</td><td className="p-1.5 text-right font-mono font-bold text-blue-600 bg-blue-50/30">¥{row.price.toLocaleString()}</td><td className="p-1.5 font-mono text-xs text-gray-500 truncate">{row.imageUrl ? <a href={row.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">画像リンク</a> : "標準PDF"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <table className="w-full max-w-3xl text-xs text-left border-collapse shadow-sm my-4 border">
                <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 shadow-sm z-10">
                  <tr><th className="p-2 border-b w-24 text-center">ID</th><th className="p-2 border-b">都道府県</th><th className="p-2 border-b text-right">送料 (円)</th><th className="p-2 border-b text-center w-32">編集</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {shippingFees.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors"><td className="p-1.5 text-center text-gray-400 font-mono">{row.id}</td><td className="p-1.5 font-bold text-gray-800">{row.prefecture}</td><td className="p-1.5 text-right"><div className="flex justify-end items-center gap-1"><span className="text-gray-400 font-mono">¥</span><input type="number" value={row.price} onChange={(e) => onUpdateShipping(row.id, parseInt(e.target.value) || 0)} className="text-right font-mono font-bold text-blue-600 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none w-24 hover:border-gray-400 transition-colors"/></div></td><td className="p-1.5 text-center text-xs text-green-600 font-bold">保存済み</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-2 border-t text-right text-[10px] text-gray-500 select-none">
           Showing {activeTab === 'door' ? priceList.length : activeTab === 'storage' ? storageTypes.length - 1 : shippingFees.length} records | Modal Width: {Math.round(modalWidth)}px
        </div>
      </div>
    </div>
  );
};
