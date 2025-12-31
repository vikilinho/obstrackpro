
export enum ProtocolType {
  POST_OP = 'Post-Op Standard',
  Q1H = '1 Hourly (Q1H)',
  Q2H = '2 Hourly (Q2H)',
  Q4H = '4 Hourly (Q4H)',
  Q6H = '6 Hourly (Q6H)',
  Q12H = '12 Hourly (Q12H)'
}

export interface Observation {
  id: string;
  time: Date;
  completed: boolean;
  label: string;
}

export interface Patient {
  id: string;
  bedNumber: string;
  startTime: Date;
  observations: Observation[];
  protocol: ProtocolType;
  theme: string;
}

export enum ObsStatus {
  OVERDUE = 'overdue',
  DUE_SOON = 'due_soon',
  FUTURE = 'future',
  COMPLETED = 'completed'
}
