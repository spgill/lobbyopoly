// Vendor imports
import axios from "axios";
import msgpack from "msgpack-lite";

export async function makeRequest(method, url, data) {
  const response = await axios.request({
    method,
    url,
    headers: {
      "content-type": "application/msgpack",
    },
    responseType: "arraybuffer",
    data: msgpack.encode(data),
  });
  console.error(response.data);
  const decoded = msgpack.decode(Buffer.from(response.data));

  return decoded;
}

export function parseResponseData(data) {}
