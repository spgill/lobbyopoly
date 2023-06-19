// Vendor imports
import axios from 'axios';
import msgpack from 'msgpack-lite';
import { Buffer } from 'buffer';

// DayJS and plugin imports
import dayjs from 'dayjs';
import dayjsLocalPlugin from 'dayjs/plugin/localizedFormat';
import dayjsRelativePlugin from 'dayjs/plugin/relativeTime';
import dayjsUtcPlugin from 'dayjs/plugin/utc';
import { ServerMessage } from './APITypes';

// Incorporate dayjs plugins
dayjs.extend(dayjsLocalPlugin);
dayjs.extend(dayjsRelativePlugin);
dayjs.extend(dayjsUtcPlugin);

// Create local codec to allow for custom type decoding
const codec = msgpack.createCodec();

// Decoder for dates, type 0x30
codec.addExtUnpacker(0x30, (buffer) => {
  let bufferDataView: DataView;
  if (Buffer.isBuffer(buffer)) {
    bufferDataView = new DataView(new Uint8Array(buffer).buffer);
  } else {
    bufferDataView = new DataView(buffer.buffer);
  }

  // Unpack the double from the buffer, multiply it by 1000 to convert to
  // milliseconds, and parse it as a UTC timestamp, then convert to local time.
  return dayjs.utc(bufferDataView.getFloat64(0) * 1000).local();
});

export async function makeRequest<REQ = any, RESP = any>(
  method: string,
  url: string,
  data?: REQ,
): Promise<ServerMessage<RESP>> {
  const response = await axios.request({
    method,
    url,
    // headers: {
    //   'content-type': 'application/msgpack',
    // },
    // responseType: 'arraybuffer',
    data,
  });

  // const decoded: ServerMessage<RESP> = msgpack.decode(
  //   Buffer.from(response.data),
  //   { codec },
  // );

  // if (process.env.NODE_ENV === 'development') {
  //   // eslint-disable-next-line no-console
  //   console.log('Decoded response:', method, url, decoded);
  // }

  return response.data;
}
