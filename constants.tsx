
import { DoorType, UsageLocation, PriceRecord, DoorItem } from './types';

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

// 玄関収納の詳細図面マッピング
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

// 引き戸・片引き戸用ハンドル
export const SLIDING_HANDLES = [
  "セラミックホワイト(PC-422-001)",
  "マットブラック(PC-422-003)",
  "サテンニッケル(PC-422-XN)"
];

// 片開き戸用ハンドル（従来のものを使用）
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

export const PRICE_LIST: PriceRecord[] = [
  // 片開き
  { type: DoorType.Hinged, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 15320, doorPrice: 30680, setPrice: 46000 },
  { type: DoorType.Hinged, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 17470, doorPrice: 35730, setPrice: 53200 },
  { type: DoorType.Hinged, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 17470, doorPrice: 35730, setPrice: 53200 },
  { type: DoorType.Hinged, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 13440, doorPrice: 11260, setPrice: 24700 },
  { type: DoorType.Hinged, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 15060, doorPrice: 12240, setPrice: 27300 },
  { type: DoorType.Hinged, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 15140, doorPrice: 13060, setPrice: 28200 },
  { type: DoorType.Hinged, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2000", framePrice: 15400, doorPrice: 11500, setPrice: 26900 },
  { type: DoorType.Hinged, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2200", framePrice: 17150, doorPrice: 12450, setPrice: 29600 },
  { type: DoorType.Hinged, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2400", framePrice: 17300, doorPrice: 13300, setPrice: 30600 },
  { type: DoorType.Hinged, location: UsageLocation.Toilet, design: "フラット 表示錠 遮音仕様", notes: "", height: "H2000", framePrice: 27900, doorPrice: 26500, setPrice: 54400 },
  { type: DoorType.Hinged, location: UsageLocation.Toilet, design: "フラット 表示錠 遮音仕様", notes: "", height: "H2200", framePrice: 29650, doorPrice: 27450, setPrice: 57100 },
  { type: DoorType.Hinged, location: UsageLocation.Toilet, design: "フラット 表示錠 遮音仕様", notes: "", height: "H2400", framePrice: 29800, doorPrice: 28300, setPrice: 58100 },

  // 片引き
  { type: DoorType.Sliding, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 11220, doorPrice: 41180, setPrice: 52400 },
  { type: DoorType.Sliding, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 11220, doorPrice: 47480, setPrice: 58700 },
  { type: DoorType.Sliding, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 11220, doorPrice: 47480, setPrice: 58700 },
  { type: DoorType.Sliding, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 12080, doorPrice: 16720, setPrice: 28800 },
  { type: DoorType.Sliding, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 12710, doorPrice: 17590, setPrice: 30300 },
  { type: DoorType.Sliding, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 12710, doorPrice: 18490, setPrice: 31200 },
  { type: DoorType.Sliding, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2000", framePrice: 12350, doorPrice: 20550, setPrice: 32900 },
  { type: DoorType.Sliding, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2200", framePrice: 13010, doorPrice: 21590, setPrice: 34600 },
  { type: DoorType.Sliding, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2400", framePrice: 13010, doorPrice: 22490, setPrice: 35500 },

  // 片引込
  { type: DoorType.Pocket, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 14890, doorPrice: 41610, setPrice: 56500 },
  { type: DoorType.Pocket, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 15320, doorPrice: 47880, setPrice: 63200 },
  { type: DoorType.Pocket, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 15320, doorPrice: 47880, setPrice: 63200 },
  { type: DoorType.Pocket, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 14890, doorPrice: 17310, setPrice: 32200 },
  { type: DoorType.Pocket, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 15320, doorPrice: 18180, setPrice: 33500 },
  { type: DoorType.Pocket, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 15320, doorPrice: 19080, setPrice: 34400 },
  { type: DoorType.Pocket, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2000", framePrice: 15180, doorPrice: 21320, setPrice: 36500 },
  { type: DoorType.Pocket, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2200", framePrice: 15610, doorPrice: 22190, setPrice: 37800 },
  { type: DoorType.Pocket, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2400", framePrice: 15610, doorPrice: 23090, setPrice: 38700 },

  // アウトセット
  { type: DoorType.Outset, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 16110, doorPrice: 41690, setPrice: 57800 },
  { type: DoorType.Outset, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 8480, doorPrice: 47220, setPrice: 55700 },
  { type: DoorType.Outset, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 8480, doorPrice: 47220, setPrice: 55700 },
  { type: DoorType.Outset, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 16110, doorPrice: 17190, setPrice: 33300 },
  { type: DoorType.Outset, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 8490, doorPrice: 18110, setPrice: 26600 },
  { type: DoorType.Outset, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 8490, doorPrice: 18110, setPrice: 26600 },
  { type: DoorType.Outset, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2000", framePrice: 15420, doorPrice: 25280, setPrice: 40700 },
  { type: DoorType.Outset, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2200", framePrice: 7920, doorPrice: 26480, setPrice: 34400 },
  { type: DoorType.Outset, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2400", framePrice: 7920, doorPrice: 26480, setPrice: 34400 },
  // 入隅用
  { type: DoorType.OutsetIncorner, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 16570, doorPrice: 41630, setPrice: 58200 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 8950, doorPrice: 47150, setPrice: 56100 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 8950, doorPrice: 47150, setPrice: 56100 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 16570, doorPrice: 17130, setPrice: 33700 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 8950, doorPrice: 18050, setPrice: 27000 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 8950, doorPrice: 18050, setPrice: 27000 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2000", framePrice: 15910, doorPrice: 23290, setPrice: 39200 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2200", framePrice: 8450, doorPrice: 24350, setPrice: 32800 },
  { type: DoorType.OutsetIncorner, location: UsageLocation.Toilet, design: "フラット 表示錠", notes: "", height: "H2400", framePrice: 8450, doorPrice: 24350, setPrice: 32800 },

  // 引違い
  { type: DoorType.DoubleSliding2, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 14720, doorPrice: 81480, setPrice: 96200 },
  { type: DoorType.DoubleSliding2, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 15280, doorPrice: 94120, setPrice: 109400 },
  { type: DoorType.DoubleSliding2, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 15280, doorPrice: 94120, setPrice: 109400 },
  { type: DoorType.DoubleSliding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 14720, doorPrice: 32380, setPrice: 47100 },
  { type: DoorType.DoubleSliding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 15280, doorPrice: 33920, setPrice: 49200 },
  { type: DoorType.DoubleSliding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 15280, doorPrice: 35820, setPrice: 51100 },

  // 2枚片引き (Sliding2)
  { type: DoorType.Sliding2, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 108400 },
  { type: DoorType.Sliding2, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 121800 },
  { type: DoorType.Sliding2, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 121800 },
  { type: DoorType.Sliding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 59300 },
  { type: DoorType.Sliding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 61600 },
  { type: DoorType.Sliding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 63400 },

  // 3枚片引き (Sliding3)
  { type: DoorType.Sliding3, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 159500 },
  { type: DoorType.Sliding3, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 179100 },
  { type: DoorType.Sliding3, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 179100 },
  { type: DoorType.Sliding3, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 85800 },
  { type: DoorType.Sliding3, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 88900 },
  { type: DoorType.Sliding3, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 91700 },

  // 引き違い3枚 (DoubleSliding3)
  { type: DoorType.DoubleSliding3, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 161400 },
  { type: DoorType.DoubleSliding3, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 182200 },
  { type: DoorType.DoubleSliding3, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 182200 },
  { type: DoorType.DoubleSliding3, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 81100 },
  { type: DoorType.DoubleSliding3, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 84400 },
  { type: DoorType.DoubleSliding3, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 86400 },

  // 引き違い4枚 (DoubleSliding4)
  { type: DoorType.DoubleSliding4, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 189900 },
  { type: DoorType.DoubleSliding4, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 215600 },
  { type: DoorType.DoubleSliding4, location: UsageLocation.LD, design: "ガラス戸(透明強化ガラス5mm)", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 215600 },
  { type: DoorType.DoubleSliding4, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 0, doorPrice: 0, setPrice: 91700 },
  { type: DoorType.DoubleSliding4, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 0, doorPrice: 0, setPrice: 95300 },
  { type: DoorType.DoubleSliding4, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 0, doorPrice: 0, setPrice: 98900 },

  // 折戸
  { type: DoorType.Folding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 6490, doorPrice: 9710, setPrice: 16200 },
  { type: DoorType.Folding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 6970, doorPrice: 10230, setPrice: 17200 },
  { type: DoorType.Folding2, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 6970, doorPrice: 10530, setPrice: 17500 },
  { type: DoorType.Folding4W12, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 8610, doorPrice: 17690, setPrice: 26300 },
  { type: DoorType.Folding4W12, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 9080, doorPrice: 18620, setPrice: 27700 },
  { type: DoorType.Folding4W12, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 9160, doorPrice: 19140, setPrice: 28300 },
  { type: DoorType.Folding4W16, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 9390, doorPrice: 19410, setPrice: 28800 },
  { type: DoorType.Folding4W16, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 9740, doorPrice: 20460, setPrice: 30200 },
  { type: DoorType.Folding4W16, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 9740, doorPrice: 21060, setPrice: 30800 },
  { type: DoorType.Folding6, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 22490, doorPrice: 29110, setPrice: 51600 },
  { type: DoorType.Folding6, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 23010, doorPrice: 30690, setPrice: 53700 },
  { type: DoorType.Folding6, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 23110, doorPrice: 31590, setPrice: 54700 },
  { type: DoorType.Folding8, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 27890, doorPrice: 38810, setPrice: 66700 },
  { type: DoorType.Folding8, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 28380, doorPrice: 40920, setPrice: 69300 },
  { type: DoorType.Folding8, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 28590, doorPrice: 42110, setPrice: 70700 },

  // 物入
  { type: DoorType.StorageSingle, location: UsageLocation.Room, design: "フラット", notes: "", height: "H900", framePrice: 4460, doorPrice: 3240, setPrice: 7700 },
  { type: DoorType.StorageSingle, location: UsageLocation.Room, design: "フラット", notes: "", height: "H1200", framePrice: 5500, doorPrice: 3500, setPrice: 9000 },
  { type: DoorType.StorageSingle, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 7090, doorPrice: 5710, setPrice: 12800 },
  { type: DoorType.StorageSingle, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 7720, doorPrice: 6180, setPrice: 13900 },
  { type: DoorType.StorageSingle, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 8030, doorPrice: 6270, setPrice: 14300 },
  { type: DoorType.StorageDouble, location: UsageLocation.Room, design: "フラット", notes: "", height: "H900", framePrice: 5530, doorPrice: 6470, setPrice: 12000 },
  { type: DoorType.StorageDouble, location: UsageLocation.Room, design: "フラット", notes: "", height: "H1200", framePrice: 6800, doorPrice: 7000, setPrice: 13800 },
  { type: DoorType.StorageDouble, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2000", framePrice: 8980, doorPrice: 11420, setPrice: 20400 },
  { type: DoorType.StorageDouble, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2200", framePrice: 9650, doorPrice: 12350, setPrice: 22000 },
  { type: DoorType.StorageDouble, location: UsageLocation.Room, design: "フラット", notes: "", height: "H2400", framePrice: 10360, doorPrice: 12540, setPrice: 22900 },
];

export const STORAGE_TYPES = [
  { id: "NONE", name: "なし", category: "なし", width: 0, price: 0 },
  { id: "E02", name: "W800(E02)/2枚", category: "一の字タイプ", width: 800, price: 23700 },
  { id: "E03R", name: "W1200(E03)/3枚(R)片開き右", category: "一の字タイプ", width: 1200, price: 39800 },
  { id: "E03L", name: "W1200(E03)/3枚(L)片開き左", category: "一の字タイプ", width: 1200, price: 39800 },
  { id: "E04", name: "W1600(E04)/4枚", category: "一の字タイプ", width: 1600, price: 47300 },
  { id: "E05R", name: "W2000(E05)/5枚(R)片開き右", category: "一の字タイプ", width: 2000, price: 63500 },
  { id: "E05L", name: "W2000(E05)/5枚(L)片開き左", category: "一の字タイプ", width: 2000, price: 63500 },
  { id: "E22", name: "W800(E22)/2枚", category: "二の字タイプ", width: 800, price: 42500 },
  { id: "E33R", name: "W1200(E33)/3枚(R)片開き右", category: "二の字タイプ", width: 1200, price: 71200 },
  { id: "E33L", name: "W1200(E33)/3枚(L)片開き左", category: "二の字タイプ", width: 1200, price: 71200 },
  { id: "E44", name: "W1600(E44)/4枚", category: "二の字タイプ", width: 1600, price: 84900 },
  { id: "E55R", name: "W2000(E55)/5枚(R)片開き右", category: "二の字タイプ", width: 2000, price: 113700 },
  { id: "E55L", name: "W2000(E55)/5枚(L)片開き左", category: "二の字タイプ", width: 2000, price: 113700 },
  { id: "I20", name: "W800(I20)/2枚", category: "トールタイプ", width: 800, price: 38500 },
  { id: "I30R", name: "W1200(I30)/3枚(R)片開き右", category: "トールタイプ", width: 1200, price: 65700 },
  { id: "I30L", name: "W1200(I30)/3枚(L)片開き左", category: "トールタイプ", width: 1200, price: 65700 },
  { id: "I40", name: "W1600(I40)/4枚", category: "トールタイプ", width: 1600, price: 77000 },
  { id: "C14R", name: "W1200(C14)/(R)トール右", category: "コの字タイプ", width: 1200, price: 69600 },
  { id: "C14L", name: "W1200(C14)/(L)トール左", category: "コの字タイプ", width: 1200, price: 69600 },
  { id: "C24R", name: "W1600(C24)/(R)トール右", category: "コの字タイプ", width: 1600, price: 81000 },
  { id: "C24L", name: "W1600(C24)/(L)トール左", category: "コの字タイプ", width: 1600, price: 81000 },
  { id: "C26R", name: "W2000(C26)/(R)トール右", category: "コの字タイプ", width: 2000, price: 109700 },
  { id: "C26L", name: "W2000(C26)/(L)トール左", category: "コの字タイプ", width: 2000, price: 109700 },
  { id: "L12R", name: "W1200(L12)/(R)トール右", category: "L型タイプ", width: 1200, price: 50800 },
  { id: "L12L", name: "W1200(L12)/(L)トール左", category: "L型タイプ", width: 1200, price: 50800 },
  { id: "L22R", name: "W1600(L22)/(R)トール右", category: "L型タイプ", width: 1600, price: 62200 },
  { id: "L22L", name: "W1600(L22)/(L)トール左", category: "L型タイプ", width: 1600, price: 62200 },
  { id: "L23R", name: "W2000(L23)/(R)トール右", category: "L型タイプ", width: 2000, price: 78300 },
  { id: "L23L", name: "W2000(L23)/(L)トール左", category: "L型タイプ", width: 2000, price: 78300 },
];

export const STORAGE_CATEGORIES = ["なし", "一の字タイプ", "二の字タイプ", "トールタイプ", "コの字タイプ", "L型タイプ"];

export const DAIWA_PRICES: Record<number, number> = {
  800: 2300,
  1200: 3100,
  1600: 3700,
  2000: 3900
};

export const SHIPPING_FEE_MAP: Record<string, number> = {
  "青森県": 58000, "岩手県": 58000, "宮城県": 53000, "福島県": 53000, "山形県": 53000,
  "茨城県": 48000, "栃木県": 45000, "群馬県": 45000, "東京都": 43000, "埼玉県": 43000,
  "千葉県": 43000, "神奈川県": 43000, "福井県": 42000, "山梨県": 42000, "長野県": 42000,
  "新潟県": 42000, "岐阜県": 40000, "愛知県": 40000, "静岡県": 42000, "三重県": 40000,
  "大阪府": 42000, "滋賀県": 42000, "京都府": 42000, "兵庫県": 42000, "和歌山県": 45000,
  "島根県": 58000, "岡山県": 50000, "広島県": 50000, "山口県": 58000, "徳島県": 48000,
  "愛媛県": 53000, "高知県": 48000, "福岡県": 68000, "佐賀県": 68000, "長崎県": 68000,
  "熊本県": 68000, "鹿児島県": 68000,
};
