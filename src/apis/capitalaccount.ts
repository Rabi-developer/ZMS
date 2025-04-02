import apiFetch from "@/components/utils/fetchInstance";

const createCapitalAccount = async (CapitalAccount: any) => {
  try {
    const response = await apiFetch('CapitalAccount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CapitalAccount),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllCapitalAccount = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`CapitalAccount?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getSingleCapitalAccount = async (id: string) => {
  try {
    const response = await apiFetch(`CapitalAccount/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateCapitalAccount = async (id: string, CapitalAccount: any) => {
  try {
    const response = await apiFetch(`CapitalAccount`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(CapitalAccount),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteCapitalAccount = async (id: string) => {
  try {
    const response = await apiFetch(`CapitalAccount/${id}`, {
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
    const response = await apiFetch(`CapitalAccount/allhierarchy`, {
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

export {
  createCapitalAccount,
  getAllCapitalAccount,
  getSingleCapitalAccount,
  updateCapitalAccount,
  deleteCapitalAccount,
  getAllAccountHierarchy,
};