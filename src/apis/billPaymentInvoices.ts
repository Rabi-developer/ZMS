import apiFetch from "@/components/utils/fetchInstance";

// BillPaymentInvoices-create
const createBillPaymentInvoices = async (BillPaymentInvoices : any) => {
  try {
    const response = await apiFetch('BillPaymentInvoices', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BillPaymentInvoices),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BillPaymentInvoices-list
const getAllBillPaymentInvoices  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`BillPaymentInvoices?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBillPaymentInvoicesPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BillPaymentInvoicesPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BillPaymentInvoices-data
const getSingleBillPaymentInvoices  = async (id: string) => {
  try {
    const response = await apiFetch(`BillPaymentInvoices/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBillPaymentInvoices = async (BillPaymentInvoices: any, data: { lines: { vehicleNo: string; orderNo: string; amount: number; munshayana?: string | undefined; remarks?: string | undefined; broker?: string | undefined; dueDate?: string | undefined; }[]; paymentDate: string; invoiceNo?: string | undefined; }) => {
  try {
    const response = await apiFetch(`BillPaymentInvoices`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BillPaymentInvoices),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BillPaymentInvoices-data
const deleteBillPaymentInvoices  = async (id: string) => {
  try {
    const response = await apiFetch(`BillPaymentInvoices/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};

const updateBillPaymentInvoicesStatus = async (BillPaymentInvoicesStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('BillPaymentInvoices/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BillPaymentInvoicesStatus.id, Status: BillPaymentInvoicesStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createBillPaymentInvoices , getAllBillPaymentInvoices , getAllBillPaymentInvoicesPositions , getSingleBillPaymentInvoices , updateBillPaymentInvoices , deleteBillPaymentInvoices, updateBillPaymentInvoicesStatus  };