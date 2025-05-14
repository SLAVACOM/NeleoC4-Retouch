import * as fs from 'fs';
import * as path from 'path';

export class LocalizationService {
  private locales: Map<string, any> = new Map();

  constructor() {
    this.loadLocales();
  }
  private loadLocales() {
    const defaultPath = path.join(__dirname, '../../', 'src/messages/data');
    const localesPath = process.env.LOCALES_PATH || defaultPath;

    let files;

    try {
      files = fs.readdirSync(localesPath);
    } catch (err) {
      console.error('Ошибка чтения папки локалей:', err);
      return;
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const lang = file.replace('.json', '');
      const content = JSON.parse(
        fs.readFileSync(path.join(localesPath, file), 'utf-8'),
      );
      this.locales.set(lang, content);
    }
  }

  getMessage(key: string, lang: string = 'RU'): Promise<string> {
    let message = this.locales.get(lang)?.[key];
    if (!message) {
      console.warn(`❌ Ключ '${key}' не найден для языка '${lang}'`);
      message = `❌ ERROR`; // Явное сообщение об ошибке    }
      return message;
    }
    return message;
  }
}
