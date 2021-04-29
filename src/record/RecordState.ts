import { ICommand } from '../ICommand';
import { getCommandTarget } from '../utils';
import CommandTask from './CommandTask';

export interface ElementCommand {
  command: string;
  targetElement: any;
  value: string;
}

export class RecordState {
  frameLocation: string = this.getFrameLocation();

  queue: CommandTask[] = [];

  lastCommand?: ICommand;

  isPreventClick = false;

  recordElementCommand(command: string, targetElement: any, value: string) {
    const info = getCommandTarget(targetElement);
    this.recordCommand({
      command,
      target: info.target,
      value,
      targetCandidates: info.targetCandidates,
      location: info.location,
    });
  }

  recordElementCommandWithType(elementCommand: ElementCommand | Promise<ElementCommand>) {
    const elementCommandCreated = new Promise<ElementCommand>((resolve) => resolve(elementCommand));
    const commandCreated = elementCommandCreated.then((result) => {
      const info = getCommandTarget(result.targetElement);
      return {
        command: result.command,
        target: info.target,
        value: result.value,
        targetCandidates: info.targetCandidates,
        location: info.location,
      };
    });
    this.recordCommand(commandCreated);
  }

  recordCommand(command: ICommand | Promise<ICommand>) {
    const currentTask = new CommandTask(command, [...this.queue]);
    currentTask.run(this.doRecord);
    currentTask.onFinished(this.removeTaskFromQueue);
    this.queue.push(currentTask);
  }

  doRecord = (command: ICommand) => {
    const rawCommand = {
      ...command,
      frameLocation: this.frameLocation,
      timeStamp: Date.now(),
    };
    this.lastCommand = rawCommand;

    // window.sendProxyMsg('Rifh:addCommand', rawCommand);
  };

  removeTaskFromQueue = (task: CommandTask) => {
    this.queue = this.queue.filter((item) => item !== task);
  };

  /**
   * 阻止点击录制事件一段时间
   * @param duration
   */
  preventClickEvent(duration = 100) {
    this.isPreventClick = true;
    setTimeout(() => {
      this.isPreventClick = false;
    }, duration);
  }

  private getFrameLocation() {
    let currentWindow: Window = window;
    let currentParentWindow: Window;
    let frameLocation = '';
    while (currentWindow !== window.top) {
      currentParentWindow = currentWindow.parent;
      for (let idx = 0; idx < currentParentWindow.frames.length; idx++) {
        if (currentParentWindow.frames[idx] === currentWindow) {
          frameLocation = `:${idx}${frameLocation}`;
          currentWindow = currentParentWindow;
          break;
        }
      }
    }
    return (frameLocation = `root${frameLocation}`);
  }
}

export const recordState = new RecordState();
