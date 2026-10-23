export interface BirthdayEmployee {
  id: string | number;
  name: string;
  designation: string;
  department: string;
  photo?: string | null;
  message?: string | null;
  isSelf?: boolean;
  wished?: boolean;
}

export interface BirthdayAPIResponse {
  success: boolean;
  data: BirthdayEmployee[];
}
