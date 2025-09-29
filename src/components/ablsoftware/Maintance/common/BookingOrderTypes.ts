// src/components/ablsoftware/Maintance/common/BookingOrderTypes.ts

export const ALL_COLUMNS = [
  { key: "serial", label: "S.No" },
  { key: "orderNo", label: "Or.NO" },
  { key: "ablDate", label: "Date" },
  { key: "orderDate", label: "Or.Date" },
  { key: "consignor", label: "Consignor" },
  { key: "consignee", label: "Consignee" },
  { key: "vehicleNo", label: "Vehicle No" },
  { key: "bookingAmount", label: "Booking Amount" },
  { key: "biltyNo", label: "Bilty No" },
  { key: "biltyAmount", label: "Bilty Amount" },
  { key: "article", label: "Article" },
  { key: "qty", label: "Qty" },
  { key: "departure", label: "Departure" },
  { key: "destination", label: "Destination" },
  { key: "vendor", label: "Vendor" },
  { key: "carrier", label: "Carrier" },
] as const;

export type ColumnKey = typeof ALL_COLUMNS[number]["key"];

export interface RowData {
  serial: number | string;
  orderNo: string;
  ablDate: string;
  orderDate: string;
  consignor: string;
  consignee: string;
  vehicleNo: string;
  bookingAmount: number;
  biltyNo: string;
  biltyAmount: number;
  consignmentFreight: number;
  article: string;
  qty: string;
  departure: string;
  destination: string;
  vendor: string;
  carrier: string;
  isOrderRow: boolean;

}

export const labelFor = (key: ColumnKey) => ALL_COLUMNS.find((c) => c.key === key)?.label || key;