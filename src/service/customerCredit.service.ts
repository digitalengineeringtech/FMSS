import mongoose, { FilterQuery } from "mongoose";
import customerCreditModel, { customerCreditDocument } from "../model/customerCredit.model";
import creditReturnModel from '../model/creditReturn.model';


export const getCreditCustomer = async (query: FilterQuery<customerCreditDocument>) => {
    const filter = {
        ...query,
        customer: query.customer,
        limitAmount: query.limitAmount,
        cusCardId: query.cusCardId
    }
    
    return await customerCreditModel.find(filter)
                .populate("customer")
                .select("-__v");
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