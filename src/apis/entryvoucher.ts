import apiFetch from "@/components/utils/fetchInstance";

// EntryVoucher-create
const createEntryVoucher = async (EntryVoucher : any) => {
  try {
    const response = await apiFetch('EntryVoucher', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(EntryVoucher),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// EntryVoucher-list
const getAllEntryVoucher  = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    if (filters.orderNo) {
      queryParams += `&OrderNo=${filters.orderNo}`;
    }
    const response = await apiFetch(`EntryVoucher?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllEntryVoucherPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`EntryVoucherPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-EntryVoucher-data
const getSingleEntryVoucher  = async (id: string) => {
  try {
    const response = await apiFetch(`EntryVoucher/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateEntryVoucher = async (EntryVoucher: any) => {
  try {
    const response = await apiFetch(`EntryVoucher`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(EntryVoucher),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-EntryVoucher-data
const deleteEntryVoucher  = async (id: string) => {
  try {
    const response = await apiFetch(`EntryVoucher/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateEntryVoucherStatus = async (EntryVoucherStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('EntryVoucher/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: EntryVoucherStatus.id, Status: EntryVoucherStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createEntryVoucher , getAllEntryVoucher , getAllEntryVoucherPositions , getSingleEntryVoucher , updateEntryVoucher , deleteEntryVoucher, updateEntryVoucherStatus  };
