import { FilterQuery, UpdateQuery } from "mongoose";
import userModel, { UserInput, UserDocument } from "../model/user.model";
import { compass, createToken, set } from "../utils/helper";
import { permitDocument } from "../model/permit.model";
import config from "config";
import InstallerUserModel, { InstallerUserDocument } from "../model/installerUser.model";

export const registerUser = async (payload: UserInput) => {
  try {
    let result = await userModel.create(payload);
    let userObj: Partial<UserDocument> = result.toObject();
    delete userObj.password;
    return userObj;
  } catch (e) {
    throw new Error(e);
  }
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  let user = await userModel
    .findOne({ email })
    .populate("roles permits")
    .select("-__v");

  if (!user || !compass(password, user.password)) {
    throw new Error("Creditial Error");
  }

  const tankDataUrl = config.get<string>("tankDataUrl");

  let hasAtg: boolean;

  if (tankDataUrl != '') {
    hasAtg = true;
  } else {
    hasAtg = false;
  }

  let userObj: Partial<UserDocument> = user.toObject();
  userObj["token"] = createToken(userObj);
  userObj["hasAtg"] = hasAtg;
  
  delete userObj.password;

  set(user._id, userObj);
  set("user", userObj);
  set("stationNo", userObj.stationNo);
  set("stationId", userObj.stationId);
  set('tankCount', userObj.tankCount);

  return userObj;
};

export const loginInstallerUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    let user = await InstallerUserModel
      .findOne({ email })
      .populate("roles permits collectionId")
      .exec();
    // .select("-__v");

    console.log(user);

    if (!user || !compass(password, user.password)) {
      throw new Error("Creditial Error");
    }

    let userObj: Partial<InstallerUserDocument> | any = user.toObject();
    userObj["token"] = createToken(userObj);

    delete userObj.password;

    return userObj;
  } catch (e: any) {
    throw new Error(e);
  }
};

export const cardAuth = async (cardId: string): Promise<{ token: string }> => {
  let user = await userModel.findOne({ cardId });

  if (!user) throw new Error("Not a valid card");

  let userObj: Partial<UserDocument> = user.toObject();

  delete userObj.password;

  set(user._id, userObj);
  set("user", userObj);
  set("stationNo", userObj.stationNo);
  set("stationId", userObj.stationId);

  const userToken = createToken(userObj);

  return { token: userToken };
};

export const getUser = async (query: FilterQuery<UserDocument>) => {
  try {
    return await userModel
      .find(query)
      .lean()
      .populate({ path: "roles permits" })
      .select("-password -__v");
  } catch (e) {
    throw new Error(e);
  }
};

export const getCredentialUser = async (query: FilterQuery<UserDocument>) => {
  try {
    let result = await userModel
      .find(query)
      .lean()
      .populate({ path: "roles permits" })
      .select("-__v");
    return [result[0].email, result[0].password];
  } catch (e) {
    throw new Error(e);
  }
};

export const updateUser = async (
  query: FilterQuery<UserDocument>,
  body: UpdateQuery<UserDocument>
) => {
  try {
    await userModel.updateMany(query, body).select("-password -__v");
    return await userModel.find(query).lean();
  } catch (e) {
    throw new Error(e);
  }
};

export const deleteUser = async (query: FilterQuery<UserDocument>) => {
  try {
    return await userModel.deleteMany(query);
  } catch (e) {
    throw new Error(e);
  }
};

export const userAddRole = async (
  userId: UserDocument["_id"],
  roleId: UserDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, {
      $push: { roles: roleId },
    });
    return await userModel.findById(userId).select("-password -__v");
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userRemoveRole = async (
  userId: UserDocument["_id"],
  roleId: UserDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, {
      $pull: { roles: roleId },
    });
    return await userModel.findById(userId).select("-password -__v");
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userAddPermit = async (
  userId: UserDocument["_id"],
  permitId: permitDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, { $push: { permits: permitId } });
    return await userModel.findById(userId).select("-password -__v");
  } catch (e: any) {
    throw new Error(e);
  }
};

export const userRemovePermit = async (
  userId: UserDocument["_id"],
  permitId: permitDocument["_id"]
) => {
  try {
    await userModel.findByIdAndUpdate(userId, { $pull: { permits: permitId } });
    return await userModel.findById(userId);
  } catch (e: any) {
    throw new Error(e);
  }
};

export const addNewUser = async (payload: UserDocument) => {
  // console.log(payload.name)
  let user = await userModel.findOne({ name: payload.name });
  if (user) {
    return "user already exist";
  }
  try {
    return await new userModel(payload).save();
  } catch (e: any) {
    return new Error(e);
  }
};
