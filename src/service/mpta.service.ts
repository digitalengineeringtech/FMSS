import { FilterQuery } from "mongoose";
import mptaModel, { mptaDocument } from "../model/mpta.model";
import { getVehicle } from '../utils/vehicles';
import { get } from '../utils/helper';
import deviceModel from "../model/device.model";
import { preSetDetailSale } from "./detailSale.service";

export const getMpta = async (query: FilterQuery<mptaDocument>) => {
    return await mptaModel.find(query).select("-__v");
};

export const addMpta = async (body: any) => {
    try {
        const user = await get("user");        

        const device = await deviceModel.findOne({ dep_no: body.pump_id, nozzle_no: body.gun_id }).lean();

        const vehicle = getVehicle(body.vehicle_type_id);

        checkErrors(user, vehicle, device);

        const {litre, amount} = formatDecimal(body.total_litre, body.total_amount);
        
        const mptaData = {  
            nozzleNo: body.gun_id,
            depNo: body.pump_id,
            carNo: body.vehicle_number,
            vehicleTypeId: vehicle.id,
            vehicleType: vehicle.name,
            shopCode: body.shop_code,
            litre: body.total_litre,
            amount: body.total_amount,
        }

        const presetData = {
            depNo: body.pump_id,
            nozzleNo: body.gun_id,
            fuelType: device?.fuel_type,
            carNo: body.vehicle_number,
            vehicleType: vehicle.name,
            cashType: 'Cash',
            salePrice: '0',
            device: 'QR',
            cusCardId: '',
            user: user,   
            saleLiter: litre,
            totalPrice: amount,
        }

        const preset = await preSetDetailSale(presetData.depNo, presetData.nozzleNo, amount, 'P', presetData);

        if(!preset) return { msg:'Car number by card create failed...', error: 'Preset create failed' };

        const mpta = await new mptaModel(mptaData).save();
        
        if(!mpta) return { msg:'Car number by card create failed...', error: 'Preset & Car number by card not created' };

        return mpta;

    } catch (error) {
        return error;
    }
};

const checkErrors = (user, device, vehicle) => {
    // check if user is exist
    if(!user) return { msg:'Car number by card create failed...', error: 'No user found' };

    // check if device is exist
    if(!device) return { msg:'Car number by card create failed...', error: 'No device found' };

    // check if vehicle is exist
    if(!vehicle) return { msg:'Car number by card create failed...', error: 'No vehicle type found' };

    return true;
}

const formatDecimal = (litre, amount) => {
    const stringLitre = litre.toString();
    const stringAmount = amount.toString();

    if (stringAmount.length > 7) {
        return { msg: 'Car number by card create failed...', error: 'You can enter only 7 digit' };
    }
    if (stringLitre.length > 7) {
        return { msg: 'Car number by card create failed...', error: 'You can enter only 7 digit' };
    }

    let arr = stringLitre.split(".");
    let integerPart = arr[0];
    let decimalPart = arr[1] || ""; // Ensure there's a string to work with

    // Validation for integer and decimal parts
    if (integerPart.length > 3 || decimalPart.length > 3) {
        return { msg: 'Car number by card create failed...', error: 'The number format is 999.999' };
    }

    // Format the parts
    let formattedLitre = `${integerPart.padStart(4, "0")}.${decimalPart.padEnd(3, "0")}`;
    let formattedAmount = stringAmount.padStart(7, "0");

    return {
        litre: formattedLitre,
        amount: formattedAmount
    };
};

