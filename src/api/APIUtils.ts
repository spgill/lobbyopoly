// Vendor imports
import axios, { AxiosError } from 'axios';

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

export async function makeRequest<REQ = any, RESP = any>(
  method: string,
  url: string,
  data?: REQ,
): Promise<ServerMessage<RESP | undefined>> {
  let message: ServerMessage<RESP | undefined> = {};

  try {
    const response = await axios.request({
      method,
      url,
      // headers: {
      //   'content-type': 'application/msgpack',
      // },
      // responseType: 'arraybuffer',
      data,
    });

    message = response.data;
  } catch (err) {
    if (typeof err === 'object') {
      const axiosErr = err as AxiosError;
      message = {
        error: axiosErr.message,
      };
    }
  }

  // const decoded: ServerMessage<RESP> = msgpack.decode(
  //   Buffer.from(response.data),
  //   { codec },
  // );

  // if (process.env.NODE_ENV === 'development') {
  //   // eslint-disable-next-line no-console
  //   console.log('Decoded response:', method, url, decoded);
  // }

  return message;
}
