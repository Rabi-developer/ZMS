import apiFetch from "@/components/utils/fetchInstance";

// SaleTexes-create
const createSaleTexes = async (SaleTexes : any) => {
  try {
    const response = await apiFetch('SalesTax', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(SaleTexes),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// SaleTexes-list
const getAllSaleTexes  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`SalesTax?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllSaleTexesPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`SalesTaxPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-SaleTexes-data
const getSingleSaleTexes  = async (id: string) => {
  try {
    const response = await apiFetch(`SalesTax/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateSaleTexes = async (SaleTexes: any) => {
  try {
    const response = await apiFetch(`SalesTax`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(SaleTexes),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-SaleTexes-data
const deleteSaleTexes  = async (id: string) => {
  try {
    const response = await apiFetch(`SalesTax/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateSaleTexesStatus = async (SaleTexesStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('SalesTax/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: SaleTexesStatus.id, Status: SaleTexesStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createSaleTexes , getAllSaleTexes , getAllSaleTexesPositions , getSingleSaleTexes , updateSaleTexes , deleteSaleTexes, updateSaleTexesStatus  };
