import { FilterQuery } from "mongoose";
import mptaModel, { mptaDocument } from "../model/mpta.model";
import { getVehicle } from '../utils/vehicles';

export const getMpta = async (query: FilterQuery<mptaDocument>) => {
    return await mptaModel.find(query).select("-__v");
};

export const addMpta = async (body: any) => {
    try {
        const vehicle = getVehicle(body.vehicle_type_id);

        const mptaData = {
            nozzleNo: body.gun_id,
            depNo: body.pump_id,
            carNo: body.vehicle_number,
            vehicleTypeId: vehicle.id,
            vehicleType: vehicle.name,
            shopCode: body.shop_code,
            liter: body.total_litre,
            amount: body.total_amount,
        }

        const mpta = await mptaModel.create(mptaData);

        return mpta;
    } catch (error) {
        return error;
    }
};

