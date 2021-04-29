import { IDomLocation } from './ICommand';

// @ts-ignore
import LocatorBuilders from './js/locator-builders';

const locatorBuilders = new LocatorBuilders(window);

const lastWindowSize = {
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
};

export const throttle = (method: (...args: any[]) => any, delay: number, duration?: number) => {
  let timer: any = null;
  let begin: any = null;

  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    // eslint-disable-next-line prefer-rest-params
    const args = arguments as any;
    const current: any = new Date();

    if (!begin) {
      begin = current;
    }

    if (timer) {
      clearTimeout(timer);
    }

    if (duration && current - begin >= duration) {
      method.apply(context, args);
      begin = null;
    } else {
      timer = setTimeout(() => {
        method.apply(context, args);
        begin = null;
      }, delay);
    }
  };
};

/**
 * 获取command的target
 * @param el
 */
export function getCommandTarget(el: any): { target: string; targetCandidates?: string[]; location?: IDomLocation } {
  if (!el) {
    return {
      target: '',
    };
  }
  const locators = locatorBuilders.buildAll(el);
  let targetCandidates: string[] = [];
  if (Array.isArray(locators) && Array.isArray(locators[0])) {
    targetCandidates = locators.map((item) => item[0]);
  }
  const target = targetCandidates?.[0] || '';
  const location = calculateCoords(el);

  const val = {
    target,
    targetCandidates,
    location,
  };
  return val;
}

/**
 * 获取元素坐标
 * @param target
 */
export function calculateCoords(target: HTMLElement) {
  if (typeof target?.getBoundingClientRect !== 'function') {
    return;
  }
  const { innerWidth } = window;
  const { left, top, width, height } = target.getBoundingClientRect();
  const domLocation = {
    left,
    top,
    width,
    height,
    innerWidth,
  };
  return domLocation;
}

export function isWindowSizeNotChanged() {
  const isWidthNotChanged = lastWindowSize.innerWidth === window.innerWidth;
  const isHeightNotChanged = lastWindowSize.innerHeight === window.innerHeight;
  return isWidthNotChanged && isHeightNotChanged;
}

export function cacheWindowSize() {
  lastWindowSize.innerWidth = window.innerWidth;
  lastWindowSize.innerHeight = window.innerHeight;
}
