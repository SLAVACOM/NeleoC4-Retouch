export enum SortKeys {
  Id = 'id',
  Name = 'telegramUsername',
  TelegramId = 'telegramId',
  CreatedAt = 'createdAt'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum SearchCriteria {
  Id = 'id',
  Name = 'telegramUsername',
  TelegramId = 'telegramId',
  CreatedAtBefore = 'createdAtBefore',
  CreatedAtAfter = 'createdAtAfter'
}

export enum UserStatus {
  Active = 'active',
  Block = 'inactive',
  All = 'all'
}
