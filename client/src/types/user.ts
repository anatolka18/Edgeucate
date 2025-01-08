export interface INotification {
  type: string
  text: string
  checked: boolean
  date: Date
}

export interface IMessage {
  message: string
  checked: boolean
  date: Date
  sender: string
}

export interface IChat {
  interlocutor: string;
  avatar: string;
  messages: IMessage[];
  online: boolean;
  username: string
}

export interface IUser {
  username: string
  email: string
  role: string
  avatar: string
  courses: string[]
  description: string
  notifications: INotification[]
  chat: IChat[]
  isBlocked: boolean;
  blockReason?: string;
  token?: string
}

export interface IUserData {
  username: string
  password: string
  email: string
  role: string
}

export interface IRegistrData {
  username: string
  password: string
  email: string
  role: string
}

export interface ILoginData {
  email: string
  password: string
  isBlocked?: boolean
  blockReason?: string
}

export enum Role {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin',
}

export interface ISignUpResponse {
  username: string;
  token: string;
}

export interface IFeedback {
  advertisementId: string
  username: string
  text: string
  title: string
  stars: number
  date: Date
}

export interface IStudentAction {
  teacherEmail: string;
  studentEmail: string;
}

export interface ICalendarEvent {
  _id: string;
  title: string;
  teacher_username: string;
  student_username: string;
  teacher_email: string;
  student_email: string;
  date: Date;
  time: string;
  cost: number;
}

export interface IResponseUser {
  username: string
  password: string
  email: string
  role: Role
  avatar: string
  courses: string[]
  description: string
  notifications: INotification[]
  students: string[];
  feedback: IFeedback[]
  chat: IChat[]
  online: boolean
  dateLastOnline: Date
  _id: string
  createdAt: string
  updatedAt: string
  isBlocked: boolean;
  blockReason?: string;
  __v: number
}