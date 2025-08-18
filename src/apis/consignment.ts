import apiFetch from "@/components/utils/fetchInstance";

// Consignment-create
const createConsignment = async (Consignment : any) => {
  try {
    const response = await apiFetch('Consignment', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Consignment),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Consignment-list
const getAllConsignment  = async (pageIndex: any = 1, pageSize: any = 10, p0?: { orderNo: string; }) => {
  try {
    const response = await apiFetch(`Consignment?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllConsignmentPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`ConsignmentPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Consignment-data
const getSingleConsignment  = async (id: string) => {
  try {
    const response = await apiFetch(`Consignment/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateConsignment = async (Consignment: any, data: { orderNo: string; biltyNo: string; date: string; consignor: string; consignee: string; items: { desc?: string | undefined; qty?: number | undefined; qtyUnit?: string | undefined; weight?: number | undefined; weightUnit?: string | undefined; }[]; consignmentMode?: string | undefined; receiptNo?: string | undefined; consignmentNo?: string | undefined; consignmentDate?: string | undefined; receiverName?: string | undefined; receiverContactNo?: string | undefined; shippingLine?: string | undefined; containerNo?: string | undefined; port?: string | undefined; destination?: string | undefined; freightFrom?: string | undefined; totalQty?: number | undefined; freight?: number | undefined; sbrTax?: string | undefined; sprAmount?: number | undefined; deliveryCharges?: number | undefined; insuranceCharges?: number | undefined; tollTax?: number | undefined; otherCharges?: number | undefined; totalAmount?: number | undefined; receivedAmount?: number | undefined; incomeTaxDed?: number | undefined; incomeTaxAmount?: number | undefined; deliveryDate?: string | undefined; remarks?: string | undefined; }) => {
  try {
    const response = await apiFetch(`Consignment`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Consignment),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Consignment-data
const deleteConsignment  = async (id: string) => {
  try {
    const response = await apiFetch(`Consignment/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateConsignmentStatus = async (ConsignmentStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Consignment/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: ConsignmentStatus.id, Status: ConsignmentStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createConsignment , getAllConsignment , getAllConsignmentPositions , getSingleConsignment , updateConsignment , deleteConsignment, updateConsignmentStatus  };
