import apiFetch from "@/components/utils/fetchInstance";

const createAccountId = async (AccountId: any) => {
  try {
    const response = await apiFetch('AccountId', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AccountId),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllAccountId = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`AccountId?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getSingleAccountId = async (id: string) => {
  try {
    const response = await apiFetch(`AccountId/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateAccountId = async (id: string, AccountId: any) => {
  try {
    const response = await apiFetch(`AccountId`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(AccountId),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteAccountId = async (id: string) => {
  try {
    const response = await apiFetch(`AccountId/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllAccountHierarchy = async () => {
  try {
    const response = await apiFetch(`AccountId/allhierarchy`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, true);
    const transformHierarchy = (accounts: any[]): any[] => {
      return accounts.map(account => ({
        id: account.id,
        listid: account.listid,
        description: account.description,
        parentId: account.parentAccountId,
        children: transformHierarchy(account.children || [])
      }));
    };

    return transformHierarchy(response.data);
    
  } catch (error: any) {
    throw new Error(`Failed to fetch account hierarchy: ${error.message}`);
  }
};
 
export const searchAccountsByName = async (name: string) => {
  try {
    const response = await apiFetch(`AccountId/search/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, true);
    
    return response.data.map((account: any) => ({
      id: account.id,
      listid: account.listid,
      description: account.description,
      accountType: account.accountType
    }));
  } catch (error: any) {
    throw new Error(`Error searching accounts: ${error.message}`);
  }
};
export {
  createAccountId,
  getAllAccountId,
  getSingleAccountId,
  updateAccountId,
  deleteAccountId,
  getAllAccountHierarchy,
};