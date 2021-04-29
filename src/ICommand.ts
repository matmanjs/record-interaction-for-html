export interface IBaseCommand {
  /**
   * 指令名称
   */
  command: string;
  /**
   * 一般作为element selector
   */
  target: string;
  /**
   * 一般作为元素的text或表单元素的value
   */
  value: string;
  /**
   * 一般作为element selector
   */
  targetCandidates?: string[];
  /**
   * 元素的位置,通过HtmlElement.getBoundingClientRect方法获取，string类型兼容老格式
   */
  location?: IDomLocation | string;

  [key: string]: any;
}

export interface IDomLocation {
  left: number;
  top: number;
  width: number;
  height: number;
  innerWidth: number;
}

export type ICommand = IBaseCommand;

/**
 * content-script 派发的command消息
 */
export interface ICommandMessage {
  command: string;
  frameLocation: string;
  target: any[];
  value: string;
  character?: { [key: string]: any };
}
