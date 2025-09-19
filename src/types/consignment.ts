// Types for Consignment create/update payloads aligned with backend schema

export interface ConsignmentItemPayload {
  id?: string; // present on update
  biltyNo: string;
  receiptNo: string;
  consignor: string;
  consignee: string;
  item: string;
  qty: number;
  totalAmount: number;
  recvAmount: number;
  delDate: string;
  status: string;
}

export interface ConsignmentOrderPayload {
  id?: string; // present on update
  orderNo: string;
  orderDate: string;
  transporter: string;
  vendor: string;
  vehicleNo: string;
  containerNo: string;
  vehicleType: string;
  driverName: string;
  contactNo: string;
  munshayana: string;
  cargoWeight: string;
  bookedDays: string;
  detentionDays: string;
  fromLocation: string;
  departureDate: string;
  via1: string;
  via2: string;
  toLocation: string;
  expectedReachedDate: string;
  reachedDate: string;
  vehicleMunshyana: string;
  remarks: string;
  contractOwner: string;
  
  status: string;
  consignments: ConsignmentItemPayload[];
}
