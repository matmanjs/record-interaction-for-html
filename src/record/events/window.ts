import { cacheWindowSize, isWindowSizeNotChanged, throttle } from '../../utils';
import { EventCollection } from '../EventCollection';
import { recordState } from '../RecordState';

export class WindowEvents extends EventCollection {
  constructor() {
    super();
    this.registerEventListener('resize', throttle(this.onResize.bind(this), 500), true);
  }

  onResize(event: UIEvent) {
    console.log('===onResize===', event);

    if (!event.isTrusted) {
      return;
    }

    if (event.cancelable) {
      return;
    }

    if (isWindowSizeNotChanged()) {
      return;
    }

    cacheWindowSize();

    recordState.recordCommand({
      command: 'resize',
      target: `${window.innerWidth},${window.innerHeight}`,
      value: '',
    });
  }
}

export const windowEvents = new WindowEvents();
