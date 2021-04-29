import { EventCollection } from '../EventCollection';
import { recordState } from '../RecordState';
import { throttle } from '../../utils';

export type IChangeElement = (HTMLInputElement | HTMLTextAreaElement) & {
  changeEventPromise?: Promise<void>;
  changeEventPromiseResolve?: any;
};

const inputTypes = ['text', 'password', 'datetime', 'datetime-local', 'email', 'url', 'search', 'tel', 'number'];
// input type which need to change value not type charactor
const inputTypeValue = ['date', 'month', 'time', 'week', 'color', 'range'];

/**
 * type select editContent
 */
export class InputCollection extends EventCollection {
  preventType = false;
  typeLock = false;

  editableElement?: HTMLElement;
  editableElementContent?: string;
  isEditableElementFocus = false;
  inputValue = '';

  constructor() {
    super();
    // type
    this.registerEventListener('input', throttle(this.onInput.bind(this), 300), true);
    this.registerEventListener('input', this.Inputs.bind(this), true);
    // @ts-ignore
    this.registerEventListener('compositionend', this.onCompositionend.bind(this), true);
    // compositionend 拼音输入结束事件
    this.registerEventListener('change', this.onInputChange.bind(this), true);
    // select
    this.registerEventListener('change', this.onSelectChange.bind(this), true);
    this.registerEventListener('focus', this.onSelectFocus.bind(this), true);

    // editContent
    this.registerEventListener('focus', this.onContentEditableElementFocus.bind(this), true);
    this.registerEventListener('blur', this.onContentEditableElementBlur.bind(this), true);
  }

  Inputs(event: Event) {
    const inputEl = event.target as IChangeElement;
    if (!inputEl.changeEventPromise) {
      inputEl.changeEventPromise = new Promise((r) => (inputEl.changeEventPromiseResolve = r));
    }
  }

  onInput(event: Event) {
    const inputEl = event.target as IChangeElement;
    /**
     * 给表单回车键使用
     */
    this.inputValue = inputEl.value;
    const tagName = inputEl.tagName.toLowerCase();
    const { type } = inputEl;
    if (('input' === tagName && inputTypes.includes(type)) || 'textarea' === tagName) {
      // @ts-ignore
      if (event.inputType !== 'insertCompositionText') {
        recordState.recordElementCommand('type', inputEl, this.inputValue);
        if (typeof inputEl.changeEventPromiseResolve === 'function') {
          inputEl.changeEventPromiseResolve();
          inputEl.changeEventPromise = undefined;
          inputEl.changeEventPromiseResolve = undefined;
        }
      }
    }
  }

  onCompositionend(event: Event) {
    const inputEl = event.target as IChangeElement;
    /**
     * 给表单回车键使用
     */
    this.inputValue = inputEl.value;
    recordState.recordElementCommand('type', inputEl, this.inputValue);
    if (typeof inputEl.changeEventPromiseResolve === 'function') {
      inputEl.changeEventPromiseResolve();
      inputEl.changeEventPromise = undefined;
      inputEl.changeEventPromiseResolve = undefined;
    }
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const tagName = target.tagName.toLowerCase();
    const { type } = target;
    if ('input' === tagName && inputTypeValue.includes(type)) {
      recordState.recordElementCommand('type', target, target.value);
      recordState.preventClickEvent(100);
    }
  }

  onSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target || target.tagName.toLowerCase() !== 'select') {
      return;
    }
    if (target.multiple) {
      const { options } = target;
      for (const option of options) {
        if (option._wasSelected !== option.selected) {
          const value = this.getOptionLocator(option);
          const command = option.selected ? 'addSelection' : 'removeSelection';
          recordState.recordElementCommand(command, target, value);
          option._wasSelected = option.selected;
        }
      }
    } else {
      const option = target.selectedOptions[0];
      const value = this.getOptionLocator(option);
      recordState.recordElementCommand('select', target, value);
    }
  }

  // Copyright 2005 Shinya Kasatani
  getOptionLocator(option: HTMLOptionElement) {
    const label = option.text.replace(/^ *(.*?) *$/, '$1');
    if (label.match(/\xA0/)) {
      // if the text contains &nbsp;
      return `label=regexp:${label
        // eslint-disable-next-line no-useless-escape
        .replace(/[\(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, (str) => `\\${str}`)
        .replace(/\s+/g, (str) => {
          if (str.match(/\xA0/)) {
            if (str.length > 1) {
              return '\\s+';
            }
            return '\\s';
          }
          return str;
        })}`;
    }
    return `label=${label}`;
  }

  onSelectFocus(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (!target || target.tagName?.toLowerCase() !== 'select') {
      return;
    }
    const { options } = target;
    for (const option of options) {
      if (option._wasSelected === null) {
        option._wasSelected = option.selected;
      }
    }
  }

  onContentEditableElementFocus(event: Event) {
    const target = event.target as HTMLElement;
    if (target.isContentEditable) {
      this.editableElement = target;
      this.editableElementContent = target.innerHTML;
      this.isEditableElementFocus = true;
    }
  }

  onContentEditableElementBlur(event: Event) {
    const { isEditableElementFocus, editableElement, editableElementContent } = this;
    if (
      isEditableElementFocus &&
      editableElement === event.target &&
      editableElementContent !== editableElement.innerHTML
    ) {
      recordState.recordElementCommand('editContent', editableElement, editableElement.innerHTML);
    }
  }
}

export const inputEvents = new InputCollection();

declare global {
  interface HTMLOptionElement {
    _wasSelected: boolean;
  }
}
