import { isWeekendInKolkata } from './timezone';

export type PortalMode = 'AUTOMATIC_WEEKEND' | 'MANUAL_OPEN' | 'MANUAL_CLOSED';

interface PortalConfig {
  mode: PortalMode;
  note: string;
  updatedBy: string;
  updatedAt: Date;
}

const portalState: PortalConfig = {
  mode: 'AUTOMATIC_WEEKEND',
  note: 'Standard weekend schedule active (Saturday & Sunday, Asia/Kolkata)',
  updatedBy: 'SYSTEM',
  updatedAt: new Date(),
};

export class PortalConfigManager {
  static getStatus() {
    const isWeekend = isWeekendInKolkata();
    let isOpen = false;
    let message = '';

    if (portalState.mode === 'MANUAL_OPEN') {
      isOpen = true;
      message = portalState.note || 'Portal manually enabled by staff administration.';
    } else if (portalState.mode === 'MANUAL_CLOSED') {
      isOpen = false;
      message = portalState.note || 'Portal temporarily closed by staff administration.';
    } else {
      // AUTOMATIC_WEEKEND
      isOpen = isWeekend;
      message = isWeekend
        ? 'Test portal is open. You can attend your aptitude tests today.'
        : 'Aptitude tests are available only on Saturday and Sunday (Asia/Kolkata).';
    }

    return {
      isOpen,
      mode: portalState.mode,
      note: portalState.note,
      isWeekend,
      timezone: 'Asia/Kolkata',
      message,
      updatedBy: portalState.updatedBy,
      updatedAt: portalState.updatedAt,
    };
  }

  static setMode(mode: PortalMode, note?: string, updatedBy = 'Staff Admin') {
    portalState.mode = mode;
    portalState.note =
      note ||
      (mode === 'MANUAL_OPEN'
        ? 'Portal manually unlocked for testing'
        : mode === 'MANUAL_CLOSED'
        ? 'Portal manually locked'
        : 'Standard weekend schedule (Saturday & Sunday)');
    portalState.updatedBy = updatedBy;
    portalState.updatedAt = new Date();
    return this.getStatus();
  }
}
