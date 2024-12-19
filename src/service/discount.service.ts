import { FilterQuery } from "mongoose";
import discountModel, { discountDocument } from "../model/discount.model";

export const getDiscount = async (query: FilterQuery<discountDocument>) => {
    return await discountModel.find(query).select("-__v");
};

export const createDiscount = async (data: any) => {
  let discount = await discountModel.create(data);
  return discount;
};

export const updateDiscount = async (id, body) => {
    try {
      if (body.isActive) {
          await discountModel.updateMany(
              { _id: { $ne: id }, isActive: true },
              { $set: { isActive: false, amount: body.amount } }
          );
      }
      
      // Update the targeted discount regardless of isActive status
      const updatedDiscount = await discountModel.findByIdAndUpdate(id, body, { new: true });
      return updatedDiscount;
    } catch (error) {
        return error;
    }
};

export const deleteDiscount = async (id) => {
    try {
       const discount = await discountModel.findByIdAndDelete(id);

       return discount;
       
    } catch (error) {
        return error.message;
    }
};