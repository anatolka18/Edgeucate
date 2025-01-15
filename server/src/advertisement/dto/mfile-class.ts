export interface IUploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export class MFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;

  constructor(file: IUploadedFile | MFile) {
    this.buffer = file.buffer;
    this.mimetype = file.mimetype;
    this.originalname = file.originalname;
  }
}