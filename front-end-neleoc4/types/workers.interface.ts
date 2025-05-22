export interface IWorker {
  id: number;
  login: string;
  password?: string;
  roles: string[];
  name?: string;
  description?: string;
  isDelete?: boolean;
}

export interface GetWorkers {
  workers: IWorker[];
  userCount: number;
  pageCount: number;
}


export interface IHelperWorker {
  id: number;
  info: string;
}
