import apiFetch from "@/components/utils/fetchInstance";

// Brooker-create
const createBrooker = async (Brooker : any) => {
  try {
    const response = await apiFetch('Brooker', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Brooker),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Brooker-list
const getAllBrooker  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Brooker?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBrookerPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BrookerPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Brooker-data
const getSingleBrooker  = async (id: string) => {
  try {
    const response = await apiFetch(`Brooker/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBrooker = async (Brooker: any, data?: { name?: string; mobile?: string; address?: string; id?: string; }) => {
  try {
    const response = await apiFetch(`Brooker`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Brooker),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Brooker-data
const deleteBrooker  = async (id: string) => {
  try {
    const response = await apiFetch(`Brooker/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateBrookerStatus = async (BrookerStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Brooker/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BrookerStatus.id, Status: BrookerStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createBrooker , getAllBrooker , getAllBrookerPositions , getSingleBrooker , updateBrooker , deleteBrooker, updateBrookerStatus  };
