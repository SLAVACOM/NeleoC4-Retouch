import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Generation } from '@prisma/client';
import { AddRetouch } from './dto/generation.dto';
import { GenerationService } from './generation.service';

@Controller('generations')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Get()
  async getGeneration(): Promise<Generation[]> {
    Logger.log('GET - /generations');
    const response = await this.generationService.getGenerations();
    return response;
  }

  @Get('id')
  async getGenerationByID(@Param('id') id: number): Promise<Generation> {
    Logger.log(`GET - /generations/${id}`);
    const response = await this.generationService.getGenerationById(+id);
    Logger.log('Response\n' + JSON.stringify(response));
    return response;
  }

 
}
