import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(6)
  aidn: number;

  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
