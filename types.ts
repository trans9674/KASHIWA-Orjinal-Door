
export enum DoorType {
  Hinged = "片開き戸",
  Sliding = "片引戸",
  Sliding2 = "片引き2枚",
  Sliding3 = "片引き3枚",
  Pocket = "片引込戸",
  Outset = "アウトセット片引戸",
  OutsetIncorner = "アウトセット片引戸入隅用",
  DoubleSliding2 = "引き違い2枚",
  DoubleSliding3 = "引き違い3枚",
  DoubleSliding4 = "引き違い4枚(2本溝)",
  Folding2 = "折戸2枚",
  Folding4W12 = "折戸4枚/W12",
  Folding4W16 = "折戸4枚/W16",
  Folding6 = "折戸6枚",
  Folding8 = "折戸8枚",
  StorageDouble = "物入両開き",
  StorageSingle = "物入片開き"
}

export enum UsageLocation {
  LD = "LD",
  Room = "居室",
  Toilet = "トイレ・洗面"
}

export interface PriceRecord {
  type: string;
  location: UsageLocation;
  design: string;
  notes: string;
  height: string;
  framePrice: number;
  doorPrice: number;
  setPrice: number;
}

export interface DoorItem {
  id: string;
  roomName: string;
  type: string;
  design: string;
  width: string;
  customWidth?: number;
  height: string;
  customHeight?: number;
  frameType: string;
  hangingSide: string;
  doorColor: string;
  frameColor: string;
  handleColor: string;
  specialNotes: string;
  price: number;
  // Frame Options
  isUndercut?: boolean;
  undercutHeight?: number;
  isFrameExtended?: boolean;
  frameExtensionHeight?: number;
}

export interface EntranceStorage {
  type: string;
  size: string;
  color: string;
  basePrice: number;
  baseRing: string;
  baseRingPrice: number;
  filler: string;
  fillerPrice: number;
  fillerCount: number;
  mirror: string;
  mirrorPrice: number;
}

export interface BaseboardItem {
  product: string;
  color: string;
  unitPrice: number;
  quantity: number;
  unit: string;
}

export interface OrderState {
  customerInfo: {
    company: string;
    address: string;
    siteName: string;
    contactName: string;
    phone: string;
    deliveryDate1: string;
    deliveryDate2: string;
    delivery1Selection: {
      baseboard: boolean;
      storage: boolean;
    };
    delivery2Selection: {
      baseboard: boolean;
      storage: boolean;
    };
    ceilingPB: string;
  };
  doors: DoorItem[];
  storage: EntranceStorage;
  baseboards: BaseboardItem[];
  shipping: number;
  memo: string;
}
