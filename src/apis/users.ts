import apiFetch from "@/components/utils/fetchInstance";

// org-create
const createAccount = async (Account: any) => {
  try {
    const response = await apiFetch('Account/CreateUserWithRole', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Account),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// org-list
const getAllAccounts = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Account?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-org-data
const getSingleAccount = async (id: string) => {
  try {
    const response = await apiFetch(`Account/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// org-update
const updateAccount = async (id: string, Account: any) => {
  try {
    const response = await apiFetch(`Account/UpdateUser`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(Account),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-org-data
const deleteAccount = async (id: string) => {
  try {
    const response = await apiFetch(`Account/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createAccount, getAllAccounts, getSingleAccount, updateAccount, deleteAccount };
