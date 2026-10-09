
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { getDoorDetailPdfUrl, getStorageDetailPdfUrl, DOOR_GROUPS, STORAGE_CATEGORIES, DOOR_SPEC_MASTER } from '../constants';
import { DoorItem, PriceRecord, StorageTypeRecord, ShippingFeeRecord, UsageLocation, DoorType } from '../types';
import { supabase } from '../supabase';

interface DataViewerModalProps {
  onClose: () => void;
  priceList: PriceRecord[];
  storageTypes: StorageTypeRecord[];
  shippingFees: ShippingFeeRecord[];
  handleMaster: HandleRecord[];
  baseboardRecordMaster: BaseboardItem[];
  onUpdateShipping: (id: number, price: number) => void;
  setPriceList: React.Dispatch<React.SetStateAction<PriceRecord[]>>;
  setStorageTypes: React.Dispatch<React.SetStateAction<StorageTypeRecord[]>>;
  setHandleMaster: React.Dispatch<React.SetStateAction<HandleRecord[]>>;
  setBaseboardMaster: React.Dispatch<React.SetStateAction<BaseboardItem[]>>;
  storageOptionPrices?: {
    mirror: number;
    filler: number;
    daiwa_800: number;
    daiwa_1200: number;
    daiwa_1600: number;
    daiwa_2000: number;
  };
  setStorageOptionPrices?: React.Dispatch<React.SetStateAction<{
    mirror: number;
    filler: number;
    daiwa_800: number;
    daiwa_1200: number;
    daiwa_1600: number;
    daiwa_2000: number;
  }>>;
  emailSettings?: {
    toEmail: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  setEmailSettings?: React.Dispatch<React.SetStateAction<{
    toEmail: string;
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }>>;
}

export const DataViewerModal: React.FC<DataViewerModalProps> = ({ 
  onClose, 
  priceList, 
  storageTypes, 
  shippingFees, 
  handleMaster,
  baseboardRecordMaster,
  onUpdateShipping,
  setPriceList,
  setStorageTypes,
  setHandleMaster,
  setBaseboardMaster,
  storageOptionPrices,
  setStorageOptionPrices,
  emailSettings,
  setEmailSettings
}) => {
  const [activeTab, setActiveTab] = useState<'door' | 'storage' | 'shipping' | 'handle' | 'baseboard' | 'email'>('door');
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const pbFileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [localOptionPrices, setLocalOptionPrices] = useState({
    mirror: 11440,
    filler: 2200,
    daiwa_800: 2530,
    daiwa_1200: 3410,
    daiwa_1600: 4070,
    daiwa_2000: 4290
  });

  const [localEmailSettings, setLocalEmailSettings] = useState({
    toEmail: 'takishita@kashiwa-f.com',
    host: '',
    port: 587,
    user: '',
    pass: '',
    from: ''
  });

  useEffect(() => {
    if (storageOptionPrices) {
      setLocalOptionPrices(storageOptionPrices);
    }
  }, [storageOptionPrices]);

  useEffect(() => {
    if (emailSettings) {
      setLocalEmailSettings(emailSettings);
    }
  }, [emailSettings]);

  const handleSaveEmailSettings = async () => {
    const metaString = JSON.stringify(localEmailSettings);
    try {
      const { data: existingRecord } = await supabase.from('baseboard_master').select('id').eq('product', '__email_settings_config__').maybeSingle();
      if (existingRecord) {
        await supabase.from('baseboard_master').update({ pb_image_url: metaString }).eq('id', existingRecord.id);
      } else {
        await supabase.from('baseboard_master').insert([{ product: '__email_settings_config__', pb_image_url: metaString }]);
      }
      if (setEmailSettings) {
        setEmailSettings(localEmailSettings);
      }
      alert('メール送信設定を保存しました。');
    } catch (e: any) {
      alert('メール設定の保存に失敗しました: ' + e.message);
    }
  };

  const handleSaveStorageOptions = async () => {
    const metaString = JSON.stringify(localOptionPrices);
    try {
      const { data: existingRecord } = await supabase.from('baseboard_master').select('id').eq('product', '__storage_options_config__').maybeSingle();
      if (existingRecord) {
        await supabase.from('baseboard_master').update({ pb_image_url: metaString }).eq('id', existingRecord.id);
      } else {
        await supabase.from('baseboard_master').insert([{ product: '__storage_options_config__', pb_image_url: metaString }]);
      }
      if (setStorageOptionPrices) {
        setStorageOptionPrices(localOptionPrices);
      }
      alert('玄関収納のオプション単価を保存しました。');
    } catch (e: any) {
      alert('設定の保存に失敗しました: ' + e.message);
    }
  };

  const handleUpdateBaseboardMeta = async (product: string, price: number, unit: string) => {
    const currentItem = baseboardRecordMaster.find(b => b.product === product);
    const pbImageUrl = currentItem ? currentItem.pbImageUrl || '' : '';

    const meta = {
      imageUrl: pbImageUrl,
      price,
      unit
    };
    const metaString = JSON.stringify(meta);

    try {
      const { data: existingRecord } = await supabase.from('baseboard_master').select('id').eq('product', product).maybeSingle();
      if (existingRecord) {
        await supabase.from('baseboard_master').update({ pb_image_url: metaString }).eq('id', existingRecord.id);
      } else {
        await supabase.from('baseboard_master').insert([{ product, pb_image_url: metaString }]);
      }

      setBaseboardMaster(prev => prev.map(item => item.product === product ? { ...item, unitPrice: price, unit } : item));
    } catch (e: any) {
      alert('造作材設定の保存に失敗しました: ' + e.message);
    }
  };

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
  const [sortConfig, setSortConfig] = useState<{ key: keyof PriceRecord; direction: 'asc' | 'desc' } | null>({ key: 'type', direction: 'asc' });

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null);
  const [editStorageValues, setEditStorageValues] = useState<Partial<StorageTypeRecord>>({});

  // Initial Form Values
  const initialDoorState: Partial<PriceRecord> = {
    type: DoorType.Hinged,
    location: UsageLocation.Room,
    design: 'フラット',
    notes: '',
    height: 'H2000',
    framePrice: 0,
    doorPrice: 0,
    setPrice: 0,
    imageUrl: ''
  };

  const initialStorageState: Partial<StorageTypeRecord> = {
    id: '',
    name: '',
    category: STORAGE_CATEGORIES[1],
    width: 800,
    price: 0,
    imageUrl: ''
  };

  // New Door State
  const [newDoor, setNewDoor] = useState<Partial<PriceRecord>>(initialDoorState);

  // New Storage State
  const [newStorage, setNewStorage] = useState<Partial<StorageTypeRecord>>(initialStorageState);

  const getFileName = (url: string) => {
    try {
      return url.split('/').pop() || url;
    } catch (e) {
      return url;
    }
  };

  const handleFileUpload = async (file: File, recordId: string, isStorage: boolean = false, isPB: boolean = false, type: 'door' | 'storage' | 'handle' | 'baseboard' = 'door', pbSide?: 'L' | 'R') => {
    try {
      const suffix = pbSide ? `_${pbSide}` : '';
      setUploadingId(recordId + (isPB ? `_pb${suffix}` : '_detail'));
      const fileExt = file.name.split('.').pop();
      const prefix = isPB ? `pb${suffix.toLowerCase()}_` : '';
      
      const safeRecordId = btoa(encodeURIComponent(recordId)).substring(0, 10).replace(/[/+=]/g, '');
      const fileName = `${prefix}${type}_${safeRecordId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('door-images').upload(filePath, file);
      if (uploadError) throw new Error(`画像の保存に失敗しました: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('door-images').getPublicUrl(filePath);
      
      let tableName = 'internal_doors';
      if (type === 'storage') tableName = 'entrance_storages';
      if (type === 'handle') tableName = 'handle_master';
      if (type === 'baseboard') tableName = 'baseboard_master';

      const fieldName = isPB ? (pbSide ? `pb_image_url_${pbSide.toLowerCase()}` : 'pb_image_url') : 'image_url';
      const idField = (type === 'baseboard') ? 'product' : (type === 'handle') ? 'name' : 'id';

      // Use upsert/insert logic for masters, update for others
      if (type === 'handle' || type === 'baseboard') {
        let payloadValue: any = publicUrl;

        if (type === 'baseboard') {
          const currentItem = baseboardRecordMaster.find(b => b.product === recordId);
          const price = currentItem ? currentItem.unitPrice : 0;
          const unit = currentItem ? currentItem.unit : '';
          const meta = {
            imageUrl: publicUrl,
            price,
            unit
          };
          payloadValue = JSON.stringify(meta);
        }

        const payload = { [idField]: recordId, [fieldName]: payloadValue };
        
        console.log(`Saving to ${tableName}:`, payload);
        
        // Try to find if record exists by name/product
        const { data: existingRecord, error: findError } = await supabase.from(tableName).select('id').eq(idField, recordId).maybeSingle();
        
        if (findError) {
          console.warn(`Error finding record in ${tableName}:`, findError.message);
        }

        if (existingRecord) {
          console.log(`Found existing record with ID ${existingRecord.id} in ${tableName}, updating...`);
          const { error: dbError } = await supabase.from(tableName).update({ [fieldName]: payloadValue }).eq('id', existingRecord.id);
          if (dbError) {
            console.error('Update failed:', dbError);
            throw new Error(`更新に失敗しました。Supabaseのポリシー(RLS)を確認してください: ${dbError.message}`);
          }
        } else {
          console.log(`Record not found in ${tableName}, inserting new entry...`);
          const { error: dbError } = await supabase.from(tableName).insert([payload]);
          if (dbError) {
            console.error(`Insert failed for ${tableName}:`, dbError);
            throw new Error(`新規登録に失敗しました。Supabaseの管理画面で[handle_master/baseboard_master]テーブルのINSERT権限(RLS)が許可されているか確認してください。\n詳細: ${dbError.message}`);
          }
        }
      } else {
        const { error: dbError } = await supabase.from(tableName).update({ [fieldName]: publicUrl }).eq(idField, recordId);
        if (dbError) throw new Error(`データベースの更新に失敗しました: ${dbError.message}`);
      }

      if (type === 'storage') {
        setStorageTypes(prev => prev.map(item => item.id === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
      } else if (type === 'door') {
        const fieldKey = isPB ? (pbSide ? (pbSide === 'L' ? 'pbImageUrlL' : 'pbImageUrlR') : 'pbImageUrl') : 'imageUrl';
        setPriceList(prev => prev.map(item => item.id === recordId ? { ...item, [fieldKey]: publicUrl } : item));
      } else if (type === 'handle') {
        setHandleMaster(prev => prev.map(item => item.name === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
      } else if (type === 'baseboard') {
        setBaseboardMaster(prev => prev.map(item => item.product === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
      }
    } catch (error: any) {
      alert('アップロード失敗:\n' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, recordId: string, isStorage: boolean = false, isPB: boolean = false, type: 'door' | 'storage' | 'handle' | 'baseboard' = 'door', pbSide?: 'L' | 'R') => {
    if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0], recordId, isStorage, isPB, type, pbSide);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, recordId: string, isStorage: boolean = false, isPB: boolean = false, type: 'door' | 'storage' | 'handle' | 'baseboard' = 'door', pbSide?: 'L' | 'R') => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0], recordId, isStorage, isPB, type, pbSide);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDeleteImage = async (recordId: string, isStorage: boolean = false, isPB: boolean = false, type: 'door' | 'storage' | 'handle' | 'baseboard' = 'door', pbSide?: 'L' | 'R') => {
      const suffixText = pbSide ? (pbSide === 'L' ? '(左/勝手)' : '(右/勝手)') : '';
      if(!confirm(`登録済みの${isPB ? 'プレゼン用画像' + suffixText : '詳細図PDF/画像'}を解除し、初期状態に戻しますか？`)) return;
      try {
          let tableName = 'internal_doors';
          if (type === 'storage') tableName = 'entrance_storages';
          if (type === 'handle') tableName = 'handle_master';
          if (type === 'baseboard') tableName = 'baseboard_master';

          const fieldName = isPB ? (pbSide ? `pb_image_url_${pbSide.toLowerCase()}` : 'pb_image_url') : 'image_url';
          const idField = (type === 'baseboard') ? 'product' : (type === 'handle') ? 'name' : 'id';

          if (type === 'handle' || type === 'baseboard') {
             const { data: existingRecord } = await supabase.from(tableName).select('id').eq(idField, recordId).maybeSingle();
             if (existingRecord) {
                let updatePayload: any = { [fieldName]: null };
                if (type === 'baseboard') {
                  const currentItem = baseboardRecordMaster.find(b => b.product === recordId);
                  const price = currentItem ? currentItem.unitPrice : 0;
                  const unit = currentItem ? currentItem.unit : '';
                  const meta = {
                    imageUrl: null,
                    price,
                    unit
                  };
                  updatePayload = { [fieldName]: JSON.stringify(meta) };
                }
                await supabase.from(tableName).update(updatePayload).eq('id', existingRecord.id);
             } else {
                // If it doesn't exist in DB, nothing to delete from DB
                console.log(`Record ${recordId} not in DB, skipping DB delete`);
             }
          } else {
             await supabase.from(tableName).update({ [fieldName]: null }).eq(idField, recordId);
          }
          
          if (type === 'storage') {
            setStorageTypes(prev => prev.map(s => s.id === recordId ? {...s, [isPB ? 'pbImageUrl' : 'imageUrl']: undefined} : s));
          } else if (type === 'door') {
            const fieldKey = isPB ? (pbSide ? (pbSide === 'L' ? 'pbImageUrlL' : 'pbImageUrlR') : 'pbImageUrl') : 'imageUrl';
            setPriceList(prev => prev.map(p => p.id === recordId ? {...p, [fieldKey]: undefined} : p));
          } else if (type === 'handle') {
            setHandleMaster(prev => prev.map(h => h.name === recordId ? {...h, [isPB ? 'pbImageUrl' : 'imageUrl']: undefined} : h));
          } else if (type === 'baseboard') {
            setBaseboardMaster(prev => prev.map(b => b.product === recordId ? {...b, [isPB ? 'pbImageUrl' : 'imageUrl']: undefined} : b));
          }
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
    const compareValues = (key: keyof PriceRecord, valA: any, valB: any) => {
      if (key === 'type') return (typeOrder[valA] ?? 9999) - (typeOrder[valB] ?? 9999);
      if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB, 'ja');
      if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
      return 0;
    };
    items.sort((a, b) => {
      let comparison = 0;
      if (sortConfig) {
        // @ts-ignore
        comparison = compareValues(sortConfig.key, a[sortConfig.key], b[sortConfig.key]);
        if (sortConfig.direction === 'desc') comparison *= -1;
      }
      if (comparison === 0) {
        const typeComp = compareValues('type', a.type, b.type);
        if (typeComp !== 0) return typeComp;
        const designComp = compareValues('design', a.design, b.design);
        if (designComp !== 0) return designComp;
        return compareValues('height', a.height, b.height);
      }
      return comparison;
    });
    return items;
  }, [priceList, sortConfig, typeOrder]);

  const sortedStorageList = useMemo(() => {
    let items = storageTypes.filter(s => s.id !== 'NONE');
    // デフォルトでカテゴリー順に
    items.sort((a, b) => a.category.localeCompare(b.category, 'ja'));
    return items;
  }, [storageTypes]);

  const [doorPage, setDoorPage] = useState(1);
  const [storagePage, setStoragePage] = useState(1);
  const itemsPerPage = 20;

  const paginatedPriceList = useMemo(() => {
    const start = (doorPage - 1) * itemsPerPage;
    return sortedPriceList.slice(start, start + itemsPerPage);
  }, [sortedPriceList, doorPage]);

  const paginatedStorageList = useMemo(() => {
    const start = (storagePage - 1) * itemsPerPage;
    return sortedStorageList.slice(start, start + itemsPerPage);
  }, [sortedStorageList, storagePage]);

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

  const handleStartStorageEdit = (record: StorageTypeRecord) => { setEditingStorageId(record.id); setEditStorageValues({ ...record }); };
  const handleCancelStorageEdit = () => { setEditingStorageId(null); setEditStorageValues({}); };
  const handleSaveStorageEdit = async () => {
    if (!editingStorageId) return;
    try {
      const { error } = await supabase.from('entrance_storages').update({
        name: editStorageValues.name, category: editStorageValues.category, width: editStorageValues.width, price: editStorageValues.price
      }).eq('id', editingStorageId);
      if (error) throw error;
      setStorageTypes(prev => prev.map(s => s.id === editingStorageId ? { ...s, ...editStorageValues } as StorageTypeRecord : s));
      setEditingStorageId(null); setEditStorageValues({}); alert('更新しました');
    } catch (e: any) { alert('更新に失敗しました: ' + e.message); }
  };

  const handleDeleteRecord = async (id: string, isStorage: boolean = false) => {
    if (!confirm('このデータを削除してもよろしいですか？')) return;
    try {
      const tableName = isStorage ? 'entrance_storages' : 'internal_doors';
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      if (isStorage) setStorageTypes(prev => prev.filter(s => s.id !== id));
      else setPriceList(prev => prev.filter(p => p.id !== id));
      alert('削除しました');
    } catch (e: any) { alert('削除に失敗しました: ' + e.message); }
  };

  const handleAddDoor = async () => {
    if (!newDoor.type || !newDoor.design || !newDoor.height) { alert('必須項目を入力してください'); return; }
    try {
      setIsAdding(true);
      const doorData = {
        type: newDoor.type, 
        location: newDoor.location || UsageLocation.Room, 
        design: newDoor.design, 
        height: newDoor.height,
        frame_price: newDoor.framePrice || 0, 
        door_price: newDoor.doorPrice || 0, 
        set_price: newDoor.setPrice || ((newDoor.framePrice || 0) + (newDoor.doorPrice || 0)),
        image_url: newDoor.imageUrl || null,
        pb_image_url: null,
        pb_image_url_l: null,
        pb_image_url_r: null
      };
      const { data, error } = await supabase.from('internal_doors').insert([doorData]).select();
      if (error) throw error;
      if (data) {
        const addedRecord: PriceRecord = {
          id: data[0].id, type: data[0].type, location: data[0].location as UsageLocation, design: data[0].design,
          notes: data[0].notes || '', height: data[0].height, framePrice: data[0].frame_price, doorPrice: data[0].door_price, setPrice: data[0].set_price, 
          imageUrl: data[0].image_url,
          pbImageUrl: data[0].pb_image_url,
          pbImageUrlL: data[0].pb_image_url_l,
          pbImageUrlR: data[0].pb_image_url_r
        };
        setPriceList(prev => [...prev, addedRecord]);
        setNewDoor(initialDoorState);
        alert('内部建具を追加しました');
      }
    } catch (e: any) { alert('登録に失敗しました: ' + e.message); } finally { setIsAdding(false); }
  };

  const handleAddStorage = async () => {
    const trimmedId = newStorage.id?.trim();
    if (!trimmedId || !newStorage.name || !newStorage.category) { 
      alert('ID (型番)、カテゴリー、商品名は必須項目です。'); 
      return; 
    }

    // 重複チェック
    if (storageTypes.some(s => s.id === trimmedId)) {
      alert(`ID「${trimmedId}」は既に使用されています。別のIDを入力してください。`);
      return;
    }

    try {
      setIsAdding(true);
      const storageData = { 
        id: trimmedId, 
        name: newStorage.name, 
        category: newStorage.category, 
        width: newStorage.width || 0, 
        price: newStorage.price || 0, 
        image_url: newStorage.imageUrl || null,
        pb_image_url: null 
      };
      
      const { data, error } = await supabase.from('entrance_storages').insert([storageData]).select();
      if (error) {
        if (error.code === '23505') {
          throw new Error('このIDは既に登録されています。別のIDを入力してください。');
        }
        throw error;
      }

      if (data) {
        const addedRecord: StorageTypeRecord = { 
          id: data[0].id, 
          name: data[0].name, 
          category: data[0].category, 
          width: data[0].width, 
          price: data[0].price, 
          imageUrl: data[0].image_url,
          pbImageUrl: data[0].pb_image_url
        };
        setStorageTypes(prev => [...prev, addedRecord]);
        setNewStorage(initialStorageState);
        alert('玄関収納を追加しました');
      }
    } catch (e: any) { 
      alert('登録に失敗しました:\n' + e.message); 
    } finally { 
      setIsAdding(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/10 backdrop-blur-md p-2 animate-in fade-in" onClick={onClose}>
      <div 
        id="resizable-modal"
        className="bg-[#F5F5F7] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in relative border border-[#E5E5E7]" 
        style={{ width: `${modalWidth}px`, height: '96vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#0071E3]/20 active:bg-[#0071E3]/40 transition-colors z-[400]" onMouseDown={startResizing} title="ドラッグして幅を調整" />

        <div className="bg-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-[#E5E5E7]">
          <h2 className="text-xl font-bold flex items-center gap-3 select-none text-[#1D1D1F]">
            <div className="w-8 h-8 bg-[#F5F5F7] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-[#86868B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
            管理者メニュー
            <span className="text-[11px] font-medium text-[#86868B] ml-2 tracking-tight">商品・画像・送料管理</span>
          </h2>
          <button onClick={onClose} className="text-[#86868B] hover:text-[#1D1D1F] transition-colors p-2 hover:bg-[#F5F5F7] rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex bg-[#F5F5F7] p-1 gap-1 border-b border-[#E5E5E7] select-none">
          <button onClick={() => setActiveTab('door')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'door' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:bg-black/[0.02] hover:text-[#1D1D1F]'}`}>内部建具 価格・PDF一覧</button>
          <button onClick={() => setActiveTab('storage')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'storage' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:bg-black/[0.02] hover:text-[#1D1D1F]'}`}>玄関収納 価格一覧</button>
          <button onClick={() => setActiveTab('handle')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'handle' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:bg-black/[0.02] hover:text-[#1D1D1F]'}`}>取手マスター</button>
          <button onClick={() => setActiveTab('baseboard')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'baseboard' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:bg-black/[0.02] hover:text-[#1D1D1F]'}`}>巾木・ストッパー</button>
          <button onClick={() => setActiveTab('email')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'email' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:bg-black/[0.02] hover:text-[#1D1D1F]'}`}>メール送信設定</button>
          <button onClick={() => setActiveTab('shipping')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'shipping' ? 'bg-white shadow-sm text-[#0071E3]' : 'text-[#86868B] hover:bg-black/[0.02] hover:text-[#1D1D1F]'}`}>送料一覧</button>
        </div>

        <div className="flex-grow overflow-auto p-0 bg-white custom-scrollbar">
          {activeTab === 'door' ? (
            <div className="flex flex-col h-full">
              <div className="bg-white p-4 border-b border-[#E5E5E7] shrink-0">
                <details className="group">
                  <summary className="font-bold text-[#1D1D1F] cursor-pointer flex items-center gap-3 list-none text-sm hover:text-[#0071E3] transition-colors">
                    <span className="bg-[#0071E3] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm group-open:rotate-45 transition-transform">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </span>
                    新しい建具データを追加する
                  </summary>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end animate-in slide-in-from-top-2 p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7]">
                    <div className="col-span-1 lg:col-span-2 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">種類</label><select className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" value={newDoor.type} onChange={(e) => setNewDoor(p => ({...p, type: e.target.value}))}>{DOOR_GROUPS.map(g => (<optgroup key={g.label} label={g.label}>{g.options.map(o => <option key={o} value={o}>{o}</option>)}</optgroup>))}</select></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">設置場所</label><select className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" value={newDoor.location} onChange={(e) => setNewDoor(p => ({...p, location: e.target.value as UsageLocation}))}><option value={UsageLocation.Room}>居室</option><option value={UsageLocation.LD}>LD</option><option value={UsageLocation.Toilet}>トイレ・洗面</option></select></div>
                    <div className="col-span-1 lg:col-span-2 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">デザイン</label><input type="text" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="例: フラット" value={newDoor.design} onChange={(e) => setNewDoor(p => ({...p, design: e.target.value}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">高さ</label><select className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" value={newDoor.height} onChange={(e) => setNewDoor(p => ({...p, height: e.target.value}))}><option value="H2000">H2000</option><option value="H2200">H2200</option><option value="H2400">H2400</option><option value="H900">H900</option><option value="H1200">H1200</option></select></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">枠価格</label><input type="number" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="0" value={newDoor.framePrice || ''} onChange={(e) => { const frame = parseInt(e.target.value) || 0; setNewDoor(p => ({...p, framePrice: frame, setPrice: frame + (p.doorPrice || 0) })); }}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">扉価格</label><input type="number" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="0" value={newDoor.doorPrice || ''} onChange={(e) => { const door = parseInt(e.target.value) || 0; setNewDoor(p => ({...p, doorPrice: door, setPrice: (p.framePrice || 0) + door })); }}/></div>
                    <div className="col-span-1 lg:col-span-2 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">備考</label><input type="text" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="例: アンダーカット" value={newDoor.notes} onChange={(e) => setNewDoor(p => ({...p, notes: e.target.value}))}/></div>
                    <div className="col-span-full mt-2 flex justify-end"><button onClick={handleAddDoor} disabled={isAdding} className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold px-8 py-2.5 rounded-full shadow-md transition-all disabled:opacity-50 active:scale-95">{isAdding ? '保存中...' : '追加する'}</button></div>
                  </div>
                </details>
              </div>

              <div className="flex-grow overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#F5F5F7] text-[#86868B] font-bold sticky top-0 shadow-sm z-10 border-b border-[#E5E5E7]">
                    <tr>
                      <th className="p-3 cursor-pointer hover:bg-black/[0.02] transition-colors group" onClick={() => handleSort('type')}>種別<span className="text-[#86868B]/40 ml-1">{sortConfig?.key === 'type' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span></th>
                      <th className="p-3 cursor-pointer hover:bg-black/[0.02] transition-colors group" onClick={() => handleSort('design')}>デザイン<span className="text-[#86868B]/40 ml-1">{sortConfig?.key === 'design' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span></th>
                      <th className="p-3 cursor-pointer hover:bg-black/[0.02] transition-colors group" onClick={() => handleSort('notes')}>備考<span className="text-[#86868B]/40 ml-1">{sortConfig?.key === 'notes' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span></th>
                      <th className="p-3 text-center cursor-pointer hover:bg-black/[0.02] transition-colors group" onClick={() => handleSort('height')}>高さ<span className="text-[#86868B]/40 ml-1">{sortConfig?.key === 'height' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '▲▼'}</span></th>
                      <th className="p-3 text-right">枠価格</th>
                      <th className="p-3 text-right">扉価格</th>
                      <th className="p-3 text-right bg-white/50">セット価格</th>
                      <th className="p-3 w-40 text-center">詳細図/PDF</th>
                      <th className="p-3 w-40 text-center">プレゼン画像</th>
                      <th className="p-3 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPriceList.map((row) => {
                      const isEditing = editingId === row.id;
                      return (
                        <tr key={row.id} className={`${isEditing ? 'bg-[#0071E3]/5' : 'hover:bg-black/[0.01] transition-colors'} border-b border-[#E5E5E7]/50`}>
                          <td className="p-2 pl-3">{row.type}</td>
                          <td className="p-2">{isEditing ? <input className="w-full border border-[#E5E5E7] rounded p-1" value={editValues.design} onChange={e => setEditValues(p=>({...p, design:e.target.value}))}/> : row.design}</td>
                          <td className="p-2">{isEditing ? <input className="w-full border border-[#E5E5E7] rounded p-1" value={editValues.notes} onChange={e => setEditValues(p=>({...p, notes:e.target.value}))}/> : row.notes}</td>
                          <td className="p-2 text-center font-mono font-medium">{row.height}</td>
                          <td className="p-2 text-right font-mono">{isEditing ? <input type="number" className="w-20 text-right border border-[#E5E5E7] rounded p-1" value={editValues.framePrice} onChange={e => { const v = parseInt(e.target.value)||0; setEditValues(p=>({...p, framePrice:v, setPrice: v + (p.doorPrice||0) })) }}/> : `¥${row.framePrice.toLocaleString()}`}</td>
                          <td className="p-2 text-right font-mono">{isEditing ? <input type="number" className="w-20 text-right border border-[#E5E5E7] rounded p-1" value={editValues.doorPrice} onChange={e => { const v = parseInt(e.target.value)||0; setEditValues(p=>({...p, doorPrice:v, setPrice: (p.framePrice||0) + v })) }}/> : `¥${row.doorPrice.toLocaleString()}`}</td>
                          <td className="p-2 text-right font-mono font-bold text-[#0071E3] bg-[#0071E3]/5">{isEditing ? <input type="number" className="w-20 text-right border border-[#E5E5E7] rounded p-1 font-bold text-[#0071E3]" value={editValues.setPrice} onChange={e => setEditValues(p=>({...p, setPrice:parseInt(e.target.value)||0}))}/> : `¥${row.setPrice.toLocaleString()}`}</td>
                          <td className="p-2 border-r border-[#E5E5E7]/30">
                            {uploadingId === (row.id + '_detail') ? "UP中..." : (
                              <div className="flex flex-col gap-1">
                                {row.imageUrl ? (
                                  <div className="flex items-center gap-1 bg-white p-1 border border-[#E5E5E7] rounded-lg shadow-sm">
                                    <a href={row.imageUrl} target="_blank" className="truncate flex-1 text-[#0071E3] text-[10px] font-medium" title={getFileName(row.imageUrl)}>
                                      {getFileName(row.imageUrl)}
                                    </a>
                                    <button onClick={()=>handleDeleteImage(row.id!)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors">×</button>
                                  </div>
                                ) : (
                                  <span className="text-[#86868B]/40 text-[10px] truncate block text-center italic" title={getFileName(getDoorDetailPdfUrl(row as unknown as DoorItem))}>
                                    未登録(自動割当済)
                                  </span>
                                )}
                                <div className="border border-dashed border-[#E5E5E7] p-2 text-center cursor-pointer hover:bg-black/[0.02] rounded-lg transition-all" onClick={() => row.id && fileInputRefs.current[row.id]?.click()} onDrop={(e) => row.id && handleDrop(e, row.id)} onDragOver={handleDragOver}><input type="file" className="hidden" ref={el => { if(row.id) fileInputRefs.current[row.id] = el; }} onChange={e => row.id && handleFileSelect(e, row.id)}/><span className="text-[9px] text-[#86868B] font-bold">PDF/詳細図登録</span></div>
                              </div>
                            )}
                          </td>
                          <td className="p-1.5">
                            {(() => {
                              const spec = DOOR_SPEC_MASTER[row.type];
                              const hasHanging = spec && spec.hangingSides && spec.hangingSides.length > 1 && !spec.hangingSides.includes('なし') && !spec.hangingSides.includes('―');
                              
                              if (hasHanging) {
                                return (
                                  <div className="flex flex-col gap-2">
                                    {/* Left Side */}
                                    <div className="flex flex-col gap-1 border-b border-[#E5E5E7] pb-1">
                                      <div className="text-[8px] font-bold text-[#86868B] uppercase tracking-tighter">左(勝手/吊元)</div>
                                      {uploadingId === (row.id + '_pb_L') ? "UP中..." : (
                                        <div className="flex flex-col gap-1">
                                          {row.pbImageUrlL ? (
                                            <div className="flex items-center gap-1 bg-white border border-[#E5E5E7] rounded-lg p-1 shadow-sm">
                                              <img src={row.pbImageUrlL} className="w-5 h-5 object-cover rounded shadow-xs" referrerPolicy="no-referrer" />
                                              <a href={row.pbImageUrlL} target="_blank" className="truncate flex-1 text-[#0071E3] text-[9px] font-medium" title={getFileName(row.pbImageUrlL)}>
                                                {getFileName(row.pbImageUrlL)}
                                              </a>
                                              <button onClick={()=>handleDeleteImage(row.id!, false, true, 'door', 'L')} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors">×</button>
                                            </div>
                                          ) : (
                                            <span className="text-[#86868B]/40 text-[9px] block text-center italic">未登録</span>
                                          )}
                                          <div className="border border-dashed border-[#E5E5E7] p-1.5 text-center cursor-pointer hover:bg-black/[0.02] rounded-lg transition-all" onClick={() => row.id && pbFileInputRefs.current[row.id + '_L']?.click()} onDrop={(e) => row.id && handleDrop(e, row.id, false, true, 'door', 'L')} onDragOver={handleDragOver}>
                                            <input type="file" className="hidden" ref={el => { if(row.id) pbFileInputRefs.current[row.id + '_L'] = el; }} onChange={e => row.id && handleFileSelect(e, row.id, false, true, 'door', 'L')}/>
                                            <span className="text-[9px] text-[#0071E3] font-bold">左画像UP</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {/* Right Side */}
                                    <div className="flex flex-col gap-1">
                                      <div className="text-[8px] font-bold text-[#86868B] uppercase tracking-tighter">右(勝手/吊元)</div>
                                      {uploadingId === (row.id + '_pb_R') ? "UP中..." : (
                                        <div className="flex flex-col gap-1">
                                          {row.pbImageUrlR ? (
                                            <div className="flex items-center gap-1 bg-white border border-[#E5E5E7] rounded-lg p-1 shadow-sm">
                                              <img src={row.pbImageUrlR} className="w-5 h-5 object-cover rounded shadow-xs" referrerPolicy="no-referrer" />
                                              <a href={row.pbImageUrlR} target="_blank" className="truncate flex-1 text-[#0071E3] text-[9px] font-medium" title={getFileName(row.pbImageUrlR)}>
                                                {getFileName(row.pbImageUrlR)}
                                              </a>
                                              <button onClick={()=>handleDeleteImage(row.id!, false, true, 'door', 'R')} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors">×</button>
                                            </div>
                                          ) : (
                                            <span className="text-[#86868B]/40 text-[9px] block text-center italic">未登録</span>
                                          )}
                                          <div className="border border-dashed border-[#E5E5E7] p-1.5 text-center cursor-pointer hover:bg-black/[0.02] rounded-lg transition-all" onClick={() => row.id && pbFileInputRefs.current[row.id + '_R']?.click()} onDrop={(e) => row.id && handleDrop(e, row.id, false, true, 'door', 'R')} onDragOver={handleDragOver}>
                                            <input type="file" className="hidden" ref={el => { if(row.id) pbFileInputRefs.current[row.id + '_R'] = el; }} onChange={e => row.id && handleFileSelect(e, row.id, false, true, 'door', 'R')}/>
                                            <span className="text-[9px] text-[#0071E3] font-bold">右画像UP</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex flex-col gap-1">
                                  {uploadingId === (row.id + '_pb') ? "UP中..." : (
                                    <div className="flex flex-col gap-1">
                                      {row.pbImageUrl ? (
                                        <div className="flex items-center gap-1 bg-white border border-[#E5E5E7] rounded-lg p-1 shadow-sm">
                                          <img src={row.pbImageUrl} className="w-6 h-6 object-cover rounded shadow-xs" referrerPolicy="no-referrer" />
                                          <a href={row.pbImageUrl} target="_blank" className="truncate flex-1 text-[#0071E3] text-[10px] font-medium" title={getFileName(row.pbImageUrl)}>
                                            {getFileName(row.pbImageUrl)}
                                          </a>
                                          <button onClick={()=>handleDeleteImage(row.id!, false, true)} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors">×</button>
                                        </div>
                                      ) : (
                                        <span className="text-[#86868B]/40 text-[10px] block text-center italic">
                                          未登録
                                        </span>
                                      )}
                                      <div className="border border-dashed border-[#E5E5E7] p-2 text-center cursor-pointer hover:bg-black/[0.02] rounded-lg transition-all" onClick={() => row.id && pbFileInputRefs.current[row.id]?.click()} onDrop={(e) => row.id && handleDrop(e, row.id, false, true)} onDragOver={handleDragOver}><input type="file" className="hidden" ref={el => { if(row.id) pbFileInputRefs.current[row.id] = el; }} onChange={e => row.id && handleFileSelect(e, row.id, false, true)}/><span className="text-[9px] text-[#0071E3] font-bold">プレゼン用画像</span></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-2 text-center">
                            {isEditing ? (
                              <div className="flex justify-center gap-1">
                                <button onClick={handleSaveEdit} className="bg-[#0071E3] text-white p-1.5 rounded-lg shadow-sm hover:bg-[#0077ED] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                                <button onClick={handleCancelEdit} className="bg-white border border-[#E5E5E7] text-[#86868B] p-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button onClick={()=>handleStartEdit(row)} className="text-[#0071E3] hover:bg-[#0071E3]/5 p-1.5 rounded-lg transition-colors" title="編集"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={()=>handleDeleteRecord(row.id!)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="削除"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-[#F5F5F7] px-6 py-3 border-t border-[#E5E5E7] flex justify-between items-center shrink-0 text-xs">
                <span className="text-[#86868B]">全 {sortedPriceList.length} 件中 {(doorPage - 1) * itemsPerPage + 1}〜{Math.min(doorPage * itemsPerPage, sortedPriceList.length)} 件を表示</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDoorPage(p => Math.max(1, p - 1))} disabled={doorPage === 1} className="px-3 py-1 bg-white rounded border border-[#E5E5E7] disabled:opacity-40 hover:bg-gray-50 font-bold">前へ</button>
                  <span className="font-bold">{doorPage} / {Math.ceil(sortedPriceList.length / itemsPerPage) || 1}</span>
                  <button onClick={() => setDoorPage(p => Math.min(Math.ceil(sortedPriceList.length / itemsPerPage), p + 1))} disabled={doorPage >= Math.ceil(sortedPriceList.length / itemsPerPage)} className="px-3 py-1 bg-white rounded border border-[#E5E5E7] disabled:opacity-40 hover:bg-gray-50 font-bold">次へ</button>
                </div>
              </div>
            </div>
          ) : activeTab === 'storage' ? (
            <div className="flex flex-col h-full bg-white">
               <div className="bg-white p-4 border-b border-[#E5E5E7] shrink-0">
                <details className="group">
                  <summary className="font-bold text-[#1D1D1F] cursor-pointer flex items-center gap-3 list-none text-sm hover:text-[#0071E3] transition-colors">
                    <span className="bg-[#0071E3] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm group-open:rotate-45 transition-transform">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    </span>
                    新しい玄関収納データを追加する
                  </summary>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end animate-in slide-in-from-top-2 p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7]">
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">ID (型番)</label><input type="text" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="例: E99" value={newStorage.id} onChange={(e) => setNewStorage(p => ({...p, id: e.target.value}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">カテゴリー</label><select className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" value={newStorage.category} onChange={(e) => setNewStorage(p => ({...p, category: e.target.value}))}>{STORAGE_CATEGORIES.filter(c => c !== "なし").map(c => (<option key={c} value={c}>{c}</option>))}</select></div>
                    <div className="col-span-2 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">商品名</label><input type="text" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="例: W1200トール" value={newStorage.name} onChange={(e) => setNewStorage(p => ({...p, name: e.target.value}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">幅(mm)</label><input type="number" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="800" value={newStorage.width || ''} onChange={(e) => setNewStorage(p => ({...p, width: parseInt(e.target.value) || 0}))}/></div>
                    <div className="col-span-1 space-y-1"><label className="text-[10px] font-bold text-[#86868B] block ml-1">本体価格</label><input type="number" className="w-full text-xs bg-white border border-[#E5E5E7] rounded-lg p-2 focus:ring-2 focus:ring-[#0071E3] outline-none" placeholder="0" value={newStorage.price || ''} onChange={(e) => setNewStorage(p => ({...p, price: parseInt(e.target.value) || 0}))}/></div>
                    <div className="col-span-full mt-2 flex justify-end"><button onClick={handleAddStorage} disabled={isAdding} className="bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold px-8 py-2.5 rounded-full shadow-md transition-all disabled:opacity-50 active:scale-95">{isAdding ? '保存中...' : '追加する'}</button></div>
                  </div>
                </details>
              </div>
              <div className="flex-grow overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#F5F5F7] text-[#86868B] font-bold sticky top-0 shadow-sm z-10 border-b border-[#E5E5E7]">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">カテゴリー</th>
                      <th className="p-3">名称</th>
                      <th className="p-3 text-right">幅(mm)</th>
                      <th className="p-3 text-right bg-white/50">本体価格</th>
                      <th className="p-3 w-40 text-center">詳細図/PDF</th>
                      <th className="p-3 w-40 text-center">プレゼン画像</th>
                      <th className="p-3 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStorageList.map((row) => {
                      const isEditing = editingStorageId === row.id;
                      return (
                        <tr key={row.id} className={`${isEditing ? 'bg-[#0071E3]/5' : 'hover:bg-black/[0.01] transition-colors'} border-b border-[#E5E5E7]/50`}>
                          <td className="p-2 pl-3 font-mono text-[#86868B]">{row.id}</td>
                          <td className="p-2">{isEditing ? <select className="w-full text-xs bg-white border border-[#E5E5E7] rounded p-1" value={editStorageValues.category} onChange={e=>setEditStorageValues(p=>({...p, category:e.target.value}))}>{STORAGE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select> : row.category}</td>
                          <td className="p-2">{isEditing ? <input className="w-full text-xs bg-white border border-[#E5E5E7] rounded p-1" value={editStorageValues.name} onChange={e=>setEditStorageValues(p=>({...p, name:e.target.value}))}/> : row.name}</td>
                          <td className="p-2 text-right font-mono">{isEditing ? <input type="number" className="w-16 text-right text-xs bg-white border border-[#E5E5E7] rounded p-1" value={editStorageValues.width} onChange={e=>setEditStorageValues(p=>({...p, width:parseInt(e.target.value)||0}))}/> : row.width}</td>
                          <td className="p-2 text-right font-mono font-bold text-[#0071E3] bg-[#0071E3]/5">{isEditing ? <input type="number" className="w-20 text-right text-xs bg-white border border-[#E5E5E7] rounded p-1 font-bold text-[#0071E3]" value={editStorageValues.price} onChange={e=>setEditStorageValues(p=>({...p, price:parseInt(e.target.value)||0}))}/> : `¥${row.price.toLocaleString()}`}</td>
                          <td className="p-2 border-r border-[#E5E5E7]/30">
                             {uploadingId === (row.id + '_detail') ? "UP中..." : (
                               <div className="flex flex-col gap-1">
                                 {row.imageUrl ? (
                                   <div className="flex items-center gap-1 bg-white border border-[#E5E5E7] rounded-lg p-1 shadow-sm">
                                     <a href={row.imageUrl} target="_blank" className="truncate flex-1 text-[#0071E3] text-[10px] font-medium" title={getFileName(row.imageUrl)}>
                                       {getFileName(row.imageUrl)}
                                     </a>
                                     <button onClick={()=>handleDeleteImage(row.id, true, false, 'storage')} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors">×</button>
                                   </div>
                                 ) : (
                                   <span className="text-[#86868B]/40 text-[10px] truncate block text-center italic" title={getFileName(getStorageDetailPdfUrl(row.id))}>
                                     未登録(割当済)
                                   </span>
                                 )}
                                 <div className="border border-dashed border-[#E5E5E7] p-2 text-center cursor-pointer hover:bg-black/[0.02] rounded-lg transition-all" onClick={()=>fileInputRefs.current[row.id]?.click()} onDrop={(e)=>handleDrop(e, row.id, true, false, 'storage')} onDragOver={handleDragOver}><input type="file" className="hidden" ref={el => { if(row.id) fileInputRefs.current[row.id] = el; }} onChange={e => handleFileSelect(e, row.id, true, false, 'storage')}/><span className="text-[9px] text-[#86868B] font-bold">図面PDF登録</span></div>
                               </div>
                             )}
                          </td>
                          <td className="p-2">
                             {uploadingId === (row.id + '_pb') ? "UP中..." : (
                               <div className="flex flex-col gap-1">
                                 {row.pbImageUrl ? (
                                   <div className="flex items-center gap-1 bg-white border border-[#E5E5E7] rounded-lg p-1 shadow-sm">
                                     <img src={row.pbImageUrl} className="w-6 h-6 object-cover rounded shadow-xs" referrerPolicy="no-referrer" />
                                     <a href={row.pbImageUrl} target="_blank" className="truncate flex-1 text-[#0071E3] text-[10px] font-medium" title={getFileName(row.pbImageUrl)}>
                                       {getFileName(row.pbImageUrl)}
                                     </a>
                                     <button onClick={()=>handleDeleteImage(row.id, true, true, 'storage')} className="text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors">×</button>
                                   </div>
                                 ) : (
                                   <span className="text-[#86868B]/40 text-[10px] block text-center italic">未登録</span>
                                 )}
                                 <div className="border border-dashed border-[#E5E5E7] p-2 text-center cursor-pointer hover:bg-black/[0.02] rounded-lg transition-all" onClick={()=>pbFileInputRefs.current[row.id]?.click()} onDrop={(e)=>handleDrop(e, row.id, true, true, 'storage')} onDragOver={handleDragOver}><input type="file" className="hidden" ref={el => { if(row.id) pbFileInputRefs.current[row.id] = el; }} onChange={e => handleFileSelect(e, row.id, true, true, 'storage')}/><span className="text-[9px] text-[#0071E3] font-bold">プレゼン用画像</span></div>
                               </div>
                             )}
                          </td>
                          <td className="p-2 text-center">
                            {isEditing ? (
                              <div className="flex justify-center gap-1">
                                <button onClick={handleSaveStorageEdit} className="bg-[#0071E3] text-white p-1.5 rounded-lg shadow-sm hover:bg-[#0077ED] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                                <button onClick={handleCancelStorageEdit} className="bg-white border border-[#E5E5E7] text-[#86868B] p-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button onClick={()=>handleStartStorageEdit(row)} className="text-[#0071E3] hover:bg-[#0071E3]/5 p-1.5 rounded-lg transition-colors" title="編集"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                <button onClick={()=>handleDeleteRecord(row.id, true)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="削除"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="bg-[#F5F5F7] px-6 py-3 border-t border-[#E5E5E7] flex justify-between items-center shrink-0 text-xs">
                <span className="text-[#86868B]">全 {sortedStorageList.length} 件中 {(storagePage - 1) * itemsPerPage + 1}〜{Math.min(storagePage * itemsPerPage, sortedStorageList.length)} 件を表示</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setStoragePage(p => Math.max(1, p - 1))} disabled={storagePage === 1} className="px-3 py-1 bg-white rounded border border-[#E5E5E7] disabled:opacity-40 hover:bg-gray-50 font-bold">前へ</button>
                  <span className="font-bold">{storagePage} / {Math.ceil(sortedStorageList.length / itemsPerPage) || 1}</span>
                  <button onClick={() => setStoragePage(p => Math.min(Math.ceil(sortedStorageList.length / itemsPerPage), p + 1))} disabled={storagePage >= Math.ceil(sortedStorageList.length / itemsPerPage)} className="px-3 py-1 bg-white rounded border border-[#E5E5E7] disabled:opacity-40 hover:bg-gray-50 font-bold">次へ</button>
                </div>
              </div>
            </div>
          ) : activeTab === 'handle' ? (
            <div className="p-8 bg-white h-full overflow-auto custom-scrollbar">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-[#0071E3] rounded-full" />
                <h3 className="font-bold text-xl text-[#1D1D1F]">取手マスター <span className="text-xs font-normal text-[#86868B] ml-2 tracking-tight">プレゼンボード用画像登録</span></h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {handleMaster.map(h => (
                  <div key={h.name} className="bg-white rounded-2xl border border-[#E5E5E7] p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-[#1D1D1F] text-lg tracking-tight">{h.name}</h4>
                      {h.pbImageUrl && <span className="bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold px-2 py-0.5 rounded-full">登録済み</span>}
                    </div>
                    <div className="aspect-square bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] overflow-hidden flex items-center justify-center relative mb-4">
                      {h.pbImageUrl ? (
                        <>
                          <img src={h.pbImageUrl} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
                          <button onClick={() => handleDeleteImage(h.name, false, true, 'handle')} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">×</button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                           <svg className="w-10 h-10 text-[#86868B]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           <span className="text-[11px] text-[#86868B] italic">未登録</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => fileInputRefs.current[h.name]?.click()} className="w-full bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] py-2.5 rounded-xl text-xs font-bold hover:bg-[#E5E5E7] transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95">
                      <svg className="w-4 h-4 text-[#0071E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      画像をアップロード
                    </button>
                    <input type="file" className="hidden" ref={el => fileInputRefs.current[h.name] = el} onChange={e => handleFileSelect(e, h.name, false, true, 'handle')}/>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'baseboard' ? (
             <div className="p-8 bg-white h-full overflow-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#0071E3] rounded-full" />
                  <h3 className="font-bold text-xl text-[#1D1D1F]">巾木・ストッパー設定 <span className="text-xs font-normal text-[#86868B] ml-2 tracking-tight">単価、単位、プレゼンボード用画像登録</span></h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {baseboardRecordMaster.map(b => (
                     <div key={b.product} className="bg-white rounded-2xl border border-[#E5E5E7] p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                       <div>
                         <div className="flex justify-between items-start mb-4">
                           <h4 className="font-bold text-[#1D1D1F] text-sm tracking-tight leading-snug">{b.product}</h4>
                           {b.pbImageUrl && <span className="bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">画像登録済み</span>}
                         </div>
                         <div className="aspect-square bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] overflow-hidden flex items-center justify-center relative mb-4">
                           {b.pbImageUrl ? (
                             <>
                               <img src={b.pbImageUrl} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
                               <button onClick={() => handleDeleteImage(b.product, false, true, 'baseboard')} className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">×</button>
                             </>
                           ) : (
                             <div className="flex flex-col items-center gap-2">
                                <svg className="w-10 h-10 text-[#86868B]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-[11px] text-[#86868B] italic">画像未登録</span>
                             </div>
                           )}
                         </div>
                         <button onClick={() => fileInputRefs.current[b.product]?.click()} className="w-full bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] py-2.5 rounded-xl text-xs font-bold hover:bg-[#E5E5E7] transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95">
                           <svg className="w-4 h-4 text-[#0071E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                           画像をアップロード
                         </button>
                         <input type="file" className="hidden" ref={el => fileInputRefs.current[b.product] = el} onChange={e => handleFileSelect(e, b.product, false, true, 'baseboard')}/>
                       </div>

                       {/* 単価・単位編集インプット */}
                       <div className="mt-5 border-t border-[#E5E5E7]/60 pt-4 space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                           <div>
                             <label className="block text-[10px] font-bold text-[#86868B] mb-1">単価 (円)</label>
                             <input 
                               type="number"
                               defaultValue={b.unitPrice}
                               id={`price_${b.product}`}
                               className="w-full border border-[#E5E5E7] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3] bg-[#F5F5F7]/30"
                             />
                           </div>
                           <div>
                             <label className="block text-[10px] font-bold text-[#86868B] mb-1">単位</label>
                             <input 
                               type="text"
                               defaultValue={b.unit}
                               id={`unit_${b.product}`}
                               placeholder="本、個など"
                               className="w-full border border-[#E5E5E7] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3] bg-[#F5F5F7]/30"
                             />
                           </div>
                         </div>
                         <button 
                           onClick={() => {
                             const priceInput = document.getElementById(`price_${b.product}`) as HTMLInputElement;
                             const unitInput = document.getElementById(`unit_${b.product}`) as HTMLInputElement;
                             if (priceInput && unitInput) {
                               handleUpdateBaseboardMeta(b.product, parseInt(priceInput.value) || 0, unitInput.value);
                               alert(`${b.product} の設定を保存しました。`);
                             }
                           }}
                           className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-xs"
                         >
                           単価・単位を保存
                         </button>
                       </div>
                     </div>
                   ))}
                </div>

                {/* 玄関収納オプション単価設定 */}
                <div className="mt-12 border-t border-[#E5E5E7] pt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-[#ea580c] rounded-full" />
                    <h3 className="font-bold text-xl text-[#1D1D1F]">玄関収納 オプション単価設定 <span className="text-xs font-normal text-[#86868B] ml-2 tracking-tight">ミラー・フィラー・台輪の単価設定</span></h3>
                  </div>

                  <div className="bg-[#F5F5F7] p-6 rounded-2xl border border-[#E5E5E7] max-w-4xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 bg-white p-4 rounded-xl border border-[#E5E5E7] shadow-xs">
                        <label className="block text-xs font-bold text-[#86868B]">ミラーオプション単価 (円)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[#86868B] font-mono text-xs">¥</span>
                          <input 
                            type="number"
                            value={localOptionPrices.mirror}
                            onChange={e => setLocalOptionPrices(prev => ({ ...prev, mirror: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#ea580c]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 bg-white p-4 rounded-xl border border-[#E5E5E7] shadow-xs">
                        <label className="block text-xs font-bold text-[#86868B]">フィラーオプション単価 (円)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[#86868B] font-mono text-xs">¥</span>
                          <input 
                            type="number"
                            value={localOptionPrices.filler}
                            onChange={e => setLocalOptionPrices(prev => ({ ...prev, filler: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-3 py-2 text-sm font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#ea580c]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 bg-white p-4 rounded-xl border border-[#E5E5E7] shadow-xs">
                      <label className="block text-xs font-bold text-[#86868B] mb-2">台輪オプション単価 (幅別)</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="block text-[11px] text-[#86868B] mb-1">幅800㎜ (円)</span>
                          <input 
                            type="number"
                            value={localOptionPrices.daiwa_800}
                            onChange={e => setLocalOptionPrices(prev => ({ ...prev, daiwa_800: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#ea580c]"
                          />
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#86868B] mb-1">幅1200㎜ (円)</span>
                          <input 
                            type="number"
                            value={localOptionPrices.daiwa_1200}
                            onChange={e => setLocalOptionPrices(prev => ({ ...prev, daiwa_1200: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#ea580c]"
                          />
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#86868B] mb-1">幅1600㎜ (円)</span>
                          <input 
                            type="number"
                            value={localOptionPrices.daiwa_1600}
                            onChange={e => setLocalOptionPrices(prev => ({ ...prev, daiwa_1600: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#ea580c]"
                          />
                        </div>
                        <div>
                          <span className="block text-[11px] text-[#86868B] mb-1">幅2000㎜ (円)</span>
                          <input 
                            type="number"
                            value={localOptionPrices.daiwa_2000}
                            onChange={e => setLocalOptionPrices(prev => ({ ...prev, daiwa_2000: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#ea580c]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={handleSaveStorageOptions}
                        className="bg-[#ea580c] hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                      >
                        収納オプション設定を保存
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          ) : activeTab === 'email' ? (
            <div className="flex flex-col items-center p-8 bg-white h-full overflow-auto custom-scrollbar">
              <div className="w-full max-w-2xl space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#0071E3] rounded-full" />
                  <h3 className="font-bold text-xl text-[#1D1D1F]">メール送信設定 <span className="text-xs font-normal text-[#86868B] ml-2 tracking-tight">注文書送付依頼のSMTP・宛先設定</span></h3>
                </div>

                <div className="bg-[#F5F5F7] p-8 rounded-2xl border border-[#E5E5E7] space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#1D1D1F]">注文書送付先アドレス (To)</label>
                    <input 
                      type="email"
                      value={localEmailSettings.toEmail}
                      onChange={e => setLocalEmailSettings(prev => ({ ...prev, toEmail: e.target.value }))}
                      placeholder="takishita@kashiwa-f.com"
                      className="w-full bg-white border border-[#E5E5E7] rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3]"
                    />
                    <p className="text-[11px] text-[#86868B]">※注文書送付依頼メールの宛先となるアドレスです。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#1D1D1F]">SMTPホスト</label>
                      <input 
                        type="text"
                        value={localEmailSettings.host}
                        onChange={e => setLocalEmailSettings(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="smtp.example.com"
                        className="w-full bg-white border border-[#E5E5E7] rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#1D1D1F]">ポート番号</label>
                      <input 
                        type="number"
                        value={localEmailSettings.port}
                        onChange={e => setLocalEmailSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                        placeholder="587"
                        className="w-full bg-white border border-[#E5E5E7] rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#1D1D1F]">メールアカウント (ユーザー名/送信元)</label>
                      <input 
                        type="text"
                        value={localEmailSettings.user}
                        onChange={e => setLocalEmailSettings(prev => ({ ...prev, user: e.target.value }))}
                        placeholder="your-email@example.com"
                        className="w-full bg-white border border-[#E5E5E7] rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#1D1D1F]">パスワード (またはアプリパスワード)</label>
                      <input 
                        type="password"
                        value={localEmailSettings.pass}
                        onChange={e => setLocalEmailSettings(prev => ({ ...prev, pass: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full bg-white border border-[#E5E5E7] rounded-xl px-4 py-3 text-sm font-mono text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#1D1D1F]">送信者名 (表示名)</label>
                    <input 
                      type="text"
                      value={localEmailSettings.from}
                      onChange={e => setLocalEmailSettings(prev => ({ ...prev, from: e.target.value }))}
                      placeholder="株式会社〇〇 担当者"
                      className="w-full bg-white border border-[#E5E5E7] rounded-xl px-4 py-3 text-sm text-[#1D1D1F] outline-none focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSaveEmailSettings}
                      className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-8 py-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      メール送信設定を保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'shipping' ? (
            <div className="flex flex-col items-center p-8 bg-white h-full overflow-auto custom-scrollbar">
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-[#0071E3] rounded-full" />
                  <h3 className="font-bold text-xl text-[#1D1D1F]">送料一覧 <span className="text-xs font-normal text-[#86868B] ml-2 tracking-tight">各都道府県別の配送コスト設定</span></h3>
                </div>
                <div className="bg-white border border-[#E5E5E7] rounded-[24px] shadow-sm overflow-hidden">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-[#F5F5F7] text-[#86868B] font-bold border-b border-[#E5E5E7]">
                      <tr>
                        <th className="p-4 w-24 text-center">ID</th>
                        <th className="p-4">都道府県</th>
                        <th className="p-4 text-right">送料 (円)</th>
                        <th className="p-4 text-center w-32">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E7]/50">
                      {shippingFees.map((row) => (
                        <tr key={row.id} className="hover:bg-black/[0.01] transition-colors">
                          <td className="p-3 text-center text-[#86868B] font-mono text-xs">{row.id}</td>
                          <td className="p-3 font-bold text-[#1D1D1F]">{row.prefecture}</td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <span className="text-[#86868B] font-mono text-xs">¥</span>
                              <input 
                                type="number" 
                                value={row.price} 
                                onChange={(e) => onUpdateShipping(row.id, parseInt(e.target.value) || 0)} 
                                className="text-right font-mono font-bold text-[#0071E3] bg-[#0071E3]/5 border-b-2 border-[#0071E3]/20 focus:border-[#0071E3] outline-none w-28 px-2 py-1 rounded-t transition-all hover:bg-[#0071E3]/10"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-center">
                             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071E3]/5 text-[#0071E3] text-[10px] font-bold">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-pulse" />
                               保存済み
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="bg-[#F5F5F7] px-6 py-2.5 border-t border-[#E5E5E7] flex justify-between items-center text-[10px] text-[#86868B] font-medium select-none">
           <div className="flex gap-4">
             <span>Showing {activeTab === 'door' ? priceList.length : activeTab === 'storage' ? storageTypes.length - 1 : shippingFees.length} records</span>
             <span className="text-[#E5E5E7]">|</span>
             <span>Modal Width: {Math.round(modalWidth)}px</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
             Apple Design System Compliant
           </div>
        </div>
      </div>
    </div>
  );
};
