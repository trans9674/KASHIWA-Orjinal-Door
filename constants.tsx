
import { DoorType, UsageLocation, PriceRecord, DoorItem, StorageTypeRecord } from './types';

// アイテムごとの配送点数定義
export const DOOR_POINTS: Record<string, number> = {
  [DoorType.Hinged]: 1,
  [DoorType.Sliding]: 1,
  [DoorType.Pocket]: 1,
  [DoorType.Outset]: 1,
  [DoorType.OutsetIncorner]: 1,
  [DoorType.Folding2]: 1,
  [DoorType.StorageDouble]: 1,
  [DoorType.StorageSingle]: 1,
  [DoorType.Sliding2]: 2,
  [DoorType.DoubleSliding2]: 2,
  [DoorType.Folding4W12]: 2,
  [DoorType.Folding4W16]: 2,
  [DoorType.Sliding3]: 3,
  [DoorType.DoubleSliding3]: 3,
  [DoorType.Folding6]: 3,
  [DoorType.DoubleSliding4]: 4,
  [DoorType.Folding8]: 4,
};

// 玄関収納の配送点数
export const getStoragePoints = (typeId: string): number => {
  if (typeId === "NONE") return 0;
  if (typeId === "E02") return 1; // 一の字 W800
  if (["E03R", "E03L", "E04", "E05R", "E05L", "E22", "I20"].includes(typeId)) return 2; // 一の字W1200-2000, 二の字W800, トールW800
  return 4; // その他 (二の字W1200-, トールW1200-, コの字, L型)
};

// 巾木の配送点数
export const getBaseboardPoints = (quantity: number): number => {
  if (quantity <= 0) return 0;
  if (quantity <= 20) return 1;
  if (quantity <= 40) return 2;
  if (quantity <= 60) return 3;
  return 4;
};

// 建具仕様マスタ
export const DOOR_SPEC_MASTER: Record<string, { designs: string[], widths: string[], hangingSides: string[] }> = {
  [DoorType.Hinged]: {
    designs: ["フラット", "フラット 表示錠", "フラット 表示錠 遮音仕様", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["650", "735", "755", "778"],
    hangingSides: ["右吊元(R)", "左吊元(L)"]
  },
  [DoorType.Sliding]: {
    designs: ["フラット", "フラット 表示錠", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["1645", "1450", "1200"],
    hangingSides: ["右戸袋(R)", "左戸袋(L)"]
  },
  [DoorType.Sliding2]: {
    designs: ["フラット", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["2431"],
    hangingSides: ["勝手(R)", "勝手(L)"]
  },
  [DoorType.Sliding3]: {
    designs: ["フラット", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["3167"],
    hangingSides: ["勝手(R)", "勝手(L)"]
  },
  [DoorType.Pocket]: {
    designs: ["フラット", "フラット 表示錠", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["1645", "1450", "735"],
    hangingSides: ["右戸袋(R)", "左戸袋(L)"]
  },
  [DoorType.Outset]: {
    designs: ["フラット", "フラット 表示錠", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["778"],
    hangingSides: ["右戸袋(R)", "左戸袋(L)"]
  },
  [DoorType.OutsetIncorner]: {
    designs: ["フラット", "フラット 表示錠", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["778"],
    hangingSides: ["右戸袋(R)", "左戸袋(L)"]
  },
  [DoorType.DoubleSliding2]: {
    designs: ["フラット", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["1645"],
    hangingSides: ["―"]
  },
  [DoorType.DoubleSliding3]: {
    designs: ["フラット", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["2420"],
    hangingSides: ["―"]
  },
  [DoorType.DoubleSliding4]: {
    designs: ["フラット", "ガラス戸(透明強化ガラス5mm)"],
    widths: ["3244"],
    hangingSides: ["―"]
  },
  [DoorType.Folding2]: {
    designs: ["フラット"],
    widths: ["735", "755"],
    hangingSides: ["右吊元(R)/軸固定", "左吊元(L)/軸固定"]
  },
  [DoorType.Folding4W12]: {
    designs: ["フラット"],
    widths: ["1200"],
    hangingSides: ["軸固定4"]
  },
  [DoorType.Folding4W16]: {
    designs: ["フラット"],
    widths: ["1645"],
    hangingSides: ["軸固定4"]
  },
  [DoorType.Folding6]: {
    designs: ["フラット"],
    widths: ["2451"],
    hangingSides: ["フリーオープン2"]
  },
  [DoorType.Folding8]: {
    designs: ["フラット"],
    widths: ["3258"],
    hangingSides: ["フリーオープン4"]
  },
  [DoorType.StorageDouble]: {
    designs: ["フラット"],
    widths: ["735", "900"],
    hangingSides: ["クローザー"]
  },
  [DoorType.StorageSingle]: {
    designs: ["フラット"],
    widths: ["435", "600"],
    hangingSides: ["右吊元(R)", "左吊元(L)"]
  }
};

export const getFrameType = (type: string, height: string): string => {
  if (type === DoorType.Hinged || type === DoorType.Sliding) {
    return height === 'H2000' ? '3方スリム枠' : '2方スリム枠';
  }
  if (type === DoorType.Outset || type === DoorType.OutsetIncorner) {
    return height === 'H2000' ? '2方スリム枠 壁付レール' : '2方スリム枠 天井埋込レール';
  }
  return '3方スリム枠';
};

// Fallback logic for PDF generation if no image URL in DB
export const getDoorDetailPdfUrl = (door: DoorItem): string => {
  const baseUrl = "http://25663cc9bda9549d.main.jp/aistudio/door/PDFsyousai/";
  let filename = "door_details.pdf";
  const hStr = door.height === '特寸' ? '2400' : door.height.replace('H', '');
  const design = door.design;

  switch (door.type) {
    case DoorType.Hinged:
      if (design.includes("遮音")) filename = "syaonSD1.pdf";
      else if (design.includes("表示錠")) {
        filename = hStr === "2000" ? "KB2200key.pdf" : "KB4H2400.pdf";
      } else {
        filename = hStr === "2000" ? "KB2000.pdf" : "KB3H2400.pdf";
      }
      break;

    case DoorType.Sliding:
      if (design.includes("表示錠")) {
        filename = hStr === "2000" ? "KHinset2000key.pdf" : "KHinset2400key.pdf";
      } else {
        filename = hStr === "2000" ? "KHinset2000.pdf" : "KHinset2400.pdf";
      }
      break;

    case DoorType.Sliding2:
      filename = "KH2maihikikomi.pdf";
      break;

    case DoorType.Sliding3:
      filename = "KH3maihikikomi.pdf";
      break;

    case DoorType.Pocket:
      filename = "HIKIKOMI.pdf";
      break;

    case DoorType.Outset:
    case DoorType.OutsetIncorner:
      const iz = door.type === DoorType.OutsetIncorner ? "IZ" : "";
      if (design.includes("表示錠")) {
        filename = `HKoutset${hStr}${iz}key.pdf`;
      } else {
        filename = `HKoutset${hStr}${iz}.pdf`;
      }
      break;

    case DoorType.DoubleSliding2:
      filename = "HT1.pdf";
      break;
    case DoorType.DoubleSliding3:
      filename = "HT3.pdf";
      break;
    case DoorType.DoubleSliding4:
      filename = "HT4.pdf";
      break;

    case DoorType.Folding2:
      filename = "OREDO2.pdf";
      break;
    case DoorType.Folding4W12:
    case DoorType.Folding4W16:
      filename = "OR4mai.pdf";
      break;

    case DoorType.Folding6:
      filename = "OREDO6.pdf";
      break;
    case DoorType.Folding8:
      filename = "OREDO8.pdf";
      break;

    case DoorType.StorageDouble:
      filename = `RBH${hStr}.pdf`;
      break;
    case DoorType.StorageSingle:
      if (["900", "1200", "2400"].includes(hStr)) {
        filename = `MOH${hStr}.pdf`;
      } else {
        filename = `MO${hStr}.pdf`;
      }
      break;
  }

  return `${baseUrl}${filename}`;
};

export const getStorageDetailPdfUrl = (typeId: string): string => {
  const baseUrl = "http://25663cc9bda9549d.main.jp/aistudio/door/PDFsyousai/";
  const mapping: Record<string, string> = {
    "E02": "SBfloor7W800.pdf",
    "E03R": "SBfloor8W1200(R).pdf",
    "E03L": "SBfloor9W1200(L).pdf",
    "E04": "SBfloor10W1600.pdf",
    "E05R": "SBfloor12W2000(R).pdf",
    "E05L": "SBfloor12W2000(L).pdf",
    "E22": "SBE1W800.pdf",
    "E33R": "SBE2W1200(R).pdf",
    "E33L": "SBE3W1200(L).pdf",
    "E44": "SBE4W1600.pdf",
    "E55R": "SBE5W2000(R).pdf",
    "E55L": "SBE6W2000(L).pdf",
    "I20": "SBI1W800.pdf",
    "I30R": "SBI2W1200(R).pdf",
    "I30L": "SBI3W1200(L).pdf",
    "I40": "SBI4W1600.pdf",
    "C14R": "SBC1W1200(R).pdf",
    "C14L": "SBC2W1200(L).pdf",
    "C24R": "SBC3W1600(R).pdf",
    "C24L": "SBC4W1600(L).pdf",
    "C26R": "SBC5W2000(R).pdf",
    "C26L": "SBC6W2000(L).pdf",
    "L12R": "SBL1W1200(R).pdf",
    "L12L": "SBL2W1200(L).pdf",
    "L22R": "SBL3W1600(R).pdf",
    "L22L": "SBL4W1600(L).pdf",
    "L23R": "SBL5W2000(R).pdf",
    "L23L": "SBL6W2000(L).pdf",
  };
  return `${baseUrl}${mapping[typeId] || "storage_details.pdf"}`;
};

/**
 * 建具詳細URL取得ヘルパー
 */
export const resolveDoorDrawingUrl = (door: DoorItem, priceList: PriceRecord[]): string => {
  const isStorage = door.type === DoorType.StorageDouble || door.type === DoorType.StorageSingle;
  let effectiveHeight = door.height;
  if (door.height === '特寸' && door.customHeight) {
    if (isStorage) {
      if (door.customHeight <= 900) effectiveHeight = "H900";
      else if (door.customHeight <= 1200) effectiveHeight = "H1200";
      else if (door.customHeight <= 2000) effectiveHeight = "H2000";
      else if (door.customHeight <= 2200) effectiveHeight = "H2200";
      else effectiveHeight = "H2400";
    } else {
      if (door.customHeight <= 2000) effectiveHeight = "H2000";
      else if (door.customHeight <= 2200) effectiveHeight = "H2200";
      else effectiveHeight = "H2400";
    }
  }

  let searchDesign = door.design;
  if (door.isUndercut) {
    searchDesign = "アンダーカット";
  } else if (door.isFrameExtended) {
    if (door.domaExtensionType === 'none') searchDesign = "土間納まり（伸長なし）";
    else if (door.domaExtensionType === 'frame') searchDesign = "土間納まり（枠伸長）";
    else if (door.domaExtensionType === 'door') searchDesign = "土間納まり（建具伸長）";
  }

  const record = priceList.find(p => p.type === door.type && p.design === searchDesign && p.height === effectiveHeight)
              || priceList.find(p => p.type === door.type && p.design === door.design && p.height === effectiveHeight);
  
  if (record && record.imageUrl) return record.imageUrl;
  return getDoorDetailPdfUrl(door);
};

export const DOOR_GROUPS = [
  { label: "片開き戸", options: [DoorType.Hinged] },
  { label: "片引き戸", options: [DoorType.Sliding, DoorType.Sliding2, DoorType.Sliding3, DoorType.Pocket, DoorType.Outset, DoorType.OutsetIncorner] },
  { label: "引き違い戸", options: [DoorType.DoubleSliding2, DoorType.DoubleSliding3, DoorType.DoubleSliding4] },
  { label: "折戸", options: [DoorType.Folding2, DoorType.Folding4W12, DoorType.Folding4W16, DoorType.Folding6, DoorType.Folding8] },
  { label: "物入", options: [DoorType.StorageDouble, DoorType.StorageSingle] }
];

export const COLORS = [
  "ピュアホワイト(WW)", "ライトグレー(LG)", "ダークグレー(DG)", 
  "コンフォートオーク(CO)", "グレージュアッシュ(GA)", "プレシャスウォールナット(PW)"
];

export const SLIDING_HANDLES = [
  "セラミックホワイト(PC-422-001)",
  "マットブラック(PC-422-003)",
  "サテンニッケル(PC-422-XN)"
];

export const HINGED_HANDLES = [
  "セラミックホワイト(丁番・戸当りサテンニッケル色)",
  "マットブラック(丁番・戸当りブラック色)",
  "サテンニッケル(丁番・戸当りサテンニッケル色)"
];

export const HANDLE_COLORS = [
  ...HINGED_HANDLES,
  ...SLIDING_HANDLES,
  "J型取手"
];

export const HANGING_SIDES = ["右吊元(R)", "左吊元(L)", "右勝手(R)", "左勝手(L)", "右戸袋(R)", "左戸袋(L)", "なし", "―"];

export const STORAGE_CATEGORIES = ["なし", "一の字タイプ", "二の字タイプ", "トールタイプ", "コの字タイプ", "L型タイプ"];

export const DAIWA_PRICES: Record<number, number> = {
  800: 2300,
  1200: 3100,
  1600: 3700,
  2000: 3900
};

export const ROOM_NAMES = [
  "玄関",
  "シューズクローク",
  "ホール",
  "リビング",
  "ダイニング",
  "キッチン",
  "パントリー",
  "和室",
  "洗面",
  "脱衣室",
  "トイレ",
  "寝室",
  "洋室①",
  "洋室②",
  "洋室③",
  "書斎",
  "ウォークインクロゼット",
  "クロゼット"
];
