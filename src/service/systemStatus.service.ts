import systemStatusModel from "../model/systemStatus.model";

export const systemStatusGet = async () => {
  return await systemStatusModel.findOne({ id: "1" });
};

export const systemStatusUpdate = async (mode: string) => {
  await systemStatusModel.findOneAndUpdate({ id: "1" }, { mode });
  return await systemStatusModel.findOne({ id: "1" });
};

export const systemStatusAdd = async () => {
  try {
    let body = {
      id: "1",
      mode: "active",
    };
    let count = await systemStatusModel.countDocuments();
    if (count >= 1) throw new Error("that cann't add");
    return await new systemStatusModel(body).save();
  } catch (e) {
    console.log("already exist");
  }
};
