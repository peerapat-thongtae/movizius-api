import { Client, ClientConfig } from '@line/bot-sdk';

// export const LineConfig: ClientConfig = {
//   channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
//   channelSecret: process.env.LINE_CHANNEL_SECRET ?? "",
// };

// const LineClient = new Client(LineConfig);

// export default LineClient;

export default class LineClient extends Client {
  channelAccessToken: string;
  channelSecret: string;

  constructor(props: any) {
    super({
      channelAccessToken: props.channelAccessToken,
      channelSecret: props.channelSecret,
    });
  }
}
