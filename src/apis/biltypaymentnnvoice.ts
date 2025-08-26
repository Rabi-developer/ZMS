import apiFetch from "@/components/utils/fetchInstance";

// BiltyPaymentInvoice-create
const createBiltyPaymentInvoice = async (BiltyPaymentInvoice : any) => {
  try {
    const response = await apiFetch('BiltyPaymentInvoice', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BiltyPaymentInvoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BiltyPaymentInvoice-list
const getAllBiltyPaymentInvoice  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBiltyPaymentInvoicePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoicePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BiltyPaymentInvoice-data
const getSingleBiltyPaymentInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBiltyPaymentInvoice = async (BiltyPaymentInvoice: any, data?: { lines: { vehicleNo: string; orderNo: string; amount: number; munshayana?: string | undefined; remarks?: string | undefined; broker?: string | undefined; dueDate?: string | undefined; }[]; paymentDate: string; invoiceNo?: string | undefined; }) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BiltyPaymentInvoice),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BiltyPaymentInvoice-data
const deleteBiltyPaymentInvoice  = async (id: string) => {
  try {
    const response = await apiFetch(`BiltyPaymentInvoice/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};

const updateBiltyPaymentInvoiceStatus = async (BiltyPaymentInvoiceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('BiltyPaymentInvoice/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BiltyPaymentInvoiceStatus.id, Status: BiltyPaymentInvoiceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createBiltyPaymentInvoice , getAllBiltyPaymentInvoice , getAllBiltyPaymentInvoicePositions , getSingleBiltyPaymentInvoice , updateBiltyPaymentInvoice , deleteBiltyPaymentInvoice, updateBiltyPaymentInvoiceStatus  };