import { EventCollection } from '../EventCollection';
import { recordState } from '../RecordState';

export class MouseEvents extends EventCollection {
  dragRelateX?: number;
  dragRelateY?: number;
  dropLocator?: any;
  dragstartEvent?: DragEvent;
  relateX?: number;
  relateY?: number;
  mousedownEvent?: MouseEvent;
  isMousemove?: boolean;
  moveDownRect?: any;

  constructor() {
    super();
    this.registerEventListener('dragstart', this.onDragStart.bind(this), true);
    this.registerEventListener('drop', this.onDrop.bind(this), true);
    this.registerEventListener('mousedown', this.mousedown.bind(this), true);
    this.registerEventListener('mousemove', this.mousemove.bind(this), true);
    this.registerEventListener('mouseup', this.mouseup.bind(this), true);
  }

  onDragStart(event: DragEvent) {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.dragRelateX = event.pageX - rect.left - window.scrollX;
    this.dragRelateY = event.pageY - rect.top - window.scrollY;
    this.dropLocator = setTimeout(() => {
      this.dragstartEvent = event;
    }, 200);
  }

  onDrop(event: DragEvent) {
    if (this.dropLocator) {
      clearTimeout(this.dropLocator);
    }
    if (this.dragstartEvent && event.button === 0 && this.dragstartEvent.target !== event.target) {
      const moveX = event.clientX - this.dragstartEvent!.clientX;
      const moveY = event.clientY - this.dragstartEvent!.clientY;
      recordState.recordElementCommand(
        'drag',
        this.dragstartEvent.target,
        `{"startX":${this.dragRelateX},"startY":${this.dragRelateY},"moveX":${moveX},"moveY":${moveY}}`,
      );
    }
    delete this.dragstartEvent;
    delete this.dragRelateX;
    delete this.dragRelateY;
  }

  mousedown(event: MouseEvent) {
    if (!isInView(event)) {
      return;
    }
    const target = event.target as HTMLElement;
    this.moveDownRect = target.getBoundingClientRect();
    this.relateX = event.pageX - this.moveDownRect.left - window.scrollX;
    this.relateY = event.pageY - this.moveDownRect.top - window.scrollY;

    this.mousedownEvent = event;
  }

  mousemove(event: MouseEvent) {
    if (this.mousedownEvent && isMouseMoved(this.mousedownEvent, event)) {
      this.isMousemove = true;
    } else {
      this.isMousemove = false;
    }
  }

  mouseup(event: MouseEvent) {
    const isPass = event.button === 0 && this.mousedownEvent?.target && this.isMousemove && isInView(event);
    try {
      if (!isPass) {
        return;
      }
      const moveX = event.clientX - this.mousedownEvent!.clientX;
      const moveY = event.clientY - this.mousedownEvent!.clientY;
      const target = event.target as HTMLElement;
      // 如果在同一node内，且node在mousedown时的位置和up时的位置没有偏差
      // 目前不覆盖在类似于画板内移动的
      if (
        this.mousedownEvent!.target === event.target &&
        JSON.stringify(this.moveDownRect) === JSON.stringify(target.getBoundingClientRect())
      ) {
        return;
      }
      recordState.recordElementCommand(
        'drag',
        this.mousedownEvent!.target,
        `{"startX":${this.relateX},"startY":${this.relateY},"moveX":${moveX},"moveY":${moveY}}`,
      );
      recordState.preventClickEvent(100);
    } catch (error) {
    } finally {
      delete this.relateX;
      delete this.relateY;
      delete this.mousedownEvent;
      this.isMousemove = false;
    }
  }
}

function isMouseMoved(startEvent: MouseEvent, endEvent: MouseEvent) {
  return (
    startEvent.clientX !== endEvent.clientX ||
    startEvent.clientY !== endEvent.clientY ||
    startEvent.offsetX !== endEvent.offsetX ||
    startEvent.offsetY !== endEvent.offsetY ||
    startEvent.pageX !== endEvent.pageX ||
    startEvent.pageY !== endEvent.pageY
  );
}

function isInView(event: MouseEvent) {
  return event.clientX < document.documentElement.clientWidth && event.clientY < document.documentElement.clientHeight;
}

export const mouseEvents = new MouseEvents();
