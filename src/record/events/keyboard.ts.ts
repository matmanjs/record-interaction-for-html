import { EventCollection } from '../EventCollection';
import { recordState } from '../RecordState';
import { IChangeElement } from './input';

const codeList = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'];

export class KeyboardEvents extends EventCollection {
  constructor() {
    super();
    this.registerEventListener('keydown', this.onKeyboard.bind(this), true);
  }

  onKeyboard(event: Event) {
    // @ts-ignore
    const { key } = event;
    if (!codeList.includes(key)) {
      return;
    }
    const el = event.target as IChangeElement;

    const record = () => {
      recordState.recordElementCommand('sendKeys', el, key);
    };

    if (key === 'Enter' && el.changeEventPromise) {
      // change事件在keydown之后，需要promise纠正录制时序
      el.changeEventPromise.then(() => {
        record();
      });
    } else {
      record();
    }

    // enter在某些情况下会默认触发一次click 比如百度首页 需要屏蔽
    recordState.preventClickEvent(100);
  }
}

export const keyboardEvents = new KeyboardEvents();
