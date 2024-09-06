import { FilterQuery, UpdateQuery } from "mongoose";
import {
  totalStatementDocument,
  totalStatementModel,
} from "../model/totalStatement.model";

export const getTotalStatement = async (
  query: FilterQuery<totalStatementDocument>
) => {
  return await totalStatementModel.find(query);
};

export const addTotalStatement = async (body: totalStatementDocument) => {
  return await new totalStatementModel(body).save();
};

export const updateTotalStatement = async (
  id: string,
  body: UpdateQuery<totalStatementDocument>
) => {
  let result = await totalStatementModel.findByIdAndUpdate(id, body);
  return await totalStatementModel.findById(id);
};
