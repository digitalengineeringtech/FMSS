import mongoose from 'mongoose';
import detailSaleModel from '../model/detailSale.model';
import { handleMissingFinalData } from '../service/detailSale.service';
import config  from 'config';
import { permitNozzles, storeInCache } from '../utils/helper';

export const deviceLiveData = new Map();  // Stores real-time fueling data
export const pendingVouchers = new Map(); // Stores fueling vouchers waiting for Final
export const timers = new Map(); // Stores timeout references


export const liveDataChangeHandler = async (data) => {
  try {
    const regex = /[A-Z]/g;

    let liveData: number[] = data.split(regex);

    const nozzleNo = liveData[0] || '';
    const saleLiter = liveData[1] || 0;
    const salePrice = liveData[2] || 0;

    if(!nozzleNo || saleLiter <= 0 || salePrice <= 0) {
      return;
    }

    const checkPermit = storeInCache(nozzleNo);

    if(checkPermit == false) {
      permitNozzles.delete(nozzleNo);
      return;
    }

    deviceLiveData.set(nozzleNo, [saleLiter, salePrice]);

    // Check if fueling is stopped by previous saleLiter == current saleLiter 5 seconds
    const livetimeout = config.get<number>("liveDataTimeout");

    setTimeout(async () => {
      const [lastSale, lastPrice] = deviceLiveData.get(nozzleNo) || [0, 0];

      if(lastSale == saleLiter && lastPrice == salePrice) {
          console.log('Fueling stopped for nozzle:', nozzleNo);
          await handleFuelingStop(nozzleNo);
          return;
      }
    }, livetimeout);

    if (timers.has(nozzleNo)) {
      clearTimeout(timers.get(nozzleNo));
      timers.delete(nozzleNo);
    }

  } catch (e) {
    throw new Error(e);
  }
};

const handleFuelingStop = async (nozzleNo) => {
   if(!deviceLiveData.has(nozzleNo)) {
      return;
   }

   const [saleLiter, salePrice] = deviceLiveData.get(nozzleNo);

   await detailSaleModel
        .findOne({ nozzleNo })
        .sort({ _id: -1, createAt: -1 })
        .lean()
        .then((sale) => {
            if(!sale || sale.isFinal == true) {
                console.log('No previous voucher found for nozzle:', nozzleNo);
                return;
            }
            pendingVouchers.set(nozzleNo, [new mongoose.Types.ObjectId(sale._id), saleLiter, salePrice]);

            const finalTimeout = config.get<number>("finalDataTimeout");

            const timeout = setTimeout(async () => {
              await handleMissingFinalData(nozzleNo);
            }, finalTimeout);
      
            timers.set(nozzleNo, timeout);
        });
}

export const clearVoucher = async (nozzleNo) => {
    deviceLiveData.delete(nozzleNo);
    pendingVouchers.delete(nozzleNo);
    permitNozzles.delete(nozzleNo);
  
    if (timers.has(nozzleNo)) {
      clearTimeout(timers.get(nozzleNo));
      timers.delete(nozzleNo);
    }
}