import apiFetch from "@/components/utils/fetchInstance";

// BookingOrder-create
const createBookingOrder = async (BookingOrder : any) => {
  try {
    const response = await apiFetch('BookingOrder', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BookingOrder),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BookingOrder-list
const getAllBookingOrder  = async (pageIndex: any = 1, pageSize: any = 10, filters: any = {}) => {
  try {
    let queryParams = `PageIndex=${pageIndex}&PageSize=${pageSize}`;
    if (filters.orderNo) {
      queryParams += `&OrderNo=${filters.orderNo}`;
    }
    const response = await apiFetch(`BookingOrder?${queryParams}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBookingOrderPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BookingOrderPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BookingOrder-data
const getSingleBookingOrder  = async (id: string) => {
  try {
    const response = await apiFetch(`BookingOrder/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBookingOrder = async (BookingOrder: any, data?: any) => {
  try {
    const response = await apiFetch(`BookingOrder`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BookingOrder),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BookingOrder-data
const deleteBookingOrder  = async (id: string) => {
  try {
    const response = await apiFetch(`BookingOrder/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateBookingOrderStatus = async (BookingOrderStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('BookingOrder/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BookingOrderStatus.id, Status: BookingOrderStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createBookingOrder , getAllBookingOrder , getAllBookingOrderPositions , getSingleBookingOrder , updateBookingOrder , deleteBookingOrder, updateBookingOrderStatus  };
