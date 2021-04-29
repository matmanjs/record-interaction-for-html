import { EventCollection } from '../EventCollection';
import { recordState } from '../RecordState';

let preventClickTwice = false;

export class ClickEvents extends EventCollection {
  constructor() {
    super();
    this.registerEventListener('click', this.onClick.bind(this), true);
    this.registerEventListener('dblclick', this.onDoubleclick.bind(this), true);
  }

  onClick(event: Event) {
    // @ts-ignore
    const isPass = event.button === 0 && !recordState.isPreventClick && event.isTrusted;
    if (!isPass) {
      return;
    }
    if (!preventClickTwice) {
      recordState.recordElementCommand('click', event.target, '');
      preventClickTwice = true;
    }
    setTimeout(() => {
      preventClickTwice = false;
    }, 30);
  }

  onDoubleclick(event: Event) {
    recordState.recordElementCommand('doubleClick', event.target, '');
  }
}

export const clickEvents = new ClickEvents();
