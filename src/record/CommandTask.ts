import { ICommand } from '../ICommand';

export default class CommandTask {
  ready: Promise<ICommand>;
  finished: Promise<any>;
  command?: ICommand;
  finishedResolver?: (task?: CommandTask) => void;
  terminated = false;

  constructor(command: ICommand | Promise<ICommand>, waitedTasks: CommandTask[]) {
    const taskPromises = waitedTasks.map((item) => item.finished);

    this.ready = Promise.all(taskPromises).then(() => Promise.resolve(command));

    this.finished = new Promise<any>((resolve) => (this.finishedResolver = resolve));

    if (command.then) return;
    this.command = command as ICommand;
  }

  onFinished = async (action: (d: CommandTask) => void) => {
    await this.finished;
    action(this);
  };

  run = async (action: (d: ICommand) => void) => {
    if (this.terminated) return;
    const command: ICommand = await this.ready;
    action(command);
    this.terminated = true;

    if (this.finishedResolver) {
      this.finishedResolver();
    }
  };

  terminate = () => {
    this.terminated = true;

    if (this.finishedResolver) {
      this.finishedResolver();
    }
  };
}
