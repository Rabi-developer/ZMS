import apiFetch from "@/components/utils/fetchInstance";

const createContract = async (Contract: any) => {
  try {
    const response = await apiFetch('Contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Contract),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllContract = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`Contract?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getSingleContract = async (id: string) => {
  try {
    const response = await apiFetch(`Contract/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateContract = async (id: string, Contract: any) => {
  try {
    const response = await apiFetch(`Contract`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(Contract),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteContract = async (id: string) => {
  try {
    const response = await apiFetch(`Contract/${id}`, {
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
    const response = await apiFetch(`Contract/allhierarchy`, {
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

const updateContractStatus = async (contractStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Contract/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: contractStatus.id, Status: contractStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createContract,
  getAllContract,
  getSingleContract,
  updateContract,
  deleteContract,
  getAllAccountHierarchy,
  updateContractStatus,
};