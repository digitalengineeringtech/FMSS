import { FilterQuery } from "mongoose";
import customerModel, { customerDocument } from "../model/customer.model";

export const getCustomer = async (query: FilterQuery<customerDocument>) => {
  return await customerModel.find(query);
};

export const addCustomer = async (body: customerDocument) => {
  return await new customerModel(body).save();
};

export const getCustomerByCardId = async (
  cardId: string
)=> {
  return await customerModel.findOne({ cusCardId: cardId });
};
