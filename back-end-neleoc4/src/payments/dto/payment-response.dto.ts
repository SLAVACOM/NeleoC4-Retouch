export class PaymentResponseDto {
  amount: number;
  userId: number;
  productId?: number;
  generationCount?: number;
  paymentInfo?:string
  promoCode?: string;
}
