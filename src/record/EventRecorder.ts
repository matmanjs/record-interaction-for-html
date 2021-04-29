import { EventCollection } from './EventCollection';
import { clickEvents } from './events/click';
import { inputEvents } from './events/input';
import { keyboardEvents } from './events/keyboard.ts';
import { mouseEvents } from './events/mouse';
import { touchEvents } from './events/touch';
import { windowEvents } from './events/window';
// import { scrollEvents } from './events/scroll';

const defaultEvents = [inputEvents, keyboardEvents, mouseEvents, windowEvents];

export const EVENT_NAME = {
  INIT: 'INIT',
  DESTROY: 'DESTROY',
  MOUSE_MOVE: 'MOUSE_MOVE',
  BLUR: 'BLUR',
  CLICK: 'CLICK'
};

export class EventRecorder {
  eventCollections = new Set<EventCollection>(defaultEvents);
  mobileTouchMode = false;

  touchEvents = touchEvents;

  clickEvents = clickEvents;

  constructor(mobileTouchMode?: boolean) {
    this.mobileTouchMode = !!mobileTouchMode;
  }

  init() {
    const onReady = () => {
      console.log('获取录制状态');
      console.time('getAllRecordState');
      console.timeEnd('getAllRecordState');

      console.log('开始录制');
      this.startRecord();
    };

    // messageProxy.on('Record:stop', () => {
    //   console.log('停止录制');
    //   this.stopRecord();
    // });
    //
    // messageProxy.on('useTouch', (useTouch: boolean) => {
    //   this.mobileTouchMode = useTouch;
    //   this.toggleTouchMode();
    // });

    const onReadyStateChange = () => {
      if (document.readyState === 'interactive' || document.readyState === 'complete') {
        console.log(`录制开始时机:${document.readyState}`);
        onReady();
        document.removeEventListener('readystatechange', onReadyStateChange);
      }
    };
    document.addEventListener('readystatechange', onReadyStateChange);
  }

  startRecord() {
    this.eventCollections.forEach((collection) => {
      collection.attach();
    });
    this.toggleTouchMode();
  }

  stopRecord() {
    this.eventCollections.forEach((collection) => {
      collection.detach();
    });
    this.touchEvents.detach();
    this.clickEvents.detach();
  }

  private toggleTouchMode() {
    console.log('mobileTouchMode', this.mobileTouchMode);
    if (this.mobileTouchMode) {
      this.touchEvents.attach();
      this.clickEvents.detach();
    } else {
      this.touchEvents.detach();
      this.clickEvents.attach();
    }
  }
}

export const eventRecorder = new EventRecorder();

Object.defineProperty(window, '__eventRecorder', { value: eventRecorder });
