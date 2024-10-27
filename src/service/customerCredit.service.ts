import mongoose, { FilterQuery } from "mongoose";
import customerCreditModel, { customerCreditDocument } from "../model/customerCredit.model";
import detailSaleModel from "../model/detailSale.model";


export const getCreditCustomer = async (query: FilterQuery<customerCreditDocument>) => {
    return await customerCreditModel.find(query).populate("customer");
};
export const addCreditCustomer = async (body: customerCreditDocument) => {
    return await new customerCreditModel(body).save();
}

export const checkCreditLimit = async (id: mongoose.Types.ObjectId) => {
    let customerCredit = await customerCreditModel.findOne({ customer: id });

    if(customerCredit) {
        const query = {
            customerId: id,
            creditPaid: false,
            saleLiter: { $ne: 0 },
            salePrice: { $ne: 0 },
        }
        const sales = await detailSaleModel.find(query).select('salePrice');
    
        const totalSales = sales.reduce((acc,  sale) => acc + sale.salePrice, 0);
    
        if(customerCredit.limitAmount <= totalSales)  {
            return false;
        } 
        return true;
    }
}