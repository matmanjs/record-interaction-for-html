export class EventCollection {
  private eventMap = new Map<keyof WindowEventMap,
    Set<{
      type: keyof WindowEventMap;
      listener: (this: Window, ev: WindowEventMap[keyof WindowEventMap]) => any;
      options?: boolean | AddEventListenerOptions;
    }>>();

  private isAttach = false;

  registerEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options: boolean | AddEventListenerOptions = false,
  ) {
    let set = this.eventMap.get(type);
    if (!set) {
      set = new Set();
      this.eventMap.set(type, set);
    }

    set?.add({
      type,
      // @ts-ignore
      listener,
      options,
    });
  }

  attach(): void {
    if (this.isAttach) {
      return;
    }
    this.eventMap.forEach((set) => {
      set.forEach((eventInfo) => {
        window.addEventListener(eventInfo.type, eventInfo.listener, eventInfo.options);
      });
    });
    this.isAttach = true;
  }

  detach(): void {
    if (!this.isAttach) {
      return;
    }
    this.eventMap.forEach((set) => {
      set.forEach((eventInfo) => {
        window.removeEventListener(eventInfo.type, eventInfo.listener, eventInfo.options);
      });
    });
    this.isAttach = false;
  }
}
