import apiFetch from "@/components/utils/fetchInstance";

// AccountOpeningBalance-create
const createAccountOpeningBalance = async (accountOpeningBalance: any) => {
  try {
    const response = await apiFetch('AccountOpeningBalance', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(accountOpeningBalance),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// AccountOpeningBalance-list
const getAllAccountOpeningBalance = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    if (filters.searchQuery) {
      queryParams += `&SearchQuery=${encodeURIComponent(filters.searchQuery)}`;
    }
    if (filters.refId) {
      queryParams += `&RefId=${filters.refId}`;
    }
    if (filters.totalCount) {
      queryParams += `&TotalCount=${filters.totalCount}`;
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

// get-single-AccountOpeningBalance-data
const getSingleAccountOpeningBalance = async (id: string) => {
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

// update-AccountOpeningBalance
const updateAccountOpeningBalance = async (accountOpeningBalance: any) => {
  try {
    const response = await apiFetch(`AccountOpeningBalance`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(accountOpeningBalance),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-AccountOpeningBalance-data
const deleteAccountOpeningBalance = async (id: string) => {
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

// update-AccountOpeningBalance-status
const updateAccountOpeningBalanceStatus = async (accountOpeningBalanceStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('AccountOpeningBalance/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: accountOpeningBalanceStatus.id, Status: accountOpeningBalanceStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { 
  createAccountOpeningBalance, 
  getAllAccountOpeningBalance, 
  getSingleAccountOpeningBalance, 
  updateAccountOpeningBalance, 
  deleteAccountOpeningBalance, 
  updateAccountOpeningBalanceStatus 
};
