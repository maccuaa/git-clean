import shell from "shelljs";

const execAsync = (cmd, opts = {}) => {
  return new Promise(function (resolve, reject) {
    // Execute the command, reject if we exit non-zero (i.e. error)
    shell.exec(cmd, opts, function (code, stdout, stderr) {
      if (code != 0) return reject(new Error(stderr));
      return resolve(stdout);
    });
  });
};

export const exec = (cmd, opts = {}) => {
  return shell.exec(cmd, opts);
};

export default execAsync;
