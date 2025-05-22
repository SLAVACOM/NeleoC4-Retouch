import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Payment } from '@prisma/client';
import { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  paymentPage(
    @Query('description') description = 'Оплата услуги',
    @Query('amount') amount = '1.00',
    @Query('currency') currency = 'RUB',
    @Query('invoiceId') invoiceId = '1234567',
    @Query('accountId') accountId = 'user@example.com',
    @Query('data') data = '{}',
    @Res() res: Response,
  ) {
    Logger.log(
      `GET - /payments\nRequest\ndescription: ${description}, amount: ${amount}, currency: ${currency}, invoiceId: ${invoiceId}, accountId: ${accountId}, data: ${data}`,
    );
    const paymentHtml = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Оплата</title>
        <script src="https://widget.cloudpayments.ru/bundles/cloudpayments"></script>
    </head>
    <body>
        <h1>Пожалуйста, подождите...</h1>
        <script>    
            document.addEventListener("DOMContentLoaded", function() {
                var widget = new cp.CloudPayments();
                widget.charge({
                    publicId: '${process.env.CLOUDPAYMENTS_API_KEY}', // Ваш публичный ключ
                    description: '${description}', // Описание платежа
                    amount: ${parseFloat(amount)}, // Сумма платежа
                    currency: '${currency}', // Валюта платежа
                    invoiceId: '${invoiceId}', // Уникальный номер заказа
                    accountId: '${accountId}', // Идентификатор пользователя
                    data: ${JSON.stringify(JSON.parse(data))} // Доп. параметры
                },
                function (options) { // success
                    window.location.href = '/payments/success';
                },
                function (reason, options) { // fail
                    window.location.href = '/payments/fail';
                });
            });
        </script>
    </body>
    </html>
    `;
    res.send(paymentHtml);
  }

  @Post('webhook/pay')
  async handleWebhook(@Body() data: any) {
    Logger.log(
      'POST - /payments/webhook/pay\nRequest\n' + JSON.stringify(data),
    );

    let parsedData: any = {};
    try {
      parsedData =
        typeof data.Data === 'string' ? JSON.parse(data.Data) : data.Data;
    } catch (e) {
      console.error('Failed to parse Data field:', e);
    }

    const paymentData: Partial<Payment> = {
      userId: parsedData.telegram_user_id,
      amount: parseFloat(data.Amount),
      productId: parsedData.product,
      promoCode: parsedData.promocode || null,
      generationCount: parseInt(parsedData.generations || '0') || 0,
    };

    await this.paymentsService.createPayment(paymentData);
    Logger.log(
      'POST - /payments/webhook/pay\nResponse\n' + JSON.stringify({ code: 0 }),
    );
    return { code: 0 };
  }

  @Get('/success')
  paymentSuccessPage() {
    return 'Спасибо за оплату!';
  }

  @Get('/fail')
  paymentFailPage() {
    return 'Платеж не удался. Попробуйте еще раз.';
  }

  @Get('get')
  async getAllPayments(
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
    @Query('searchQuery') searchQuery: string,
    @Query('searchCriteria') searchCriteria: string,
    @Query('sortKey') sortKey: string,
    @Query('sortDirection') sortDirection: string,
  ): Promise<ReturnType<PaymentsService['getAllPayments']>> {
    Logger.log(
      `GET - /payments/get\nRequest\npage: ${page}, perPage: ${perPage}, searchQuery: ${searchQuery}, searchCriteria: ${searchCriteria}, sortKey: ${sortKey}, sortDirection: ${sortDirection}`,
    );
    const response = await this.paymentsService.getAllPayments({
      searchQuery,
      searchCriteria,
      sortKey,
      sortDirection,
      page: Number(page),
      perPage: Number(perPage),
    });
    Logger.log('GET - /payments/get\nResponse\n' + JSON.stringify(response));
    return response;
  }
}
