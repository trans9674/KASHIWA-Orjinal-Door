
import React, { useState } from 'react';
import { getDoorDetailPdfUrl } from '../constants';
import { DoorItem, PriceRecord, StorageTypeRecord } from '../types';

interface DataViewerModalProps {
  onClose: () => void;
  priceList: PriceRecord[];
  storageTypes: StorageTypeRecord[];
}

export const DataViewerModal: React.FC<DataViewerModalProps> = ({ onClose, priceList, storageTypes }) => {
  const [activeTab, setActiveTab] = useState<'door' | 'storage'>('door');

  // ダミーのDoorItemを作成してPDF URLを取得するヘルパー
  const getFileName = (record: PriceRecord) => {
    if (record.imageUrl) return record.imageUrl;

    const dummyDoor: DoorItem = {
      id: 'dummy',
      roomName: '',
      type: record.type,
      design: record.design,
      width: '778', // PDF判定に影響しないデフォルト値
      height: record.height,
      frameType: 'dummy',
      hangingSide: 'dummy',
      doorColor: 'dummy',
      frameColor: 'dummy',
      handleColor: 'dummy',
      specialNotes: '',
      price: 0
    };
    try {
      const url = getDoorDetailPdfUrl(dummyDoor);
      return url.split('/').pop() || url;
    } catch (e) {
      return 'エラー';
    }
  };

  const getStorageImage = (record: StorageTypeRecord) => {
    return record.imageUrl ? record.imageUrl : "標準PDF";
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            登録データ確認（価格表・画像参照）
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('door')}
            className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'door' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            内部建具 価格・PDF一覧
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'storage' ? 'bg-white border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            玄関収納 価格一覧
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-0 bg-white custom-scrollbar">
          {activeTab === 'door' ? (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-3 border-b">種別</th>
                  <th className="p-3 border-b">設置場所</th>
                  <th className="p-3 border-b">デザイン</th>
                  <th className="p-3 border-b text-center">高さ</th>
                  <th className="p-3 border-b text-right">枠価格</th>
                  <th className="p-3 border-b text-right">扉価格</th>
                  <th className="p-3 border-b text-right bg-blue-50">セット価格</th>
                  <th className="p-3 border-b font-mono">画像/PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceList.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-800">{row.type}</td>
                    <td className="p-3 text-gray-500">{row.location}</td>
                    <td className="p-3">{row.design}</td>
                    <td className="p-3 text-center font-mono">{row.height}</td>
                    <td className="p-3 text-right font-mono text-gray-500">¥{row.framePrice.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-gray-500">¥{row.doorPrice.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 bg-blue-50/30">¥{row.setPrice.toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs text-gray-500 truncate max-w-[200px]" title={getFileName(row)}>
                      {row.imageUrl ? (
                        <a href={row.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          画像リンク
                        </a>
                      ) : (
                        getFileName(row)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-3 border-b">ID</th>
                  <th className="p-3 border-b">カテゴリー</th>
                  <th className="p-3 border-b">名称</th>
                  <th className="p-3 border-b text-right">幅(mm)</th>
                  <th className="p-3 border-b text-right bg-blue-50">本体価格</th>
                  <th className="p-3 border-b font-mono">画像</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {storageTypes.filter(s => s.id !== 'NONE').map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-mono text-gray-500">{row.id}</td>
                    <td className="p-3 text-gray-800 font-medium">{row.category}</td>
                    <td className="p-3">{row.name}</td>
                    <td className="p-3 text-right font-mono">{row.width}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 bg-blue-50/30">¥{row.price.toLocaleString()}</td>
                    <td className="p-3 font-mono text-xs text-gray-500 truncate">
                      {row.imageUrl ? (
                        <a href={row.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          画像リンク
                        </a>
                      ) : "標準PDF"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="bg-gray-50 p-3 border-t text-right text-xs text-gray-500">
           Showing {activeTab === 'door' ? priceList.length : storageTypes.length - 1} records
        </div>
      </div>
    </div>
  );
};
