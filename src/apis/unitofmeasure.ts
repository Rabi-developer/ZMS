import apiFetch from "@/components/utils/fetchInstance";

// Create UnitOfMeasure
const createUnitOfMeasure = async (UnitOfMeasure: any) => {
  try {
    const response = await apiFetch('UnitOfMeasure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(UnitOfMeasure),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get All UnitOfMeasures
const getAllUnitOfMeasures = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`UnitOfMeasure?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Get Single UnitOfMeasure
const getSingleUnitOfMeasure = async (id: string) => {
  try {
    const response = await apiFetch(`UnitOfMeasure/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Update UnitOfMeasure
const updateUnitOfMeasure = async (id: string, UnitOfMeasure: any) => {
  try {
    const response = await apiFetch(`UnitOfMeasure/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(UnitOfMeasure),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Delete UnitOfMeasure
const deleteUnitOfMeasure = async (id: string) => {
  try {
    const response = await apiFetch(`UnitOfMeasure/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createUnitOfMeasure,
  getAllUnitOfMeasures,
  getSingleUnitOfMeasure,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
};