export * from './utils';
export * from './minimist-mod';

import { minimist } from './minimist-mod';
import { getMinimistOpts, processArgs, processArgPaths } from './utils';

export default (questions, ...payload) => {
  const opts = getMinimistOpts(questions);
  let argv = processArgs(questions, minimist(payload || [], opts));
  processArgPaths(questions, argv);
  // TODO add option for validateArgs
  return argv;
};
