import apiFetch from "@/components/utils/fetchInstance";

// Employee-create
const createEmployee = async (employee : any) => {
  try {
    const response = await apiFetch('employee', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(employee),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Employee-list
const getAllEmployee  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Employee?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllEmployeePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`EmployeePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Employee-data
const getSingleEmployee  = async (id: string) => {
  try {
    const response = await apiFetch(`employee/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Employee-update
const updateEmployee  = async (id: string, employee: any) => {
  try {
    const response = await apiFetch(`employee`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(employee ),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Employee-data
const deleteEmployee  = async (id: string) => {
  try {
    const response = await apiFetch(`employee/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};

export { createEmployee , getAllEmployee , getAllEmployeePositions , getSingleEmployee , updateEmployee , deleteEmployee  };
