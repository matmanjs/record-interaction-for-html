import { EventCollection } from '../EventCollection';
import { recordState } from '../RecordState';

const tapDuration = 400;

/**
 * swipe tap longPress
 */
export class TouchEvents extends EventCollection {
  startPosition?: { clientX: number; clientY: number; pageX: number; pageY: number };
  startTouchTime!: number;
  starTouchMoveTime!: number;
  endTouchTime!: number;

  constructor() {
    super();
    this.registerEventListener('touchstart', this.onTouchStart.bind(this), true);
    this.registerEventListener('touchmove', this.onTouchMove.bind(this), true);
    this.registerEventListener('touchend', this.onTouchEnd.bind(this), true);
  }

  onTouchStart(event: TouchEvent) {
    if (!event.bubbles || !event.isTrusted) {
      return;
    }
    const touchPoint = event.changedTouches[0];
    const { documentElement } = document;
    if (touchPoint.clientX < documentElement.clientWidth && touchPoint.clientY < documentElement.clientHeight) {
      const { clientX, clientY, pageX, pageY } = touchPoint;
      this.startPosition = {
        clientX,
        clientY,
        pageX,
        pageY,
      };
      this.startTouchTime = Date.now();
      this.starTouchMoveTime = 0;
    }
  }

  onTouchMove() {
    this.starTouchMoveTime = Date.now();
  }

  onTouchEnd(event: TouchEvent) {
    if (event.bubbles && event.isTrusted) {
      const touchPoint = event.changedTouches[0];
      this.endTouchTime = Date.now();
      const { startPosition } = this;
      if (this.starTouchMoveTime > 0 && startPosition) {
        recordState.recordElementCommand(
          'swipe',
          event.target,
          `${startPosition.clientX},${startPosition.clientY},${touchPoint.clientX},${touchPoint.clientY}`,
        );
      } else if (this.starTouchMoveTime === 0 && this.endTouchTime - this.startTouchTime <= tapDuration) {
        recordState.recordElementCommand('tap', event.target, '');
      } else if (this.starTouchMoveTime === 0 && this.endTouchTime - this.startTouchTime > tapDuration) {
        recordState.recordElementCommand('longPress', event.target, `${this.endTouchTime - this.startTouchTime}`);
      }
      this.startTouchTime = 0;
      this.endTouchTime = 0;
      this.starTouchMoveTime = 0;
      this.startPosition = undefined;
    }
  }
}

export const touchEvents = new TouchEvents();
