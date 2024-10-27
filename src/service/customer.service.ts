import { FilterQuery } from "mongoose";
import customerModel, { customerDocument } from "../model/customer.model";
import customerCreditModel from '../model/customerCredit.model';

export const getCustomer = async (query: FilterQuery<customerDocument>) => {
  return await customerModel.find(query);
};

export const addCustomer = async (body) => {
  const customer = await customerModel.create({
     cusName: body.cusName,
     cusPhone: body.cusPhone,
     cusType: body.cusType,
     cusCardId: body.cusCardId,
     cusVehicleType: body.cusVehicleType,
     cusCarNo: body.cusCarNo,
     cusDebAmount: body.cusDebAmount,
     cusDebLiter: body.cusDebLiter
  });

  if(body.cusType === 'credit') {
    await customerCreditModel.create({
      customer: customer._id,
      creditType: body.creditType,
      creditDueDate: body.creditDueDate,
      limitAmount: body.limitAmount
    });
  }
  
  return customer;
};

export const getCustomerByCardId = async (
  cardId: string
)=> {
  return await customerModel.findOne({ cusCardId: cardId });
};
