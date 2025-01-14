import axios from "axios";
import config from "config";

// check station is already expired
export const checkStationExpire = async (stationId: string) => {
    const userCloudUrl = config.get<string>("userCloudUrl");

    const url = userCloudUrl + "/" + stationId;

    const response = await axios.get(url);

    if (response.status != 200) {
        return null;
    }

    return response.data;
}