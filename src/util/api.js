// Vendor imports
import axios from "axios";
import bufferpack from "bufferpack";
import dayjs from "dayjs";
import dayjsLocalPlugin from "dayjs/plugin/localizedFormat";
import dayjsRelativePlugin from "dayjs/plugin/relativeTime";
import dayjsUtcPlugin from "dayjs/plugin/utc";
import msgpack from "msgpack-lite";

// Incorporate dayjs plugins
dayjs.extend(dayjsLocalPlugin);
dayjs.extend(dayjsRelativePlugin);
dayjs.extend(dayjsUtcPlugin);

// Create local codec to allow for custom type decoding
const codec = msgpack.createCodec();

// Decoder for dates, type 0x30
codec.addExtUnpacker(0x30, buffer => {
  // Unpack the
  // return dayjs.utc(bufferpack.unpack("!d", buffer)[0] * 1000).local();
  return null;
});

export async function makeRequest(method, url, data) {
  const response = await axios.request({
    method,
    url,
    headers: {
      "content-type": "application/msgpack",
    },
    responseType: "arraybuffer",
    data: msgpack.encode(data, { codec }),
  });

  const decoded = msgpack.decode(Buffer.from(response.data), { codec });

  return decoded;
}

export function parseResponseData(data) {}
