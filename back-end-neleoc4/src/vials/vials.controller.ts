import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CollectionDto } from './collection/dto/collection.dto';
import { VialsCollectionService } from './collection/vials-collection.service';
import { VialsService } from './vials/vials.service';
import { VialsDto } from './vials/dto/collection.dto'

@Controller('vials')
export class VialsController {
  constructor(
    private readonly vialsService: VialsService,
    private readonly collectionService: VialsCollectionService,
  ) {}

  @Get()
  async getVials() {
    Logger.log('Fetching all vials collection with vials');
    return this.collectionService.getCollectionsAndVials();
  }

  @Get('collection')
  async getCollection() {
    Logger.log('Fetching only all vials collection');
    return this.collectionService.getCollections();
  }

  @Post('collection')
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async createCollection(@Body() data: CollectionDto) {
    Logger.log(
      `Creating new collection name:${data.name} description:${data.description}`,
    );
    return this.collectionService.createNewCollection(data);
  }

  @Put('collection/:id')
  @UsePipes(new ValidationPipe())
  async updateCollection(@Param('id') id: number, @Body() data: CollectionDto) {
    Logger.log(
      `Updating collection id:${id} newName:${data.name} newDescription:${data.description}`,
    );
    return this.collectionService.updateCollection(+id, data);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  async createVial(@Body() data: VialsDto) {
    Logger.log(`Creating new vial name:${data.name} photoUrl:${data.photoUrl}`);
    return this.vialsService.createNewVial(data);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async updateVial(@Param('id') id: number, @Body() data: VialsDto) {
    Logger.log(
      `Updating vial id:${id} newName:${data.name} newPhotoUrl:${data.photoUrl} isDelete:${data.isDelete}`,
    );
    return this.vialsService.updateVials(+id, data);
  }
}
