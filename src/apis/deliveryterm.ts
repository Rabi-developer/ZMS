import apiFetch from "@/components/utils/fetchInstance";

const createDeliveryTerm = async (DeliveryTerm: any) => {
  try {
    const response = await apiFetch('DeliveryTerm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(DeliveryTerm),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllDeliveryTerms = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`DeliveryTerm?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getSingleDeliveryTerm = async (id: string) => {
  try {
    const response = await apiFetch(`DeliveryTerm/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateDeliveryTerm = async (id: string, DeliveryTerm: any) => {
  try {
    const response = await apiFetch(`DeliveryTerm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(DeliveryTerm),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteDeliveryTerm = async (id: string) => {
  try {
    const response = await apiFetch(`DeliveryTerm/${id}`, {
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
    const response = await apiFetch(`DeliveryTerm/allhierarchy`, {
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
  createDeliveryTerm,
  getAllDeliveryTerms,
  getSingleDeliveryTerm,
  updateDeliveryTerm,
  deleteDeliveryTerm,
  getAllAccountHierarchy,
};