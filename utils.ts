
import { Observation, ObsStatus, ProtocolType } from './types';

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60000);

const generateUid = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const playSound = (type: 'success' | 'check' | 'alert') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Nice chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'check') {
      // Gentle click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export const generateObservations = (startTime: Date, protocol: ProtocolType): Observation[] => {
  const observations: Observation[] = [];

  if (protocol === ProtocolType.POST_OP) {
    // 1. 30 mins x3
    for (let i = 1; i <= 3; i++) {
      observations.push({
        id: generateUid('30m'),
        time: addMinutes(startTime, 30 * i),
        completed: false,
        label: `30m #${i}`
      });
    }

    // 2. 1 hourly x2
    const last30m = observations[observations.length - 1].time;
    for (let i = 1; i <= 2; i++) {
      observations.push({
        id: generateUid('1h'),
        time: addMinutes(last30m, 60 * i),
        completed: false,
        label: `1h #${i}`
      });
    }

    // 3. 2 hourly x2
    const last1h = observations[observations.length - 1].time;
    for (let i = 1; i <= 2; i++) {
      observations.push({
        id: generateUid('2h'),
        time: addMinutes(last1h, 120 * i),
        completed: false,
        label: `2h #${i}`
      });
    }

    // 4. 4 hourly x3
    const last2h = observations[observations.length - 1].time;
    for (let i = 1; i <= 3; i++) {
      observations.push({
        id: generateUid('4h'),
        time: addMinutes(last2h, 240 * i),
        completed: false,
        label: `4h #${i}`
      });
    }
  } else {
    // Fixed intervals (Q1H, Q2H, etc.)
    let intervalMins = 60;
    let count = 24; 

    switch (protocol) {
      case ProtocolType.Q1H: intervalMins = 60; count = 24; break;
      case ProtocolType.Q2H: intervalMins = 120; count = 12; break;
      case ProtocolType.Q4H: intervalMins = 240; count = 6; break;
      case ProtocolType.Q6H: intervalMins = 360; count = 4; break;
      case ProtocolType.Q12H: intervalMins = 720; count = 2; break;
    }

    for (let i = 1; i <= count; i++) {
      observations.push({
        id: generateUid('fixed'),
        time: addMinutes(startTime, intervalMins * i),
        completed: false,
        label: protocol
      });
    }
  }

  return observations;
};

export const getObsStatus = (obs: Observation, now: Date): ObsStatus => {
  if (obs.completed) return ObsStatus.COMPLETED;
  
  const timeDiff = obs.time.getTime() - now.getTime();
  const fifteenMinutesInMs = 15 * 60000;

  if (timeDiff < 0) return ObsStatus.OVERDUE;
  if (timeDiff <= fifteenMinutesInMs) return ObsStatus.DUE_SOON;
  return ObsStatus.FUTURE;
};
