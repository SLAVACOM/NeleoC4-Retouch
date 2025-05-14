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
    return this.generationService.getGenerations();
  }

  @Get('id')
  async getGenerationByID(@Param('id') id: number): Promise<Generation> {
    return this.generationService.getGenerationById(+id);
  }

 
}
