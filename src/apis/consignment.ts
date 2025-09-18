import apiFetch from "@/components/utils/fetchInstance";

// Consignment-create
const createConsignment = async (Consignment : any) => {
  try {
    const response = await apiFetch('Consignment', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Consignment),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Consignment-list
const getAllConsignment  = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    if (filters.orderNo) {
      queryParams += `&OrderNo=${filters.orderNo}`;
    }
    const response = await apiFetch(`Consignment?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllConsignmentPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`ConsignmentPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Consignment-data
const getSingleConsignment  = async (id: string) => {
  try {
    const response = await apiFetch(`Consignment/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateConsignment = async ( consignment: any) => {
   try {
   
    const response = await apiFetch(`Consignment`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(consignment),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Consignment-data
const deleteConsignment  = async (id: string) => {
  try {
    const response = await apiFetch(`Consignment/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateConsignmentStatus = async (ConsignmentStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Consignment/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: ConsignmentStatus.id, Status: ConsignmentStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createConsignment , getAllConsignment , getAllConsignmentPositions , getSingleConsignment , updateConsignment , deleteConsignment, updateConsignmentStatus  };
