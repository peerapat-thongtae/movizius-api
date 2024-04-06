import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Response } from 'express';

@Injectable()
export class LineMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: any, response: Response, next: NextFunction) {
    // Define variable
    const signature = request.headers['x-line-signature'] as string;
    console.log(signature);

    // Response process
    // response.on('finish', () => {
    //   const { statusCode, statusMessage } = response;
    //   const contentLength = response.get('content-length');

    //   // Text patten
    //   this.logger.log(
    //     `${method} ${originalUrl} ${statusCode} ${statusMessage} ${contentLength} - ${userAgent} ${ip}`,
    //   );
    // });
    next();
  }
}
