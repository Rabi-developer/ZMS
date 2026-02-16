import apiFetch from "@/components/utils/fetchInstance";

// AccountOpeningBalance-create
const createAccountOpeningBalance = async (AccountOpeningBalance : any) => {
  try {
    const response = await apiFetch('AccountOpeningBalance', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(AccountOpeningBalance),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// AccountOpeningBalance-list
const getAllAccountOpeningBalance  = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    if (filters.orderNo) {
      queryParams += `&OrderNo=${filters.orderNo}`;
    }
    const response = await apiFetch(`AccountOpeningBalance?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllAccountOpeningBalancePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AccountOpeningBalancePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-AccountOpeningBalance-data
const getSingleAccountOpeningBalance  = async (id: string) => {
  try {
    const response = await apiFetch(`AccountOpeningBalance/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateAccountOpeningBalance = async (AccountOpeningBalance: any) => {
  try {
    const response = await apiFetch(`AccountOpeningBalance`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(AccountOpeningBalance),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-AccountOpeningBalance-data
const deleteAccountOpeningBalance  = async (id: string) => {
  try {
    const response = await apiFetch(`AccountOpeningBalance/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateAccountOpeningBalanceStatus = async (AccountOpeningBalanceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('AccountOpeningBalance/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: AccountOpeningBalanceStatus.id, Status: AccountOpeningBalanceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
const updateAccountOpeningBalanceFiles = async ({ id, files }: { id: string; files: string }) => {
  try {
    if (!id) throw new Error('updateAccountOpeningBalanceFiles: id is required');
    if (typeof files !== 'string') throw new Error('updateAccountOpeningBalanceFiles: files must be a comma-separated string');

    // Try partial update first (PATCH only Files field)
    try {
      const patchResponse = await apiFetch(`AccountOpeningBalance/Files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, files }),
      }, true);
      return patchResponse;
    } catch (patchErr) {
      console.warn('PATCH AccountOpeningBalance/{id} failed, falling back to merge+PUT:', patchErr);
    }

    // Fallback: fetch existing order and merge Files, then PUT full payload
    const existing = await getSingleAccountOpeningBalance(id);
    const existingOrder = (existing as any)?.data || existing;
    if (!existingOrder) throw new Error('updateAccountOpeningBalanceFiles: existing order not found');

    const payload = { ...existingOrder, files };
    const response = await apiFetch(`AccountOpeningBalance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, true);

    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createAccountOpeningBalance , getAllAccountOpeningBalance , getAllAccountOpeningBalancePositions , getSingleAccountOpeningBalance , updateAccountOpeningBalance , deleteAccountOpeningBalance, updateAccountOpeningBalanceStatus , updateAccountOpeningBalanceFiles  };
