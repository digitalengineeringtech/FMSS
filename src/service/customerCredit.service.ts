import { FilterQuery } from "mongoose";
import customerCreditModel, { customerCreditDocument } from "../model/customerCredit.model";


export const getCreditCustomer = async (query: FilterQuery<customerCreditDocument>) => {
    return await customerCreditModel.find(query).populate("customer");
};
export const addCreditCustomer = async (body: customerCreditDocument) => {
    return await new customerCreditModel(body).save();
}