// import { ICommand } from '../../ICommand';
// import { throttle } from '../../utils';
// import { EventCollection } from '../EventCollection';
// import { ElementCommand, recordState } from '../RecordState';
//
// const THROTTLE_DURATION = 300;
//
// const COMMAND_SCROLL = 'scrollTo';
// const COMMAND_TARGET_WINDOW = 'html';
//
// // 同一批mousewheel事件与scroll事件经过测试，1000条滚动，平均间隔7.5ms, 最大间隔22ms
// const RESET_SCROLL_WHEEL_TIMEOUT = 30;
//
// type Point = {
//   x: number;
//   y: number;
// };
//
// export class ScrollEvents extends EventCollection {
//   static getScrollPoint = (target: EventTarget) => {
//     const point: Point = { x: 0, y: 0 };
//     if (ScrollEvents.isWindowsScroll(target)) {
//       point.x = window.scrollX;
//       point.y = window.scrollY;
//     } else {
//       point.x = target.scrollLeft;
//       point.y = target.scrollTop;
//     }
//     return point;
//   };
//
//   static isWindowsScroll = (target: EventTarget) => target === document;
//
//   static getCommandTargetConfig = (target: EventTarget) => {
//     if (ScrollEvents.isWindowsScroll(target)) {
//       return {
//         target: COMMAND_TARGET_WINDOW,
//       };
//     }
//
//     return {
//       targetElement: target,
//     };
//   };
//
//   static isScrollAxisChange = (currentScrollDistanceX: number, lastScrollDistanceX: number) => {
//     const isCurrentScrollOnAxisY = Math.sign(currentScrollDistanceX) === 0;
//     const isLastScrollOnAxisY = Math.sign(lastScrollDistanceX) === 0;
//     return isCurrentScrollOnAxisY !== isLastScrollOnAxisY;
//   };
//
//   isScrollByWheel = false;
//   isScrollByBar = false;
//   scrollEnd?: Promise<unknown>;
//   scrollEndResolver?: (command: unknown) => unknown;
//   mouseWheelEndReject?: () => unknown;
//   elementPendingToRecord?: Element;
//   resolveScrollDebounce: (command: unknown) => unknown;
//   // 使用引用数据类型地址作为键值对的Key
//   elementScrollPointMap: WeakMap<object, Point> = new WeakMap();
//   pendingCommandScrollDirection?: { distanceX: number; distanceY: number };
//
//   constructor() {
//     super();
//     this.registerEventListener('scroll', this.onScroll, true);
//
//     // throttle方法不传第三个参数实际则为debounce
//     this.resolveScrollDebounce = throttle(this.resolveScroll, THROTTLE_DURATION);
//
//     this.iniScrollHelper();
//   }
//
//   // 用于辅助判断滚动事件是否来自鼠标滚轮，与拖动滚动条;其余触发的滚动事件需要全部屏蔽
//   iniScrollHelper = () => {
//     this.registerEventListener('mousewheel', this.onMouseWheel, true);
//     this.registerEventListener('mousedown', () => (this.isScrollByBar = true), true);
//     this.registerEventListener('mouseup', () => (this.isScrollByBar = false), true);
//   };
//
//   /**
//    * 该方法主要用于区分滚动事件是否来自与用户鼠标的滚轮事件
//    * 标识对象：isScrollByWheel
//    * 标识对象由 mousewheel 事件，与scroll事件共同维护；mousewheel将标识置为true，scroll事件将标识置为false
//    * 特殊场景：当滚动到无法再滚动时，鼠标滚轮继续滚动，mousewheel事件仍会继续触发，scroll事件不再触发，导致标识对象 isScrollByWheel 错误，一直停留在true的状态
//    * 解决方式：onMouseWheel增加维护标识的逻辑
//    */
//   onMouseWheel = async () => {
//     this.isScrollByWheel = true;
//     if (this.mouseWheelEndReject) this.mouseWheelEndReject();
//
//     try {
//       await new Promise((resolve, reject) => {
//         this.mouseWheelEndReject = reject;
//         setTimeout(resolve, RESET_SCROLL_WHEEL_TIMEOUT);
//       });
//       this.isScrollByWheel = false;
//     } catch (err) {
//       console.log(err);
//     }
//   };
//
//   isScrollNeedNotToRecord = (event: Event) => {
//     if (!event.isTrusted) {
//       return true;
//     }
//
//     if (!event.target) {
//       return true;
//     }
//
//     if (this.elementCanNotScroll(event.target)) {
//       return true;
//     }
//
//     return !this.isScrollByWheel && !this.isScrollByBar;
//   };
//
//   elementCanNotScroll = (target: EventTarget) => {
//     if (!target) return true;
//     const heightCanNotScroll = target.scrollHeight <= target.clientHeight;
//     const widthCanNotScroll = target.scrollWidth <= target.clientWidth;
//     return heightCanNotScroll && widthCanNotScroll;
//   };
//
//   onScroll = (event: Event) => {
//     // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
//     const { target } = event;
//
//     if (!target) {
//       return;
//     }
//
//     this.abandonOperationToResetWheelFlg();
//
//     if (this.isScrollNeedNotToRecord(event)) {
//       this.resetScrollByWheelFlag();
//       this.cacheElementScrollPointMap(target);
//       return;
//     }
//
//     this.resetScrollByWheelFlag();
//
//     if (this.isNowNoScrollCommandPendingToRecord()) {
//       this.recordNewCommandInPending(target);
//       this.setPendingCommandScrollDistance(target);
//       this.cacheElementScrollPointMap(target);
//       this.cacheElementUseInPendingCommand(target);
//       return;
//     }
//
//     if (this.isNeedToResolvePendingCommandImmediately(target)) {
//       this.resolvePendingCommandImmediately();
//       this.recordNewCommandInPending(target);
//       this.setPendingCommandScrollDistance(target);
//       this.cacheElementScrollPointMap(target);
//       this.cacheElementUseInPendingCommand(target);
//       return;
//     }
//
//     this.resolveScrollDebounce(target);
//     this.cacheElementUseInPendingCommand(target);
//     this.setPendingCommandScrollDistance(target);
//     this.cacheElementScrollPointMap(target);
//   };
//
//   abandonOperationToResetWheelFlg = () => {
//     if (this.mouseWheelEndReject) this.mouseWheelEndReject();
//   };
//
//   resetScrollByWheelFlag = () => {
//     this.isScrollByWheel = false;
//   };
//
//   setPendingCommandScrollDistance = (target: EventTarget) => {
//     if (!this.elementPendingToRecord) return;
//     const lastPoint = this.elementScrollPointMap.get(this.elementPendingToRecord);
//     if (!lastPoint) return;
//
//     const currentPoint = ScrollEvents.getScrollPoint(target);
//     this.pendingCommandScrollDirection = {
//       distanceX: currentPoint.x - lastPoint.x,
//       distanceY: currentPoint.y - lastPoint.y,
//     };
//   };
//
//   cacheElementScrollPointMap = (target: EventTarget) => {
//     const point = ScrollEvents.getScrollPoint(target);
//     this.elementScrollPointMap.set(target, point);
//   };
//
//   isNeedToResolvePendingCommandImmediately = (target: EventTarget) => {
//     if (this.isNotSameElementToPendingCommand(target)) {
//       return true;
//     }
//
//     const currentPoint = ScrollEvents.getScrollPoint(target);
//
//     // 实际用户操作只可能出现X轴或者Y轴的滚动，不会出现X轴Y轴同时滚动的情况
//     if (this.isScrollAxisChanged(currentPoint)) {
//       return true;
//     }
//
//     if (this.isCurrentScrollDirectionReverseWithPendingCommand(currentPoint)) {
//       return true;
//     }
//
//     return false;
//   };
//
//   isScrollAxisChanged = (currentPoint: Point) => {
//     const lastPoint = this.elementScrollPointMap.get(this.elementPendingToRecord as object) as Point;
//     if (!lastPoint) {
//       return false;
//     }
//
//     if (!this.pendingCommandScrollDirection) {
//       return false;
//     }
//
//     const currentScrollDistanceX = currentPoint.x - lastPoint.x;
//     const scrollAxisChanged = ScrollEvents.isScrollAxisChange(
//       currentScrollDistanceX,
//       this.pendingCommandScrollDirection?.distanceX,
//     );
//
//     return scrollAxisChanged;
//   };
//
//   isCurrentScrollDirectionReverseWithPendingCommand = (currentPoint: Point) => {
//     if (!this.pendingCommandScrollDirection) {
//       return false;
//     }
//
//     const lastPoint = this.elementScrollPointMap.get(this.elementPendingToRecord as object) as Point;
//     const currentScrollDistanceX = currentPoint.x - lastPoint?.x;
//     const currentScrollDistanceY = currentPoint.y - lastPoint?.y;
//
//     const lastScrollDistanceX = this.pendingCommandScrollDirection?.distanceX;
//     const lastScrollDistanceY = this.pendingCommandScrollDirection?.distanceY;
//
//     // 两次滚动轴在同一轴上面，判断两次滚动轴是在X｜Y
//     if (Math.sign(currentScrollDistanceX) === 0) {
//       // 当前滚动的是Y轴，上一次滚动的也是Y轴，判断两次的滚动方向是否一致
//       return Math.sign(currentScrollDistanceY) !== Math.sign(lastScrollDistanceY);
//     }
//
//     // 当前滚动的是X轴，上一次滚动的也是X轴，判断两次的滚动方向是否一致
//     return Math.sign(currentScrollDistanceX) !== Math.sign(lastScrollDistanceX);
//   };
//
//   isNotSameElementToPendingCommand = (target: EventTarget) => this.elementPendingToRecord !== target;
//
//   resolvePendingCommandImmediately = () => {
//     this.resolveLastCommand();
//   };
//
//   recordNewCommandInPending = (target: EventTarget) => {
//     this.scrollEnd = new Promise((resolve) => {
//       this.scrollEndResolver = resolve;
//       this.resolveScrollDebounce(target);
//     });
//     this.recordCommand(target);
//     return;
//   };
//
//   isNowNoScrollCommandPendingToRecord = () => !this.scrollEnd;
//
//   cacheElementUseInPendingCommand = (target: EventTarget) => {
//     this.elementPendingToRecord = target;
//   };
//
//   recordCommand = (target: EventTarget) => {
//     if (ScrollEvents.isWindowsScroll(target)) {
//       recordState.recordCommand(this.scrollEnd as Promise<ICommand>);
//     } else {
//       recordState.recordElementCommandWithType(this.scrollEnd as Promise<ElementCommand>);
//     }
//   };
//
//   resolveScroll = (target: HTMLElement) => {
//     const scrollPoint = ScrollEvents.getScrollPoint(document);
//     const command = {
//       command: COMMAND_SCROLL,
//       value: `${scrollPoint.x},${scrollPoint.y}`,
//     };
//
//     const targetConfig = ScrollEvents.getCommandTargetConfig(target);
//     Object.assign(command, targetConfig);
//
//     this.resolveAndResetPromiseHolder(command);
//   };
//
//   resolveLastCommand = () => {
//     if (!this.elementPendingToRecord) return;
//     const lastPoint = this.elementScrollPointMap.get(this.elementPendingToRecord);
//
//     if (!lastPoint) return;
//
//     const command = {
//       command: COMMAND_SCROLL,
//       value: `${lastPoint.x},${lastPoint.y}`,
//     };
//     const targetConfig = ScrollEvents.getCommandTargetConfig(this.elementPendingToRecord);
//     Object.assign(command, targetConfig);
//
//     this.resolveAndResetPromiseHolder(command);
//   };
//
//   resolveAndResetPromiseHolder = (command: unknown) => {
//     if (!this.scrollEndResolver) return;
//
//     this.scrollEndResolver(command);
//     this.scrollEnd = undefined;
//   };
// }
//
// export const scrollEvents = new ScrollEvents();
