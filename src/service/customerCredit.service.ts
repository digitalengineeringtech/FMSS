import mongoose, { FilterQuery } from "mongoose";
import customerCreditModel, { customerCreditDocument } from "../model/customerCredit.model";
import creditReturnModel from '../model/creditReturn.model';
import customerModel from "../model/customer.model";
import { custom } from "zod";


export const getCreditCustomer = async (query: any) => {
    if(Object.keys(query).length == 0) {
        return await customerCreditModel
                    .find()
                    .populate('customer')
                    .select("-__v");
    }

  let filter: FilterQuery<customerCreditDocument> = {};
  // Example of how you can dynamically add filters based on query params
  if (query.limitAmount) filter.limitAmount = query.limitAmount;
  if (query.customer) filter.customer = query.customer;

  // if you find customer card id then we will filter customer by card id 
  // but it also include customer credit with customer value null because of populate
  // so we need to filter customer the results where customer is not null and return filtered results
  const results = await customerCreditModel
    .find(filter)
    .populate({
        path: 'customer',
        match: query.cusCardId ? { cusCardId: query.cusCardId } : undefined,
        select: '-__v'
    })
    .select("-__v");

  return results.filter(result => result.customer != null);
};
export const addCreditCustomer = async (body: customerCreditDocument) => {
    return await new customerCreditModel(body).save();
}

export const checkCreditLimit = async (id: mongoose.Types.ObjectId) => {
    let customerCredit = await customerCreditModel.findOne({ customer: id });

    if(customerCredit) {
        const credits = await creditReturnModel.find({
            cutomerCredit: customerCredit._id,
            isPaid: false
        });
    
        const creditSales = credits.reduce((acc,  sale) => acc + sale.creditAmount, 0);
    
        if(customerCredit.limitAmount <= creditSales)  {
            return false;
        } 
        return true;
    }
}