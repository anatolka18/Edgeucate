export class CreateFeedbackDto {
    readonly advertisementId: string;
    readonly studentEmail: string;
    readonly teacherEmail: string;
    readonly text: string;
    readonly title: string;
    readonly stars: number;
  }