import { Client, ClientConfig } from '@line/bot-sdk';

export default class LineClient extends Client {
  channelAccessToken: string;
  channelSecret: string;

  constructor(props: { channelAccessToken: string; channelSecret: string }) {
    super({
      channelAccessToken: props.channelAccessToken,
      channelSecret: props.channelSecret,
    });
  }
}
