import { FilterQuery, ObjectId } from "mongoose";
import creditReturnModel, { creditReturnDocument } from '../model/creditReturn.model';
import customerCreditModel from "../model/customerCredit.model";

export const getCreditReturn = async (query: FilterQuery<creditReturnDocument>) => {
    return await creditReturnModel.find(query)
                    .populate("detailSale", "-__v")
                    .populate("customerCredit", "-__v")
                    .select("-__v")
                    .lean();
}

export const updateCreditReturn = async (body: creditReturnDocument) => {
    const query = {
        customerCredit: body.customerCredit,
        isPaid: false
    };

    // Fetch unpaid records sorted by creditAmount in descending order
    const creditReturns = await creditReturnModel.find(query)
                            .sort({ creditAmount: -1 })
                            .lean();

    let paidedAmount = 0; 
    const fullyPaidIds: { _id: ObjectId, returnAmount: number }[] = [];  // To track fully paid records

    for (const record of creditReturns) {
        // Calculate remaining amount available to pay in this iteration
        const remainingReturnAmount = body.returnAmount - paidedAmount;

        // Check if we can fully cover this record's creditAmount with the remaining returnAmount
        if (record.creditAmount <= remainingReturnAmount) {
            // Fully cover this record
            fullyPaidIds.push({
                _id: record._id,
                returnAmount: record.creditAmount // Store the full amount that was paid
            });
            paidedAmount += record.creditAmount;
            
            // Update the record to show it is fully paid
            await creditReturnModel.updateOne(
                { _id: record._id },
                {
                    isPaid: true,
                    returnDate: body.returnDate,
                    returnAmount: record.creditAmount,  // Full amount paid
                    creditAmount: 0  // Mark as fully paid
                }
            );
        } else {
            // Partially pay this record
            const amountToPay = remainingReturnAmount;  // Amount we can still pay
            const remainingCreditAmount = record.creditAmount - amountToPay;  // Calculate the new remaining credit amount

            // Update this specific record with the new remaining credit amount
            await creditReturnModel.updateOne(
                { _id: record._id },
                {
                    isPaid: false,
                    returnDate: body.returnDate,
                    returnAmount: amountToPay,  // Record the amount paid
                    creditAmount: remainingCreditAmount  // Update the remaining credit amount
                }
            );
            break; // Stop processing after handling the partial payment
        }
    }

    // Update the fully paid records to set isPaid to true
    if(fullyPaidIds.length == 0) {
        throw new Error('Failed to update credit return records.');
    }

    try {
        const updateQuery = fullyPaidIds.map(item => ({
            updateOne: {
                filter: { _id: item._id },
                update: {
                    $set: {
                        returnAmount: item.returnAmount // Use the creditAmount that was paid
                    }
                }
            }
        }));
    
        const bulkUpdate = await creditReturnModel.bulkWrite(updateQuery);
    
        if(bulkUpdate.modifiedCount == fullyPaidIds.length) {
            const customerCredit = await customerCreditModel.findById(body.customerCredit);
            if (customerCredit) {
                customerCredit.limitAmount += body.returnAmount; // Increase limit amount by returnAmount
                await customerCredit.save(); // Save the updated customer credit document
            }
        
            return await creditReturnModel.find({})
                            .populate("detailSale", "-__v")
                            .populate("customerCredit", "-__v")
                            .select('-__v')
                            .lean();
        }
    } catch (error) {
        console.error('Error during updating credit return records:', error);
        throw new Error('An error occurred while updating credit return records.');
    }
};

export const updateSingleCreditReturn = async (id: string, body: creditReturnDocument) => {
    const query = {
        isPaid: false,
        _id: id
    }

    const creditReturn = await creditReturnModel.findOne(query);
    
    if (!creditReturn) {
        throw new Error('Credit return not found.');
    }

    const check = checkCreditReturn(creditReturn.creditAmount, body.returnAmount);

    if(check.status == false) {
        throw new Error(check.message);
    }

    const customerCredit = await customerCreditModel.findById(creditReturn.customerCredit);

    if (customerCredit) {
        customerCredit.limitAmount += body.returnAmount; // Increase limit amount by returnAmount
        await customerCredit.save(); // Save the updated customer credit document
    }

    const updatedCreditReturn = await creditReturnModel.findByIdAndUpdate(id, {
        isPaid: true,
        returnAmount: body.returnAmount,
        returnDate: body.returnDate,
        creditAmount: 0,
    }, { new: true })
    .populate("detailSale", "-__v")
    .populate("customerCredit", "-__v")
    .select('-__v')
    .lean();

    return updatedCreditReturn;
}

const checkCreditReturn = (creditAmount, returnAmount) => {
    if(creditAmount < returnAmount) {
        return {
            status: false,
            message: 'You can not pay more than credit amount...'
        }
    }

    if(creditAmount > returnAmount) {
       return {
           status: false,
           message: 'You can not pay less than credit amount...'
       }
    }

    return {
        status: true,
        message: 'Success'
    }
}
