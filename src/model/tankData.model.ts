import mongoose, { Schema } from "mongoose";

// export interface tankDataDocument extends mongoose.Document{
//     vocono : string
//     tankNo : string
//     nozzleNo : string
//     volume :number
//     level : number
//     oilRatio : number
//     temperature : number
//     saleLiter : number
//     createAt : Date
// }

// const tankDataSchema = new Schema({
//     vocono: { type: String, required: true, unique: true },
//     tankNo : {type: String , required : true},
//     nozzleNo : {type: String , required : true},
//     volume : {type : Number , required : true},
//     level : {type : Number , required : true},
//     oilRatio : {type : Number , required : true},
//     temperature : {type : Number , required : true},
//     saleLiter : {type : Number , required : true} ,
//     dateOfDay : {type : Number , required :  true},
//     createAt : {type: Date, default: Date.now}
// })

export interface tankDataDocument extends mongoose.Document {
  vocono: string;
  nozzleNo: string;
  asyncAlready: string;
  data: [];
}

const tankDataSchema = new Schema({
  stationDetailId: {
    type: Schema.Types.ObjectId,
    ref: "stationDetail",
    required: true,
  },
  asyncAlready: { type: String, required: true, default: "0" },
  vocono: { type: String, required: true, unique: true },
  nozzleNo: { type: String, required: true },
  data: { type: Array, default: [] },
});

const tankDataModel = mongoose.model<tankDataDocument>(
  "tankData",
  tankDataSchema
);

export default tankDataModel;
