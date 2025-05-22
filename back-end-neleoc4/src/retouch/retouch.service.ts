import { Injectable, Logger } from '@nestjs/common';
import { GenerationType, UsersSettings } from '@prisma/client';
import axios from 'axios';
import * as FormData from 'form-data';
import * as sharp from 'sharp';
import { ApiSettingsService } from 'src/api/api-settings.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/users/user.service';
import { SendRetouchDto } from './send-retouch.dto';

@Injectable()
export class RetouchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly settingsService: ApiSettingsService,
  ) {}

  async sendPhotoToRetouch(data: SendRetouchDto): Promise<string> {
    try {
      Logger.log('sendPhotoToRetouch\nRequest\n' + JSON.stringify(data));
      const settings = await this.settingsService.getSettingsById(
        data.settingsId,
      );

      const formData = new FormData();
      formData.append('file', data.file, 'photo.jpg');
      formData.append('token', data.token);
      formData.append('payload', JSON.stringify(settings));

      const response = await axios.post(`${data.retouchURL}/start`, formData, {
        headers: formData.getHeaders(),
      });

      if (response.status !== 200)
        throw new Error(`Ошибка отправки файла: ${response.statusText}`);

      if (data.type === GenerationType.FREE)
        await this.userService.decrementFreeUserGenerationsCount(data.userId);
      else
        await this.userService.decrementPaidUserGenerationsCount(data.userId);

      const newGeneration = await this.prisma.generation.create({
        data: {
          userId: data.userId,
          type: data.type,
          retouchId: response.data.id,
        },
      });
      Logger.log(
        'sendPhotoToRetouch\nResponse\n' +
          JSON.stringify(newGeneration.retouchId),
      );
      return newGeneration.retouchId;
    } catch (error) {
      Logger.error('sendPhotoToRetouch\nError\n' + error);
      throw new Error('Ошибка отправки файла');
    }
  }

  async editSetting(userId: number, settingId: number): Promise<UsersSettings> {
    Logger.log(
      `editSetting\nRequest\nuserId: ${userId}, settingId: ${settingId}`,
    );
    const response = await this.prisma.usersSettings.update({
      where: { userId },
      data: {
        settingsId: settingId,
      },
    });
    Logger.log('editSetting\nResponse\n' + JSON.stringify(response));
    return response;
  }

  async addVialsAndWatermark(
    baseImage: string,
    vialsPaths: string[] = [],
    addWatermark: boolean = true,
    customWatermarkBuffer?: Buffer,
  ): Promise<Buffer> {
    try {
      Logger.log(
        `addVialsAndWatermark\nRequest\nbaseImage: ${baseImage}, vialsPaths: ${JSON.stringify(vialsPaths)}, addWatermark: ${addWatermark}`,
      );
      let baseImageBuffer = await this.downloadImage(baseImage);
      let compositeArray: sharp.OverlayOptions[] = [];

      if (vialsPaths && vialsPaths.length > 0) {
        for (let i = 0; i < vialsPaths.length; i++) {
          const vial = await sharp(await this.downloadImage(vialsPaths[i]))
            .resize(150, 150)
            .ensureAlpha()
            .raw()
            .toBuffer();

          compositeArray.push({
            input: vial,
            gravity: 'northwest' as sharp.Gravity,
            left: i * 170,
            top: 0,
            blend: 'over',
            raw: {
              width: 150,
              height: 150,
              channels: 4,
            },
          });
        }
      }

      if (addWatermark) {
        try {
          const watermarBuffer = customWatermarkBuffer
            ? await sharp(customWatermarkBuffer)
                .resize(300, 300)
                .ensureAlpha()
                .raw()
                .toBuffer()
            : await sharp('/app/assets/watermark.png')
                .resize(300, 300)
                .ensureAlpha()
                .raw()
                .toBuffer();

          compositeArray.push({
            input: watermarBuffer,
            gravity: sharp.gravity.southeast,
            blend: 'over',
            raw: {
              width: 300,
              height: 300,
              channels: 4,
            },
          });
        } catch (e) {
          console.warn('Ошибка добавления водяного знака:', e.message);
        }
      }

      const result = await sharp(baseImageBuffer)
        .ensureAlpha()
        .composite(compositeArray)
        .toBuffer();


      return result;
    } catch (error) {
      Logger.error('addVialsAndWatermark\nError\n' + error);
      throw new Error(`Ошибка обработки изображения: ${error.message}`);
    }
  }

  async downloadImage(url: string): Promise<Buffer> {
    try {
      Logger.log('downloadImage\nRequest\nurl: ' + url);
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      return Buffer.from(response.data);
    } catch (error) {
      Logger.error('downloadImage\nError\n' + error);
      throw new Error(`Ошибка загрузки изображения: ${error.message}`);
    }
  }
}
